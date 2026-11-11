import { MongoClient } from 'mongodb';

export const mongoClient = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
export const db = mongoClient.db(process.env.MONGODB_DB || 'vila_waitlist');

export async function connectDatabase() {
  await mongoClient.connect();
  await db.collection('registrations').createIndex({ email: 1 }, { unique: true });
  await db.collection('organizations').createIndex({ type: 1, slug: 1 }, { unique: true });
}
