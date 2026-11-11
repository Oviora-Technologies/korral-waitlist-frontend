import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import waitlistRoutes from './routes/waitlistRoutes';
import organizationRoutes from './routes/organizationRoutes';
import authRoutes from './routes/authRoutes';

export const app = express();
app.disable('x-powered-by');
// CRA's local proxy supplies X-Forwarded-For. Only trust known proxy addresses.
app.set('trust proxy', env.trustedProxies);
app.use(helmet());
app.use(cors({ origin: env.clientOrigin }));
app.use(express.json({ limit: '16kb' }));
app.get('/api/health', (_req,res) => res.json({ok:true}));
app.use('/api', waitlistRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/auth', authRoutes);
