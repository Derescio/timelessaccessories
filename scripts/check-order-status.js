/**
 * Order Status Checker
 *
 * This script queries the database to check the status of an order
 * and its associated payment record.
 *
 * Usage:
 *   node scripts/check-order-status.js <orderId>
 *
 * Example:
 *   node scripts/check-order-status.js cm8m02ncq000d20gchkoje34b
 */

require("dotenv").config();
const { PrismaClient } = require("@prisma/client");

// Initialize Prisma client
const prisma = new PrismaClient();

// Get the order ID from the command line arguments
const orderId = process.argv[2];

if (!orderId) {
  console.error("Usage: node scripts/check-order-status.js <orderId>");
  process.exit(1);
}

async function checkOrderStatus() {
  try {
    // Query the order with its payment record
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        payment: true,
        items: {
          include: {
            product: true,
          },
        },
        user: true,
      },
    });

    if (!order) {
      console.error(`Order with ID ${orderId} not found.`);
      return;
    }

    // Print order details
    console.log("\n=== ORDER DETAILS ===");
    console.log(`Order ID: ${order.id}`);
    console.log(`Status: ${order.status}`);
    console.log(`Created: ${new Date(order.createdAt).toLocaleString()}`);
    console.log(`Updated: ${new Date(order.updatedAt).toLocaleString()}`);
    console.log(`Total: $${(order.total / 100).toFixed(2)}`);
    console.log(`User: ${order.user?.email || "Guest"}`);

    // Print payment details if available
    if (order.payment) {
      console.log("\n=== PAYMENT DETAILS ===");
      console.log(`Payment ID: ${order.payment.id}`);
      console.log(`Provider: ${order.payment.provider}`);
      console.log(`Status: ${order.payment.status}`);
      console.log(`Provider ID: ${order.payment.providerId || "N/A"}`);
      console.log(`Charge ID: ${order.payment.chargeId || "N/A"}`);
      console.log(
        `Created: ${new Date(order.payment.createdAt).toLocaleString()}`
      );
      console.log(
        `Updated: ${new Date(order.payment.updatedAt).toLocaleString()}`
      );
    } else {
      console.log("\nNo payment record found for this order.");
    }

    // Print order items
    console.log("\n=== ORDER ITEMS ===");
    order.items.forEach((item, index) => {
      console.log(`Item ${index + 1}: ${item.product.name}`);
      console.log(`  Quantity: ${item.quantity}`);
      console.log(`  Price: $${(item.price / 100).toFixed(2)}`);
      console.log(
        `  Subtotal: $${((item.price * item.quantity) / 100).toFixed(2)}`
      );
    });

    console.log("\n");
  } catch (error) {
    console.error("Error checking order status:", error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkOrderStatus().catch(console.error);
