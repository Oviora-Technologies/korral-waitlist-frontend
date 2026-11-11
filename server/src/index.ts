import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { timingSafeEqual } from 'node:crypto';
import { MongoClient } from 'mongodb';
import { z } from 'zod';

const app = express();
app.disable('x-powered-by');
app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_ORIGIN || 'http://localhost:3000' }));
app.use(express.json({ limit: '16kb' }));

const client = new MongoClient(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017');
const db = client.db(process.env.MONGODB_DB || 'vila_waitlist');
const adminPassword = process.env.ADMIN_PASSWORD;
const jwtSecret = process.env.JWT_SECRET;
if (!adminPassword || adminPassword.length < 12 || !jwtSecret || jwtSecret.length < 32) {
  throw new Error('Set ADMIN_PASSWORD (12+ characters) and JWT_SECRET (32+ characters) in server/.env');
}

const waitlistSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().transform(value => value.toLowerCase()),
  consent: z.literal(true),
  organizationType: z.enum(['community', 'group']).optional(),
  organizationSlug: z.string().regex(/^[a-z0-9-]{2,80}$/).optional()
});
const orgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['community', 'group']),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80)
});
const joinLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 12, standardHeaders: 'draft-8', legacyHeaders: false });
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false });

function safeCompare(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function adminOnly(req: Request, res: Response, next: NextFunction) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';
  try {
    const payload = jwt.verify(token, jwtSecret!) as jwt.JwtPayload;
    if (payload.role !== 'admin') throw new Error('Invalid role');
    next();
  } catch {
    res.status(401).json({ error: 'Administrator login required' });
  }
}

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.get('/api/organization/:type/:slug', async (req, res) => {
  const { type, slug } = req.params;
  if (!['community', 'group'].includes(type) || !/^[a-z0-9-]{2,80}$/.test(slug)) {
    return void res.status(400).json({ error: 'Invalid invitation link' });
  }
  try {
    const organization = await db.collection('organizations').findOne(
      { type, slug },
      { projection: { _id: 0, name: 1, type: 1, slug: 1 } }
    );
    if (!organization) return void res.status(404).json({ error: 'Invitation not found' });
    res.json(organization);
  } catch { res.status(500).json({ error: 'Unable to load invitation' }); }
});

app.post('/api/join', joinLimiter, async (req, res) => {
  const parsed = waitlistSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Please check your registration details and consent' });
  const data = parsed.data;
  if (Boolean(data.organizationType) !== Boolean(data.organizationSlug)) {
    return void res.status(400).json({ error: 'Invalid invitation details' });
  }
  try {
    const organization = data.organizationType && data.organizationSlug
      ? await db.collection('organizations').findOne({ type: data.organizationType, slug: data.organizationSlug })
      : null;
    if (data.organizationType && !organization) return void res.status(404).json({ error: 'Invitation not found' });
    await db.collection('registrations').insertOne({
      name: data.name, email: data.email,
      source: organization
        ? { type: organization.type, slug: organization.slug, organizationId: organization._id }
        : { type: 'direct' },
      consentedAt: new Date(),
      status: 'pending',
      createdAt: new Date()
    });
    res.status(201).json({ message: 'You have joined the VILA waitlist!' });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : undefined;
    res.status(code === 11000 ? 409 : 500).json({
      error: code === 11000 ? 'This email is already on the waitlist' : 'Registration is temporarily unavailable'
    });
  }
});

app.post('/api/admin/login', loginLimiter, (req, res) => {
  const parsed = z.object({ password: z.string() }).safeParse(req.body);
  if (!parsed.success || !safeCompare(parsed.data.password, adminPassword!)) {
    return void res.status(401).json({ error: 'Invalid admin password' });
  }
  const token = jwt.sign({ role: 'admin' }, jwtSecret!, { expiresIn: '2h' });
  res.json({ token });
});

app.get('/api/admin/overview', adminOnly, async (_req, res) => {
  try {
    const [organizations, total, direct] = await Promise.all([
      db.collection('organizations').aggregate([
        { $lookup: {
          from: 'registrations', localField: '_id', foreignField: 'source.organizationId', as: 'registrations'
        }},
        { $project: { _id: 0, name: 1, type: 1, slug: 1, count: { $size: '$registrations' } } },
        { $sort: { name: 1 } }
      ]).toArray(),
      db.collection('registrations').countDocuments(),
      db.collection('registrations').countDocuments({ 'source.type': 'direct' })
    ]);
    res.json({ organizations, total, direct });
  } catch { res.status(500).json({ error: 'Unable to load dashboard' }); }
});

app.post('/api/admin/organizations', adminOnly, async (req, res) => {
  const parsed = orgSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Enter a name and a valid URL slug' });
  try {
    const data = parsed.data;
    await db.collection('organizations').insertOne({ ...data, createdAt: new Date() });
    res.status(201).json({ name: data.name, type: data.type, slug: data.slug });
  } catch (error: unknown) {
    const code = typeof error === 'object' && error !== null && 'code' in error ? (error as { code: unknown }).code : undefined;
    res.status(code === 11000 ? 409 : 500).json({
      error: code === 11000 ? 'This invitation slug is already in use' : 'Could not create invitation'
    });
  }
});

async function start() {
  await client.connect();
  await db.collection('registrations').createIndex({ email: 1 }, { unique: true });
  await db.collection('organizations').createIndex({ type: 1, slug: 1 }, { unique: true });
  app.listen(Number(process.env.PORT || 4000), () => console.log('VILA API running on port ' + (process.env.PORT || 4000)));
}
start().catch(error => { console.error(error); process.exit(1); });
