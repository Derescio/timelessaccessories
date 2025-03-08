import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

type Environment = 'development' | 'staging' | 'production' | 'test';

export const prisma = global.prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export function getDatabaseURL() {
  const env = process.env.NODE_ENV as Environment;
  switch (env) {
    case 'production':
      return process.env.DATABASE_URL_PRODUCTION;
    case 'staging':
      return process.env.DATABASE_URL_STAGING;
    default:
      return process.env.DATABASE_URL;
  }
}

export function getEnvironment(): Environment {
  return (process.env.NODE_ENV as Environment) || 'development';
} 