const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkReservedStock() {
  try {
    console.log("🔍 Checking current reserved stock...\n");

    // Get all inventory with reserved stock > 0
    const inventoryWithReservedStock = await prisma.productInventory.findMany({
      where: {
        reservedStock: { gt: 0 },
      },
      select: {
        id: true,
        sku: true,
        quantity: true,
        reservedStock: true,
        product: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: {
        reservedStock: "desc",
      },
    });

    if (inventoryWithReservedStock.length === 0) {
      console.log(
        "✅ No inventory items have reserved stock. System is clean!"
      );
      return;
    }

    console.log(
      `⚠️ Found ${inventoryWithReservedStock.length} inventory items with reserved stock:\n`
    );

    inventoryWithReservedStock.forEach((item, index) => {
      const availableStock = item.quantity - item.reservedStock;
      console.log(`${index + 1}. ${item.product.name}`);
      console.log(`   SKU: ${item.sku}`);
      console.log(`   Total Stock: ${item.quantity}`);
      console.log(`   Reserved Stock: ${item.reservedStock}`);
      console.log(`   Available Stock: ${availableStock}`);
      console.log("");
    });

    // Also check recent orders to see if any are completed but still have reserved stock
    const recentOrders = await prisma.order.findMany({
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
                sku: true,
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

    if (recentOrders.length > 0) {
      console.log(
        `📋 Recent completed orders (last 24h): ${recentOrders.length}\n`
      );

      recentOrders.forEach((order, index) => {
        console.log(
          `${index + 1}. Order ${order.id} - Status: ${order.status}`
        );
        console.log(`   Created: ${order.createdAt.toISOString()}`);

        order.items.forEach((item) => {
          console.log(`   - ${item.name} (SKU: ${item.inventory.sku})`);
          console.log(
            `     Ordered: ${item.quantity}, Reserved Stock: ${item.inventory.reservedStock}`
          );
        });
        console.log("");
      });
    }
  } catch (error) {
    console.error("❌ Error checking reserved stock:", error);
  } finally {
    await prisma.$disconnect();
  }
}

checkReservedStock();
