import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import { sendSignupEmail } from '../services/emailService';
import {
  findOrganization,
  registerPerson,
  duplicateKey,
} from '../services/waitlistService';

const router = Router();
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const registrationSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  consent: z.literal(true),
  organizationType: z.enum(['community', 'group']).optional(),
  organizationSlug: z
    .string()
    .regex(/^[a-z0-9-]{2,80}$/)
    .optional(),
});

router.get('/organization/:type/:slug', async (req, res) => {
  const { type, slug } = req.params;
  if (
    !['community', 'group'].includes(type) ||
    !/^[a-z0-9-]{2,80}$/.test(slug)
  ) {
    return void res.status(400).json({ error: 'Invalid invitation link' });
  }
  try {
    const organization = await findOrganization(type, slug);
    if (!organization)
      return void res.status(404).json({ error: 'Invitation not found' });
    res.json({
      name: organization.name,
      type: organization.type,
      slug: organization.slug,
    });
  } catch {
    res.status(500).json({ error: 'Unable to load invitation' });
  }
});

router.post('/join', limiter, async (req, res) => {
  const parsed = registrationSchema.safeParse(req.body);
  if (!parsed.success)
    return void res
      .status(400)
      .json({ error: 'Please check your registration details and consent' });
  const data = parsed.data;
  if (Boolean(data.organizationType) !== Boolean(data.organizationSlug)) {
    return void res.status(400).json({ error: 'Invalid invitation details' });
  }
  try {
    const created = await registerPerson(data);
    if (!created)
      return void res.status(404).json({ error: 'Invitation not found' });
    // Registration is already saved: an email outage must not cause duplicate signups.
    const emailSent = await sendSignupEmail({
      name: data.name,
      email: data.email,
      organizationName: created.organizationName,
      organizationType: created.organizationType,
    });
    res.status(201).json({ message: 'You have joined the VILA waitlist!', emailSent });
  } catch (error) {
    res.status(duplicateKey(error) ? 409 : 500).json({
      error: duplicateKey(error)
        ? 'This email is already on the waitlist'
        : 'Registration is temporarily unavailable',
    });
  }
});

export default router;
