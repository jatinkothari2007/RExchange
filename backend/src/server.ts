import dotenv from 'dotenv';
dotenv.config();

import { createApp } from './app';
import { cronManager } from './jobs/cronSimulator';

const PORT = process.env.PORT || 4000;
const app = createApp();

const server = app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`⚡ RExchange Backend API Server running on port ${PORT}`);
  console.log(`🎓 College Domain Restriction: ${process.env.ALLOWED_COLLEGE_DOMAIN || '@srmist.edu.in'}`);
  console.log(`🌐 Health Check: http://localhost:${PORT}/health`);
  console.log(`======================================================\n`);

  // Start background jobs
  cronManager.start();
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  cronManager.stop();
  server.close(() => {
    process.exit(0);
  });
});
