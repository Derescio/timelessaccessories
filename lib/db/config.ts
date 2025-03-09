import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import ws from "ws";

type ExtendedPrismaClient = ReturnType<typeof prismaClientSingleton>;

declare global {
  // eslint-disable-next-line no-var
  var prisma: ExtendedPrismaClient | undefined;
}

// Enable WebSocket for Neon
neonConfig.webSocketConstructor = ws;

// Function to determine the correct database URL based on environment
function getDatabaseURL() {
  const env = process.env.NODE_ENV as "development" | "staging" | "production" | "test";

  switch (env) {
    case "production":
      return process.env.DATABASE_URL_PRODUCTION!;
    case "staging":
      return process.env.SHADOW_DATABASE_URL;
    default:
      return process.env.DATABASE_URL!;
  }
}

// Get the correct database URL
const connectionString = getDatabaseURL();

// Production-ready connection pool configuration
const poolConfig = {
  connectionString,
  max: process.env.NODE_ENV === 'production' ? 20 : 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: process.env.NODE_ENV === 'production' ? 5000 : 2000,
  statement_timeout: 10000,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : undefined,
} as const;

// Create a single, reusable connection pool
const pool = new Pool(poolConfig);

// Monitor pool events
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle client', err);
  // Check if pool is active before attempting reconnection
  if (pool.totalCount > 0) {
    console.log('Attempting to create a new connection...');
    pool.connect().catch(console.error);
  }
});

pool.on('connect', () => {
  console.log('New client connected to the pool');
});

// Monitor pool statistics periodically in production
if (process.env.NODE_ENV === 'production') {
  setInterval(async () => {
    try {
      const poolStatus = await pool.query<{ total_connections: number }>('SELECT count(*) as total_connections FROM pg_stat_activity');
      const metrics = {
        totalConnections: poolStatus.rows[0].total_connections,
        idleConnections: pool.idleCount,
        waitingCount: pool.waitingCount,
        totalCount: pool.totalCount,
      };
      console.log('Pool status:', metrics);
    } catch (error) {
      console.error('Error monitoring pool status:', error);
    }
  }, 300000);
}

// Create Neon adapter once
const adapter = new PrismaNeon(pool);

// Create PrismaClient with Neon adapter and optimizations
const prismaClientSingleton = () => {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query', 'error', 'warn'],
  }).$extends({
    query: {
      async $allOperations({ args, query }) {
        args.adapter = adapter;
        return query(args);
      },
    },
    result: {
      product: {
        price: {
          compute(product: { price: Decimal }) {
            return product.price.toString();
          },
        },
      },
    },
  });
};

export const prisma = global.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

// Graceful shutdown
async function gracefulShutdown() {
  try {
    console.log('Starting graceful shutdown...');
    
    // Set a timeout for the shutdown
    const shutdownTimeout = setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
    
    // End the pool
    await pool.end();
    console.log('Database pool has ended');
    
    // Clear the timeout since shutdown was successful
    clearTimeout(shutdownTimeout);
    
    process.exit(0);
  } catch (error) {
    console.error('Error during shutdown:', error);
    process.exit(1);
  }
}

// Cleanup function for the connection pool
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  gracefulShutdown();
});
