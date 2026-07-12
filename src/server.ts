/**
 * src/server.ts — HTTP server entry point
 */

import { createApp } from './app';
import { env } from './config/env';
import { prisma } from './config/db';
import './types/index';

async function bootstrap(): Promise<void> {
  try {
    await prisma.$connect();
    console.log('✅ Database connection established');
  } catch (err) {
    console.error('❌ Failed to connect to the database:', err);
    process.exit(1);
  }

  const app = createApp();

  const server = app.listen(env.PORT, () => {
    console.log('─────────────────────────────────────────────────');
    console.log(`🚀 odkon-foundation API running`);
    console.log(`   URL:         http://localhost:${env.PORT}`);
    console.log(`   Environment: ${env.NODE_ENV}`);
    console.log(`   CORS origin: ${env.CORS_ORIGIN}`);
    console.log('─────────────────────────────────────────────────');
  });

  const shutdown = async (signal: string): Promise<void> => {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await prisma.$disconnect();
      console.log('✅ Database disconnected. Goodbye.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    console.error('[UnhandledRejection]', reason);
  });

  process.on('uncaughtException', (err) => {
    console.error('[UncaughtException]', err);
    process.exit(1);
  });
}

bootstrap();
