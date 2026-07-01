import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  SESSION_SECRET: z.string().min(32),
  ADMIN_PASSWORD_HASH: z.string().regex(/^[a-f0-9]+:[a-f0-9]+$/i),
});

export const env = envSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  ADMIN_PASSWORD_HASH: process.env.ADMIN_PASSWORD_HASH,
});


