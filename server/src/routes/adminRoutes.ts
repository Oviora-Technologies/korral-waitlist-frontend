import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { adminOnly, passwordMatches } from '../middleware/adminAuth';
import { env } from '../config/env';
import { createOrganization, getOverview } from '../services/organizationService';
import { duplicateKey } from '../services/waitlistService';

const router = Router();
const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false });
const orgSchema = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(['community','group']),
  slug: z.string().trim().toLowerCase().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).min(2).max(80)
});

router.post('/login', loginLimiter, (req,res) => {
  const parsed = z.object({password:z.string()}).safeParse(req.body);
  if (!parsed.success || !passwordMatches(parsed.data.password)) {
    return void res.status(401).json({error:'Invalid admin password'});
  }
  res.json({token:jwt.sign({role:'admin'}, env.jwtSecret, {expiresIn:'2h'})});
});

router.get('/overview', adminOnly, async (_req,res) => {
  try { res.json(await getOverview()); }
  catch { res.status(500).json({error:'Unable to load dashboard'}); }
});

router.post('/organizations', adminOnly, async (req,res) => {
  const parsed = orgSchema.safeParse(req.body);
  if (!parsed.success) return void res.status(400).json({error:'Enter a name and a valid URL slug'});
  try {
    res.status(201).json(await createOrganization(parsed.data));
  } catch(error) {
    res.status(duplicateKey(error) ? 409 : 500).json({
      error: duplicateKey(error) ? 'This invitation slug is already in use' : 'Could not create invitation'
    });
  }
});

export default router;
