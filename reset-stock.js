const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function resetStock() {
  try {
    console.log("🔄 Resetting stock for testing...");

    // Reset the Classic Chain Necklace stock for testing
    const updated = await prisma.productInventory.update({
      where: { sku: "NCK001-G-18" },
      data: {
        quantity: 2, // Reset to 2 items
        reservedStock: 2, // Simulate 2 items reserved (both browsers)
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

    console.log("✅ Stock reset successfully:");
    console.log(`- Product: ${updated.product.name}`);
    console.log(`- SKU: ${updated.sku}`);
    console.log(`- Total Stock: ${updated.quantity}`);
    console.log(`- Reserved Stock: ${updated.reservedStock}`);
    console.log(
      `- Available Stock: ${updated.quantity - updated.reservedStock}`
    );
  } catch (error) {
    console.error("❌ Error resetting stock:", error);
  } finally {
    await prisma.$disconnect();
  }
}

resetStock();
