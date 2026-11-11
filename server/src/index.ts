import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { MongoClient } from 'mongodb';
import { z } from 'zod';

const app = express();
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173' }));
app.use(express.json());
const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
const db = client.db(process.env.MONGODB_DB || 'vila_waitlist');
const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().email().transform(s => s.toLowerCase()),
  organizationType: z.enum(['community', 'group']).optional(),
  organizationSlug: z.string().max(100).optional()
});
app.get('/api/organization/:type/:slug', async (req, res) => {
  const { type, slug } = req.params;
  if (!['community','group'].includes(type)) return void res.status(400).json({ error: 'Invalid link' });
  const org = await db.collection('organizations').findOne({ type, slug }, { projection: { _id: 0, name: 1, type: 1, slug: 1 } });
  if (!org) return void res.status(404).json({ error: 'Link not found' });
  res.json(org);
});
app.post('/api/join', async (req, res) => {
  const result = schema.safeParse(req.body);
  if (!result.success) return void res.status(400).json({ error: 'Check your details' });
  const data = result.data;
  const org = data.organizationType && data.organizationSlug
    ? await db.collection('organizations').findOne({ type: data.organizationType, slug: data.organizationSlug })
    : null;
  if ((data.organizationType || data.organizationSlug) && !org) return void res.status(404).json({ error: 'Invalid community or group link' });
  try {
    await db.collection('registrations').insertOne({ name: data.name, email: data.email, source: org ? { type: org.type, slug: org.slug, organizationId: org._id } : { type: 'direct' }, createdAt: new Date() });
    res.status(201).json({ message: 'You are on the list!' });
  } catch (error: any) {
    res.status(error.code === 11000 ? 409 : 500).json({ error: error.code === 11000 ? 'This email is already registered' : 'Unable to register' });
  }
});
async function start() {
  await client.connect();
  await db.collection('registrations').createIndex({ email: 1 }, { unique: true });
  await db.collection('organizations').createIndex({ type: 1, slug: 1 }, { unique: true });
  app.listen(Number(process.env.PORT || 4000), () => console.log('VILA API running'));
}
start().catch(console.error);
