// Simple Printify API connection test
require("dotenv").config();

async function testPrintifyConnection() {
  console.log("🔄 Testing Printify API connection...");

  try {
    // Test environment variables
    console.log("📋 Environment check:");
    console.log(
      "- PRINTIFY_ACCESS_TOKEN:",
      process.env.PRINTIFY_ACCESS_TOKEN ? "Set ✅" : "Missing ❌"
    );
    console.log(
      "- PRINTIFY_SHOP_ID:",
      process.env.PRINTIFY_SHOP_ID ? "Set ✅" : "Missing ❌"
    );

    if (!process.env.PRINTIFY_ACCESS_TOKEN) {
      throw new Error("PRINTIFY_ACCESS_TOKEN environment variable is not set");
    }

    const baseUrl = "https://api.printify.com/v1";
    const headers = {
      Authorization: `Bearer ${process.env.PRINTIFY_ACCESS_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "TimelessAccessories/1.0",
    };

    console.log("✅ Preparing Printify API request...");

    // Test 1: Get shops
    console.log("\n🏪 Testing: Get shops...");
    const shopsResponse = await fetch(`${baseUrl}/shops.json`, { headers });

    if (!shopsResponse.ok) {
      throw new Error(
        `API request failed: ${shopsResponse.status} ${shopsResponse.statusText}`
      );
    }

    const shops = await shopsResponse.json();
    console.log("✅ Shops retrieved:", shops.length);
    shops.forEach((shop) => {
      console.log(
        `   - Shop ID: ${shop.id}, Title: "${shop.title}", Channel: ${shop.sales_channel}`
      );
    });

    // Update PRINTIFY_SHOP_ID if not set
    if (!process.env.PRINTIFY_SHOP_ID && shops.length > 0) {
      console.log(`\n💡 Suggestion: Add this to your .env file:`);
      console.log(`PRINTIFY_SHOP_ID=${shops[0].id}`);
    }

    // Test 2: Get catalog (first 5 products)
    console.log("\n📦 Testing: Get product catalog...");
    const catalogResponse = await fetch(`${baseUrl}/catalog/blueprints.json`, {
      headers,
    });

    if (!catalogResponse.ok) {
      throw new Error(
        `Catalog request failed: ${catalogResponse.status} ${catalogResponse.statusText}`
      );
    }

    const catalogData = await catalogResponse.json();
    const catalog = catalogData.data || catalogData;
    console.log("✅ Catalog retrieved:", catalog.length, "products available");
    console.log("📋 Sample products:");
    catalog.slice(0, 5).forEach((product) => {
      console.log(
        `   - ${product.title} (ID: ${product.id}) by ${product.brand}`
      );
    });

    // Test 3: Get shop products (if shop ID is available)
    if (process.env.PRINTIFY_SHOP_ID) {
      console.log("\n🛍️ Testing: Get shop products...");
      try {
        const productsResponse = await fetch(
          `${baseUrl}/shops/${process.env.PRINTIFY_SHOP_ID}/products.json`,
          { headers }
        );

        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const products = productsData.data || productsData;
          console.log("✅ Shop products retrieved:", products.length);
          if (products.length > 0) {
            products.slice(0, 3).forEach((product) => {
              console.log(`   - ${product.title} (${product.id})`);
            });
          } else {
            console.log(
              "   📝 No products in shop yet (this is normal for new shops)"
            );
          }
        } else {
          console.log(
            "   ⚠️ Could not retrieve shop products (this is normal for new shops)"
          );
        }
      } catch (error) {
        console.log(
          "   ⚠️ Could not retrieve shop products (this is normal for new shops)"
        );
      }
    }

    console.log("\n🎉 Printify API connection test completed successfully!");
    console.log("\n📋 Next steps:");
    console.log("1. Create some products in your Printify dashboard");
    console.log("2. Use the admin panel to import them to your website");
    console.log("3. Set up Printify webhook for order tracking");
  } catch (error) {
    console.error("❌ Printify API connection test failed:");
    console.error("Error:", error.message);

    if (error.message.includes("401")) {
      console.error("\n💡 This looks like an authentication error.");
      console.error(
        "   Please check your PRINTIFY_ACCESS_TOKEN in the .env file."
      );
    } else if (
      error.message.includes("Network error") ||
      error.message.includes("fetch")
    ) {
      console.error("\n💡 This looks like a network connectivity issue.");
      console.error("   Please check your internet connection.");
    } else {
      console.error("\n💡 Full error details:", error);
    }
  }
}

// Run the test
testPrintifyConnection().catch(console.error);
