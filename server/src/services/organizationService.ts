import { ObjectId } from 'mongodb';
import { db } from '../config/database';
import { hashPassword, createSession } from './authService';

export type OrganizationInput = {
  type: 'community' | 'group';
  name: string;
  slug: string;
  description: string;
  location: { country: string; stateProvince: string; address: string };
  creator: { fullName: string; email: string; phone: string; password: string };
};

/**
 * Register the creator as an individual, then create the organization
 * with adminUserId referencing the individual registration's _id.
 * Basic compensation is used for standalone local MongoDB instances.
 * A production deployment should use a MongoDB transaction and email verification.
 */
export async function createCommunityOrGroup(input: OrganizationInput) {
  const { creator, type, name, slug, description, location } = input;
  const passwordHash = await hashPassword(creator.password);
  const now = new Date();
  let userId: ObjectId | undefined;
  let organizationId: ObjectId | undefined;

  try {
    // Check the slug before making the individual registration.
    const existing = await db.collection('organizations').findOne({ type, slug }, { projection: { _id: 1 } });
    if (existing) {
      const error = new Error('This invitation name is already in use');
      (error as Error & { code: number }).code = 11000;
      throw error;
    }

    const userResult = await db.collection('registrations').insertOne({
      name: creator.fullName,
      fullName: creator.fullName,
      email: creator.email,
      phone: creator.phone,
      passwordHash,
      source: { type: 'direct' },
      consentedAt: now,
      status: 'pending',
      createdAt: now
    });
    userId = userResult.insertedId;

    const orgResult = await db.collection('organizations').insertOne({
      type,
      name,
      slug,
      description,
      location,
      adminUserId: userId,
      createdBy: userId,
      adminStatus: 'pending_verification',
      createdAt: now
    });
    organizationId = orgResult.insertedId;

    const membership = await db.collection('registrations').updateOne(
      { _id: userId },
      { $addToSet: { managedOrganizationIds: organizationId } }
    );
    if (membership.matchedCount !== 1) throw new Error('Failed to link user and organization');

    return {
      organizationId: organizationId.toHexString(),
      userId: userId.toHexString(),
      type, name, slug, description, location,
      sessionToken: await createSession(userId),
      adminStatus: 'pending_verification'
    };
  } catch (error) {
    if (organizationId) await db.collection('organizations').deleteOne({ _id: organizationId }).catch(() => {});
    if (userId) await db.collection('registrations').deleteOne({ _id: userId }).catch(() => {});
    throw error;
  }
}


/** Only the authenticated organization creator can read members. */
export async function getManagedOrganization(type: string, slug: string, userId: ObjectId) {
  const org=await db.collection('organizations').findOne({type,slug,adminUserId:userId});
  if(!org)return null;
  const [memberCount, creator]=await Promise.all([
    db.collection('registrations').countDocuments({'source.organizationId':org._id}),
    db.collection('registrations').findOne({_id:userId},{projection:{_id:1,name:1}})
  ]);
  return {
    id:org._id.toHexString(),name:org.name,type:org.type,slug:org.slug,
    description:org.description||'',location:org.location||null,
    adminStatus:org.adminStatus||'pending_verification',
    creator:creator?{id:creator._id.toHexString(),name:creator.name}:null,
    memberCount:memberCount+(creator?1:0),joinedMemberCount:memberCount
  };
}
export async function getManagedMembers(type:string,slug:string,userId:ObjectId) {
  const org=await db.collection('organizations').findOne({type,slug,adminUserId:userId});
  if(!org)return null;
  const [creator,members]=await Promise.all([
    db.collection('registrations').findOne({_id:userId},{projection:{_id:1,name:1,createdAt:1}}),
    db.collection('registrations').find({'source.organizationId':org._id},{projection:{_id:1,name:1,createdAt:1}}).sort({createdAt:-1}).limit(100).toArray()
  ]);
  return [
    ...(creator?[{id:creator._id.toHexString(),name:creator.name,role:'admin',joinedAt:creator.createdAt}]:[]),
    ...members.map(person=>({id:person._id.toHexString(),name:person.name,role:'member',joinedAt:person.createdAt}))
  ];
}
