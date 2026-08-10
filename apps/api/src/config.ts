import 'dotenv/config';

export const config = {
  port: Number(process.env.PORT ?? 4000),
  jwtSecret: process.env.JWT_SECRET ?? 'dev-only-secret-change-me-ghm-his-2026',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:5173',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  timezone: 'Africa/Accra',
};
