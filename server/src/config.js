import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function required(name, fallbackForDev) {
  const value = process.env[name] ?? (isProd ? undefined : fallbackForDev);
  if (!value) throw new Error(`Missing required environment variable ${name}`);
  return value;
}

export const config = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI,
  // A fixed dev secret keeps local sessions valid across restarts; production must set its own.
  jwtSecret: required('JWT_SECRET', 'dev-only-secret-change-me'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  // Comma-separated list of browser origins allowed to call the API directly (the Next.js proxy needs none).
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
};
