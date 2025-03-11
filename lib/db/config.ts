import { Pool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import ws from 'ws';

// WebSocket configuration for Neon
neonConfig.webSocketConstructor = ws;
const connectionString = `${process.env.DATABASE_URL}`;

// Connection pool setup
const pool = new Pool({ connectionString });
const adapter = new PrismaNeon(pool);

// Extended PrismaClient with price transformations
export const prisma = new PrismaClient({ adapter }).$extends({
  result: {
    productInventory: {
      costPrice: {
        compute(inventory) {
          return inventory.costPrice.toString();
        },
      },
      retailPrice: {
        compute(inventory) {
          return inventory.retailPrice.toString();
        },
      },
      compareAtPrice: {
        compute(inventory) {
          return inventory.compareAtPrice?.toString() || null;
        },
      },
    },
    order: {
      subtotal: {
        compute(order) {
          return order.subtotal.toString();
        },
      },
      tax: {
        compute(order) {
          return order.tax.toString();
        },
      },
      shipping: {
        compute(order) {
          return order.shipping.toString();
        },
      },
      total: {
        compute(order) {
          return order.total.toString();
        },
      },
    },
    orderItem: {
      price: {
        compute(item) {
          return item.price.toString();
        },
      },
    },
    payment: {
      amount: {
        compute(payment) {
          return payment.amount.toString();
        },
      },
    },
    review: {
      rating: {
        compute(review) {
          return review.rating.toString();
        },
      },
    }
  },
});