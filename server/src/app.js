import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { config } from './config.js';
import { authRouter } from './routes/auth.js';
import { projectsRouter } from './routes/projects.js';
import { projectTasksRouter, tasksRouter } from './routes/tasks.js';
import { notFoundRoute, errorHandler } from './middleware/errors.js';

export function createApp() {
  const app = express();
  // Behind Render / the Next.js proxy: use the client IP from X-Forwarded-For for rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  // The web app calls the API through its own /api proxy (same origin), so CORS is only for extra origins.
  if (config.corsOrigins.length) app.use(cors({ origin: config.corsOrigins, credentials: true }));
  app.use(express.json({ limit: '100kb' }));
  app.use(cookieParser());

  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
  });
  app.use('/api/auth', authRouter);
  app.use('/api/projects', projectsRouter);
  app.use('/api/projects/:projectId/tasks', projectTasksRouter);
  app.use('/api/tasks', tasksRouter);

  app.use(notFoundRoute);
  app.use(errorHandler);
  return app;
}
