export const env = {
  port: Number(process.env.PORT || 4000),
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  adminPassword: process.env.ADMIN_PASSWORD || '',
  jwtSecret: process.env.JWT_SECRET || ''
};

export function validateEnvironment() {
  if (env.adminPassword.length < 12 || env.jwtSecret.length < 32) {
    throw new Error('Set ADMIN_PASSWORD (12+ characters) and JWT_SECRET (32+ characters) in server/.env');
  }
}
