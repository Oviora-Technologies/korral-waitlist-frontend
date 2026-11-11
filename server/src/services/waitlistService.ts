import { db } from '../config/database';

export async function findOrganization(type: string, slug: string) {
  return db.collection('organizations').findOne({ type, slug });
}

export async function registerPerson(data: {
  name: string;
  email: string;
  organizationType?: 'community' | 'group';
  organizationSlug?: string;
}) {
  const organization =
    data.organizationType && data.organizationSlug
      ? await findOrganization(data.organizationType, data.organizationSlug)
      : null;

  if (data.organizationType && !organization) return false;

  await db.collection('registrations').insertOne({
    name: data.name,
    email: data.email,
    source: organization
      ? {
          type: organization.type,
          slug: organization.slug,
          organizationId: organization._id,
        }
      : { type: 'direct' },
    consentedAt: new Date(),
    status: 'pending',
    createdAt: new Date(),
  });
  return {
    organizationName: organization?.name as string | undefined,
    organizationType: organization?.type as string | undefined,
  };
}

export function duplicateKey(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 11000
  );
}
