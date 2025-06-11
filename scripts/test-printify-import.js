// Test script for Printify product import
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPrintifyImport() {
  console.log("🔄 Testing Printify product import...");

  try {
    // First, let's see what categories we have
    console.log("\n📋 Available categories:");
    const categories = await prisma.category.findMany({
      select: { id: true, name: true, slug: true },
    });

    if (categories.length === 0) {
      console.log("❌ No categories found! Creating a test category...");

      const testCategory = await prisma.category.create({
        data: {
          name: "Print on Demand",
          slug: "print-on-demand",
          description: "Products imported from Printify",
        },
      });

      console.log("✅ Created test category:", testCategory.name);
      categories.push(testCategory);
    }

    categories.forEach((cat) => {
      console.log(`   - ${cat.name} (${cat.id})`);
    });

    // Test the import API
    console.log("\n🧪 Testing import API call...");

    const importData = {
      blueprintId: 3, // T-shirt blueprint (common in Printify)
      printProviderId: 1, // Generic provider
      markup: 150, // 150% markup (50% profit)
      categoryId: categories[0].id,
    };

    console.log("📦 Import request data:", importData);

    const response = await fetch(
      "http://localhost:3000/api/admin/printify/import-product",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importData),
      }
    );

    const result = await response.json();

    if (response.ok) {
      console.log("✅ Import successful!");
      console.log("📋 Result:", result);

      // Verify the product was created
      const createdProduct = await prisma.product.findUnique({
        where: { id: result.product.id },
        include: {
          inventories: true,
          category: true,
        },
      });

      if (createdProduct) {
        console.log("\n📦 Created product details:");
        console.log(`   - Name: ${createdProduct.name}`);
        console.log(`   - Category: ${createdProduct.category.name}`);
        console.log(`   - Fulfillment: ${createdProduct.fulfillmentType}`);
        console.log(`   - Printify ID: ${createdProduct.printifyProductId}`);
        console.log(`   - Variants: ${createdProduct.inventories.length}`);

        console.log("\n💰 Pricing info:");
        createdProduct.inventories.forEach((inv, i) => {
          console.log(
            `   Variant ${i + 1}: $${inv.costPrice} → $${inv.retailPrice}`
          );
        });
      }
    } else {
      console.log("❌ Import failed!");
      console.log("📋 Error:", result);
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testPrintifyImport();
