'use strict';
var __importDefault =
  (this && this.__importDefault) ||
  function (mod) {
    return mod && mod.__esModule ? mod : { default: mod };
  };
Object.defineProperty(exports, '__esModule', { value: true });
exports.app = void 0;
const express_1 = __importDefault(require('express'));
const cors_1 = __importDefault(require('cors'));
const helmet_1 = __importDefault(require('helmet'));
const env_1 = require('./config/env');
const waitlistRoutes_1 = __importDefault(require('./routes/waitlistRoutes'));
const organizationRoutes_1 = __importDefault(
  require('./routes/organizationRoutes'),
);
const authRoutes_1 = __importDefault(require('./routes/authRoutes'));
exports.app = (0, express_1.default)();
exports.app.disable('x-powered-by');
// CRA's local proxy supplies X-Forwarded-For. Only trust known proxy addresses.
exports.app.set('trust proxy', env_1.env.trustedProxies);
exports.app.use((0, helmet_1.default)());
exports.app.use((0, cors_1.default)({ origin: env_1.env.clientOrigin }));
exports.app.use(express_1.default.json({ limit: '16kb' }));
exports.app.get('/api/health', (_req, res) => res.json({ ok: true }));
exports.app.use('/api', waitlistRoutes_1.default);
exports.app.use('/api/organizations', organizationRoutes_1.default);
exports.app.use('/api/auth', authRoutes_1.default);
