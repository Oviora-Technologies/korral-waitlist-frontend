import { ObjectId } from 'mongodb';
import { db } from '../config/database';
import { duplicateKey } from './waitlistService';

export type OrganizationInput = {
  type: 'community' | 'group';
  name: string;
  slug: string;
  creator: { fullName: string; email: string; phone: string };
};

/**
 * A creator is registered as an individual before their organization is created.
 * Compensation removes that new registration if creating the organization fails.
 * For multi-document atomicity in production use MongoDB transactions on a replica set.
 */
export async function createCommunityOrGroup(input: OrganizationInput) {
  const { creator, type, name, slug } = input;
  const now = new Date();
  let userId: ObjectId | undefined;
  try {
    const user = await db.collection('registrations').insertOne({
      name: creator.fullName,
      fullName: creator.fullName,
      email: creator.email,
      phone: creator.phone,
      source: { type: 'direct' },
      consentedAt: now,
      status: 'pending',
      createdAt: now
    });
    userId = user.insertedId;

    const organization = await db.collection('organizations').insertOne({
      type,
      name,
      slug,
      adminUserId: userId,
      createdBy: userId,
      adminStatus: 'pending_verification',
      createdAt: now
    });

    await db.collection('registrations').updateOne(
      { _id: userId },
      { $addToSet: { managedOrganizationIds: organization.insertedId } }
    );
    return {
      organizationId: organization.insertedId.toHexString(),
      userId: userId.toHexString(),
      type, name, slug,
      adminStatus: 'pending_verification'
    };
  } catch (error) {
    if (userId) await db.collection('registrations').deleteOne({ _id: userId }).catch(() => {});
    throw error;
  }
}

export { duplicateKey };
