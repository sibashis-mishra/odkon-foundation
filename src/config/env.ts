/**
 * src/config/env.ts
 *
 * Validates all required environment variables at startup using Zod.
 * The app will crash fast with a clear error if any required var is missing
 * or invalid — no silent undefined surprises at runtime.
 */

import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z
    .string()
    .default('3000')
    .transform(Number)
    .refine((n) => !isNaN(n) && n > 0 && n < 65536, 'PORT must be a valid port number'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET must be at least 16 characters'),

  JWT_REFRESH_SECRET: z
    .string()
    .min(16, 'JWT_REFRESH_SECRET must be at least 16 characters'),

  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  CORS_ORIGIN: z.string().default('http://localhost:5173'),

  BCRYPT_ROUNDS: z
    .string()
    .default('12')
    .transform(Number)
    .refine((n) => n >= 10 && n <= 20, 'BCRYPT_ROUNDS must be between 10 and 20'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('\n❌ Invalid environment configuration:\n');
  const errors = parsed.error.flatten().fieldErrors;
  Object.entries(errors).forEach(([field, messages]) => {
    console.error(`  ${field}: ${messages?.join(', ')}`);
  });
  console.error('\nPlease check your .env file against .env.example\n');
  process.exit(1);
}

export const env = parsed.data;
export type Env = typeof env;
