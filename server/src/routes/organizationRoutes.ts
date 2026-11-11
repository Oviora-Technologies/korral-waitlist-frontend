import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { createCommunityOrGroup, getManagedOrganization, getManagedMembers } from '../services/organizationService';
import { duplicateKey } from '../services/waitlistService';

const router = Router();
const createLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, limit: 5,
  standardHeaders: 'draft-8', legacyHeaders: false
});
const creationSchema = z.object({
  type: z.enum(['community', 'group']),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().min(10).max(1500),
  location: z.object({
    country: z.string().trim().min(2).max(100),
    stateProvince: z.string().trim().min(2).max(100),
    address: z.string().trim().min(5).max(250)
  }),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80),
  creator: z.object({
    fullName: z.string().trim().min(2).max(100),
    email: z.string().trim().email().transform(value => value.toLowerCase()),
    phone: z.string().trim().regex(/^\+?[0-9 ()-]{7,22}$/)
  }),
  consent: z.literal(true)
});

router.post('/', createLimiter, async (req, res) => {
  const parsed = creationSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({ error: 'Please enter the required information and agree to receive updates.' });
  try {
    const organization = await createCommunityOrGroup(parsed.data);
    res.status(201).json(organization);
  } catch (error) {
    res.status(duplicateKey(error) ? 409 : 500).json({
      error: duplicateKey(error)
        ? 'That email or invitation name is already registered. Please use a new email or link name.'
        : 'Unable to create the community or group. Please try again.'
    });
  }
});


const managerParams = z.object({
  type: z.enum(['community','group']),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80)
});
router.get('/:type/:slug/details', async (req, res) => {
  const p = managerParams.safeParse(req.params);
  if (!p.success) return void res.status(400).json({ error: 'Invalid organization' });
  const token = req.get('x-management-token') || '';
  try {
    const details = await getManagedOrganization(p.data.type,p.data.slug,token);
    if (!details) return void res.status(403).json({ error: 'Access unavailable. Use the private creator session.' });
    res.json(details);
  } catch { res.status(500).json({ error: 'Unable to load organization' }); }
});

router.get('/:type/:slug/members', async (req, res) => {
  const p = managerParams.safeParse(req.params);
  if (!p.success) return void res.status(400).json({ error: 'Invalid organization' });
  const token = req.get('x-management-token') || '';
  try {
    const members = await getManagedMembers(p.data.type,p.data.slug,token);
    if (!members) return void res.status(403).json({ error: 'Access unavailable. Use the private creator session.' });
    res.json({ members });
  } catch { res.status(500).json({ error: 'Unable to load members' }); }
});

export default router;
