'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const express_1 = require('express');
const mongodb_1 = require('mongodb');
const database_1 = require('../config/database');
const emailService_1 = require('../services/email/emailService');
const express_rate_limit_1 = require('express-rate-limit');
const zod_1 = require('zod');
const organizationService_1 = require('../services/organizationService');
const waitlistService_1 = require('../services/waitlistService');
const authService_1 = require('../services/authService');
const router = (0, express_1.Router)();
const createLimiter = (0, express_rate_limit_1.rateLimit)({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
});
const creationSchema = zod_1.z.object({
  type: zod_1.z.enum(['community', 'group']),
  name: zod_1.z.string().trim().min(2).max(120),
  description: zod_1.z.string().trim().min(10).max(1500),
  location: zod_1.z.object({
    country: zod_1.z.string().trim().min(2).max(100),
    stateProvince: zod_1.z.string().trim().min(2).max(100),
    address: zod_1.z.string().trim().min(5).max(250),
  }),
  slug: zod_1.z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(2)
    .max(80),
  creator: zod_1.z
    .object({
      fullName: zod_1.z.string().trim().min(2).max(100),
      email: zod_1.z
        .string()
        .trim()
        .email()
        .transform((value) => value.toLowerCase()),
      phone: zod_1.z
        .string()
        .trim()
        .regex(/^\+?[0-9 ()-]{7,22}$/),
      password: zod_1.z.string().min(12).max(128),
    })
    .optional(),
  consent: zod_1.z.literal(true),
});
router.post('/', createLimiter, async (req, res) => {
  const parsed = creationSchema.safeParse(req.body);
  if (!parsed.success)
    return void res.status(400).json({
      error:
        'Please enter the required information and agree to receive updates.',
    });
  try {
    const token = (0, authService_1.sessionToken)(req);
    const session = token ? await (0, authService_1.findSession)(token) : null;
    if (!session && !parsed.data.creator)
      return void res
        .status(401)
        .json({ error: 'Please sign in or enter creator details.' });
    const organization = await (0,
    organizationService_1.createCommunityOrGroup)(
      parsed.data,
      session?.userId,
      session ? token : undefined,
    );
    // Never turn a successful database write into a failed request because of email.
    let emailSent = false;
    try {
      const creator = await database_1.db
        .collection('registrations')
        .findOne(
          { _id: new mongodb_1.ObjectId(organization.userId) },
          { projection: { name: 1, email: 1 } },
        );
      if (creator?.email) {
        emailSent = await (0, emailService_1.sendOrganizationCreatedEmail)({
          name: creator.name,
          email: creator.email,
          type: organization.type,
          organizationName: organization.name,
          slug: organization.slug,
        });
      }
    } catch (emailError) {
      console.error(
        'VILA organization was created, but notification could not be sent:',
        emailError instanceof Error ? emailError.message : 'Unknown error',
      );
    }
    res.status(201).json({ ...organization, emailSent });
  } catch (error) {
    res.status((0, waitlistService_1.duplicateKey)(error) ? 409 : 500).json({
      error: (0, waitlistService_1.duplicateKey)(error)
        ? 'That email or invitation name is already registered. Please use a new email or link name.'
        : 'Unable to create the community or group. Please try again.',
    });
  }
});
const managerParams = zod_1.z.object({
  type: zod_1.z.enum(['community', 'group']),
  slug: zod_1.z
    .string()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .min(2)
    .max(80),
});
router.get(
  '/:type/:slug/details',
  authService_1.ownerOnly,
  async (req, res) => {
    const p = managerParams.safeParse(req.params);
    if (!p.success)
      return void res.status(400).json({ error: 'Invalid organization' });
    try {
      const details = await (0, organizationService_1.getManagedOrganization)(
        p.data.type,
        p.data.slug,
        res.locals.userId,
      );
      if (!details)
        return void res.status(403).json({
          error: "Only this organization's creator may view this information.",
        });
      res.json(details);
    } catch {
      res.status(500).json({ error: 'Unable to load organization' });
    }
  },
);
router.get(
  '/:type/:slug/members',
  authService_1.ownerOnly,
  async (req, res) => {
    const p = managerParams.safeParse(req.params);
    if (!p.success)
      return void res.status(400).json({ error: 'Invalid organization' });
    try {
      const members = await (0, organizationService_1.getManagedMembers)(
        p.data.type,
        p.data.slug,
        res.locals.userId,
      );
      if (!members)
        return void res.status(403).json({
          error: 'Access unavailable. Use the private creator session.',
        });
      res.json({ members });
    } catch {
      res.status(500).json({ error: 'Unable to load members' });
    }
  },
);
exports.default = router;
