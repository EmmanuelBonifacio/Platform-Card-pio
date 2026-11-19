import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  PORT: z.coerce.number().default(3010),
  DATABASE_URL: z.string().min(1),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('15m'),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  ALLOWED_ORIGINS: z.string().default('http://localhost:3011'),
  // Ponte com SaaS Platform
  SAAS_PLATFORM_API_URL: z.string().url().optional(),
  SAAS_PLATFORM_SHARED_SECRET: z.string().min(32).optional(),
  SAAS_PLATFORM_WEBHOOK_SECRET: z.string().min(16).optional(),
  // Asaas — fase final (opcional agora)
  ASAAS_API_KEY: z.string().optional(),
  ASAAS_BASE_URL: z.string().url().optional(),
  MINIO_ENDPOINT: z.string().optional().or(z.literal('')),
  MINIO_ACCESS_KEY: z.string().optional().or(z.literal('')),
  MINIO_SECRET_KEY: z.string().optional().or(z.literal('')),
  MINIO_BUCKET: z.string().default('platform-cardapio'),
  UPLOAD_DIR: z.string().default('uploads'),
  UPLOAD_DRIVER: z.enum(['local', 'minio']).default('local'),
});

export type Env = z.infer<typeof envSchema>;

export function loadEnv(raw: NodeJS.ProcessEnv = process.env): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((i) => `${i.path.join('.')}: ${i.message}`)
      .join('; ');
    throw new Error(`Invalid environment: ${msg}`);
  }
  return parsed.data;
}
