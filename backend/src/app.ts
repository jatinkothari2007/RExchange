import express from 'express';
import cors from 'cors';
import { errorHandler } from './middleware/errorHandler';
import { authRouter, userRouter } from './modules/auth/routes';
import { listingRouter } from './modules/listings/routes';
import { needRouter } from './modules/needs/routes';
import { matchRouter } from './modules/match/routes';
import { exchangeRouter } from './modules/exchanges/routes';
import { chatRouter } from './modules/chat/routes';
import { reputationRouter } from './modules/reputation/routes';
import { impactRouter } from './modules/impact/routes';
import { gamificationRouter } from './modules/gamification/routes';
import { notificationRouter } from './modules/notifications/routes';
import { adminRouter } from './modules/admin/routes';
import { bundleRouter } from './modules/bundles/routes';
import { loanRouter } from './modules/loans/routes';
import { spotlightRouter } from './modules/spotlight/routes';
import { NotFoundError } from './utils/errors';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  app.use(express.json());

  // Health check
  app.get('/health', (req, res) => {
    return res.status(200).json({
      status: 'ok',
      service: 'RExchange Backend API',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    });
  });

  // API Route Groups (Modular Architecture)
  app.use('/auth', authRouter);
  app.use('/users', userRouter);
  app.use('/listings', listingRouter);
  app.use('/bundles', bundleRouter);
  app.use('/loans', loanRouter);
  app.use('/spotlight', spotlightRouter);
  app.use('/needs', needRouter);
  app.use('/match', matchRouter);
  app.use('/exchanges', exchangeRouter);
  app.use('/exchanges', chatRouter); // merges /exchanges/:id/messages
  app.use('/', reputationRouter); // mounts /exchanges/:id/rate & /users/:id/reputation
  app.use('/impact', impactRouter);
  app.use('/leaderboard', gamificationRouter);
  app.use('/notifications', notificationRouter);
  app.use('/admin', adminRouter);


  // 404 Route Catch-all
  app.use((req, res, next) => {
    next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
  });

  // Centralized Error Handler
  app.use(errorHandler);

  return app;
};
