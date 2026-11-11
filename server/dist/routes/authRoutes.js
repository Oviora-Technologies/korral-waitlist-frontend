"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_rate_limit_1 = require("express-rate-limit");
const zod_1 = require("zod");
const database_1 = require("../config/database");
const authService_1 = require("../services/authService");
const router = (0, express_1.Router)();
const limiter = (0, express_rate_limit_1.rateLimit)({
    windowMs: 15 * 60 * 1000,
    limit: 8,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
});
router.post('/login', limiter, async (req, res) => {
    const parsed = zod_1.z
        .object({
        email: zod_1.z
            .string()
            .trim()
            .email()
            .transform((x) => x.toLowerCase()),
        password: zod_1.z.string(),
    })
        .safeParse(req.body);
    if (!parsed.success)
        return void res.status(401).json({ error: 'Invalid email or password' });
    try {
        const user = await database_1.db
            .collection('registrations')
            .findOne({ email: parsed.data.email });
        if (!user ||
            typeof user.passwordHash !== 'string' ||
            !(await (0, authService_1.verifyPassword)(parsed.data.password, user.passwordHash))) {
            return void res.status(401).json({ error: 'Invalid email or password' });
        }
        const token = await (0, authService_1.createSession)(user._id);
        res.json({
            token,
            user: { id: user._id.toHexString(), name: user.name, email: user.email },
        });
    }
    catch {
        res.status(500).json({ error: 'Unable to sign in' });
    }
});
router.get('/me', authService_1.ownerOnly, async (_req, res) => {
    const user = await database_1.db
        .collection('registrations')
        .findOne({ _id: res.locals.userId }, { projection: { name: 1, email: 1 } });
    if (!user)
        return void res.status(401).json({ error: 'Account not found' });
    const organizations = await database_1.db
        .collection('organizations')
        .find({ adminUserId: res.locals.userId }, {
        projection: { name: 1, type: 1, slug: 1, location: 1, description: 1 },
    })
        .sort({ createdAt: -1 })
        .toArray();
    res.json({
        user: { id: user._id.toHexString(), name: user.name, email: user.email },
        organizations: organizations.map((o) => ({
            id: o._id.toHexString(),
            name: o.name,
            type: o.type,
            slug: o.slug,
            location: o.location,
            description: o.description,
        })),
    });
});
router.post('/logout', authService_1.ownerOnly, async (req, res) => {
    await (0, authService_1.logout)((0, authService_1.sessionToken)(req));
    res.json({ ok: true });
});
exports.default = router;
