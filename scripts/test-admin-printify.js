// Test Printify integration with admin authentication
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function testPrintifyIntegration() {
  console.log("🔄 Testing complete Printify integration...");

  try {
    // Test 1: Test connection
    console.log("\n1️⃣ Testing Printify connection...");
    const connectionResponse = await fetch(
      "http://localhost:3000/api/admin/printify/test-connection",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    if (connectionResponse.ok) {
      const connectionData = await connectionResponse.json();
      console.log("✅ Connection successful!");
      console.log(
        `Shop: ${connectionData.shopName} (ID: ${connectionData.shopId})`
      );
    } else {
      console.log("❌ Connection failed:", await connectionResponse.text());
      return;
    }

    // Test 2: Get catalog (first few products)
    console.log("\n2️⃣ Testing catalog access...");
    const catalogResponse = await fetch(
      "http://localhost:3000/api/admin/printify/catalog"
    );

    if (catalogResponse.ok) {
      const catalogData = await catalogResponse.json();
      console.log(
        `✅ Catalog access successful! ${catalogData.total} products available`
      );

      // Show first few products
      console.log("\n📋 Sample products:");
      catalogData.blueprints.slice(0, 3).forEach((product, i) => {
        console.log(
          `   ${i + 1}. ${product.title} (ID: ${product.id}) by ${product.brand}`
        );
      });

      // Test 3: List current Printify products
      console.log("\n3️⃣ Testing current Printify products...");
      const productsResponse = await fetch(
        "http://localhost:3000/api/admin/printify/products"
      );

      if (productsResponse.ok) {
        const productsData = await productsResponse.json();
        console.log(
          `✅ Products list retrieved! ${productsData.count} Printify products found`
        );

        if (productsData.count > 0) {
          console.log("\n📦 Current Printify products:");
          productsData.products.forEach((product, i) => {
            console.log(
              `   ${i + 1}. ${product.title} (${product.variants} variants) - $${product.price}`
            );
          });
        } else {
          console.log("📝 No Printify products yet - ready for import!");
        }
      } else {
        console.log("❌ Products list failed:", await productsResponse.text());
      }

      // Test 4: Get available categories for import
      console.log("\n4️⃣ Available categories for import:");
      const categories = await prisma.category.findMany({
        select: { id: true, name: true },
      });

      categories.forEach((cat, i) => {
        console.log(`   ${i + 1}. ${cat.name} (${cat.id})`);
      });

      // Show instructions for manual testing
      console.log("\n🎯 Next Steps - Manual Testing:");
      console.log("1. Go to your admin panel: http://localhost:3000/admin");
      console.log("2. Navigate to Printify section");
      console.log("3. Test the connection button");
      console.log("4. Browse the catalog and try importing a product");
      console.log("5. View imported products and test sync/delete");

      // Test 5: Show sample import request
      console.log("\n📋 Sample import request you can test:");
      const sampleImport = {
        blueprintId: catalogData.blueprints[0].id,
        printProviderId: 1,
        markup: 150,
        categoryId: categories[0].id,
      };
      console.log("POST /api/admin/printify/import-product");
      console.log(JSON.stringify(sampleImport, null, 2));
    } else {
      console.log("❌ Catalog access failed:", await catalogResponse.text());
    }
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPrintifyIntegration();
