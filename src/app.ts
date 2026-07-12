/**
 * src/app.ts — Express application factory
 */

import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { env } from './config/env';
import './types/index';
import { errorHandler } from './middleware/errorHandler';

import authRoutes      from './modules/auth/auth.routes';
import userRoutes      from './modules/users/users.routes';
import clientRoutes    from './modules/clients/clients.routes';
import projectRoutes   from './modules/projects/projects.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';

export function createApp(): Express {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', service: 'odkon-foundation', timestamp: new Date().toISOString() });
  });

  app.use('/api/v1/auth',      authRoutes);
  app.use('/api/v1/users',     userRoutes);
  app.use('/api/v1/clients',   clientRoutes);
  app.use('/api/v1/projects',  projectRoutes);
  app.use('/api/v1/dashboard', dashboardRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: { message: 'Route not found', code: 'NOT_FOUND' } });
  });

  app.use(errorHandler);

  return app;
}
