import { Pool, neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
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

// Create a connection pool using Neon serverless
//const pool = new Pool({ connectionString });

// Create PrismaClient with Neon adapter
const prismaClientSingleton = () => {
  return new PrismaClient().$extends({
    query: {
      async $allOperations({  args, query }) {
        const pool = new Pool({ connectionString });
        const adapter = new PrismaNeon(pool);
        
        args.adapter = adapter;
        return query(args);
      },
    },
    result: {
      product: {
        price: {
          compute(product) {
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
