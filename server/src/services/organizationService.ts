import { db } from '../config/database';

export async function getOverview() {
  const [organizations, total, direct] = await Promise.all([
    db.collection('organizations').aggregate([
      { $lookup: { from: 'registrations', localField: '_id', foreignField: 'source.organizationId', as: 'registrations' } },
      { $project: { _id: 0, name: 1, type: 1, slug: 1, count: { $size: '$registrations' } } },
      { $sort: { name: 1 } }
    ]).toArray(),
    db.collection('registrations').countDocuments(),
    db.collection('registrations').countDocuments({ 'source.type': 'direct' })
  ]);
  return { organizations, total, direct };
}

export async function createOrganization(data: { name: string; type: 'community'|'group'; slug: string }) {
  await db.collection('organizations').insertOne({ ...data, createdAt: new Date() });
  return data;
}
