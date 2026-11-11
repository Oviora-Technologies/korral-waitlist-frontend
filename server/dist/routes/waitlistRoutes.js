'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const express_rate_limit_1 = require('express-rate-limit');
const zod_1 = require('zod');
const emailService_1 = require('../services/email/emailService');
const waitlistService_1 = require('../services/waitlistService');
const router = (0, express_1.Router)();
const limiter = (0, express_rate_limit_1.rateLimit)({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const registrationSchema = zod_1.z.object({
  name: zod_1.z.string().trim().min(2).max(100),
  email: zod_1.z
    .string()
    .trim()
    .email()
    .transform((value) => value.toLowerCase()),
  consent: zod_1.z.literal(true),
  organizationType: zod_1.z.enum(['community', 'group']).optional(),
  organizationSlug: zod_1.z
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
    const organization = await (0, waitlistService_1.findOrganization)(
      type,
      slug,
    );
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
    const created = await (0, waitlistService_1.registerPerson)(data);
    if (!created)
      return void res.status(404).json({ error: 'Invitation not found' });
    // Registration is already saved: an email outage must not cause duplicate signups.
    const emailSent = await (0, emailService_1.sendSignupEmail)({
      name: data.name,
      email: data.email,
      organizationName: created.organizationName,
      organizationType: created.organizationType,
    });
    res
      .status(201)
      .json({ message: 'You have joined the VILA waitlist!', emailSent });
  } catch (error) {
    res.status((0, waitlistService_1.duplicateKey)(error) ? 409 : 500).json({
      error: (0, waitlistService_1.duplicateKey)(error)
        ? 'This email is already on the waitlist'
        : 'Registration is temporarily unavailable',
    });
  }
});
exports.default = router;
