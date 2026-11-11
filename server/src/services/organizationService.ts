import { ObjectId } from 'mongodb';
import { db } from '../config/database';

export type OrganizationInput = {
  type: 'community' | 'group';
  name: string;
  slug: string;
  creator: { fullName: string; email: string; phone: string };
};

/**
 * Register the creator as an individual, then create the organization
 * with adminUserId referencing the individual registration's _id.
 * Basic compensation is used for standalone local MongoDB instances.
 * A production deployment should use a MongoDB transaction and email verification.
 */
export async function createCommunityOrGroup(input: OrganizationInput) {
  const { creator, type, name, slug } = input;
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
      type, name, slug,
      adminStatus: 'pending_verification'
    };
  } catch (error) {
    if (organizationId) await db.collection('organizations').deleteOne({ _id: organizationId }).catch(() => {});
    if (userId) await db.collection('registrations').deleteOne({ _id: userId }).catch(() => {});
    throw error;
  }
}
