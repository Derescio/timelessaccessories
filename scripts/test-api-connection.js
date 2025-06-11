// Simple API test
// Using built-in fetch (Node.js 18+)

async function testAPI() {
  console.log("🔄 Testing API connection...");

  try {
    // Test 1: Connection test
    console.log("\n1️⃣ Testing connection endpoint...");
    const connectionResponse = await fetch(
      "http://localhost:3000/api/admin/printify/test-connection",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      }
    );

    const connectionText = await connectionResponse.text();
    console.log("Response status:", connectionResponse.status);
    console.log("Response:", connectionText.substring(0, 200));

    if (connectionResponse.ok) {
      const connectionData = JSON.parse(connectionText);
      console.log("✅ Connection test passed!");
      console.log("Shop ID:", connectionData.shopId);
      console.log("Shop Name:", connectionData.shopName);
    } else {
      console.log("❌ Connection test failed");
      return;
    }

    // Test 2: Catalog endpoint
    console.log("\n2️⃣ Testing catalog endpoint...");
    const catalogResponse = await fetch(
      "http://localhost:3000/api/admin/printify/catalog"
    );

    if (catalogResponse.ok) {
      const catalogData = await catalogResponse.json();
      console.log("✅ Catalog test passed!");
      console.log("Available products:", catalogData.total);
      console.log("First product:", catalogData.blueprints[0]?.title);
    } else {
      const catalogError = await catalogResponse.text();
      console.log("❌ Catalog test failed:", catalogError.substring(0, 200));
    }

    console.log("\n🎉 API tests completed!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
}

testAPI();
