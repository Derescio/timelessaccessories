const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function fixReservedStock() {
  try {
    console.log("🔧 Fixing reserved stock for completed orders...\n");

    // Get all completed orders from the last 24 hours
    const completedOrders = await prisma.order.findMany({
      where: {
        status: {
          in: ["PROCESSING", "SHIPPED", "DELIVERED"],
        },
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      include: {
        items: {
          include: {
            inventory: {
              select: {
                id: true,
                sku: true,
                quantity: true,
                reservedStock: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (completedOrders.length === 0) {
      console.log("✅ No completed orders found in the last 24 hours.");
      return;
    }

    console.log(
      `📋 Found ${completedOrders.length} completed orders. Checking for stuck reserved stock...\n`
    );

    let totalFixed = 0;

    for (const order of completedOrders) {
      console.log(`🔍 Checking Order ${order.id} (Status: ${order.status})`);

      let orderNeedsFixing = false;
      const fixResults = [];

      for (const item of order.items) {
        if (item.inventory.reservedStock > 0) {
          console.log(
            `  ⚠️ Found stuck reserved stock for ${item.inventory.sku}:`
          );
          console.log(`     - Order quantity: ${item.quantity}`);
          console.log(
            `     - Current reserved stock: ${item.inventory.reservedStock}`
          );
          console.log(`     - Total stock: ${item.inventory.quantity}`);

          // For completed orders, we should release the reserved stock equal to the order quantity
          const releaseAmount = Math.min(
            item.quantity,
            item.inventory.reservedStock
          );

          if (releaseAmount > 0) {
            const updatedInventory = await prisma.productInventory.update({
              where: { id: item.inventoryId },
              data: {
                reservedStock: { decrement: releaseAmount },
              },
              select: {
                sku: true,
                quantity: true,
                reservedStock: true,
              },
            });

            fixResults.push({
              sku: item.inventory.sku,
              releasedAmount: releaseAmount,
              previousReserved: item.inventory.reservedStock,
              newReserved: updatedInventory.reservedStock,
              newAvailable:
                updatedInventory.quantity - updatedInventory.reservedStock,
            });

            orderNeedsFixing = true;
            totalFixed++;

            console.log(
              `  ✅ Released ${releaseAmount} reserved stock for ${item.inventory.sku}`
            );
            console.log(
              `     - New reserved stock: ${updatedInventory.reservedStock}`
            );
            console.log(
              `     - New available stock: ${updatedInventory.quantity - updatedInventory.reservedStock}`
            );
          }
        }
      }

      if (orderNeedsFixing) {
        console.log(`✅ Fixed reserved stock for Order ${order.id}`);
      } else {
        console.log(`✅ Order ${order.id} - No fixes needed`);
      }
      console.log("");
    }

    if (totalFixed > 0) {
      console.log(
        `🎉 Successfully fixed reserved stock for ${totalFixed} items across completed orders!`
      );
    } else {
      console.log(
        `✅ All completed orders have correct reserved stock values.`
      );
    }

    // Show final inventory state
    console.log("\n📊 Final inventory state:");
    const inventoryWithReserved = await prisma.productInventory.findMany({
      where: {
        reservedStock: { gt: 0 },
      },
      select: {
        sku: true,
        quantity: true,
        reservedStock: true,
        product: {
          select: { name: true },
        },
      },
    });

    if (inventoryWithReserved.length === 0) {
      console.log("✅ No items have reserved stock. System is clean!");
    } else {
      inventoryWithReserved.forEach((item) => {
        console.log(
          `- ${item.product.name} (${item.sku}): ${item.quantity - item.reservedStock} available (${item.reservedStock} reserved)`
        );
      });
    }
  } catch (error) {
    console.error("❌ Error fixing reserved stock:", error);
  } finally {
    await prisma.$disconnect();
  }
}

fixReservedStock();
