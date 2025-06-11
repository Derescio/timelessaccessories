// Debug catalog API response
async function debugCatalog() {
  console.log("🔍 Debugging Printify catalog...");

  try {
    console.log("\n1️⃣ Testing direct Printify API...");

    // Test direct API call
    const directResponse = await fetch(
      "https://api.printify.com/v1/catalog/blueprints.json",
      {
        headers: {
          Authorization: `Bearer ${process.env.PRINTIFY_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
          "User-Agent": "TimelessAccessories/1.0",
        },
      }
    );

    if (directResponse.ok) {
      const directData = await directResponse.json();
      console.log("✅ Direct API call successful");
      console.log("📊 Response structure:", Object.keys(directData));
      console.log(
        "📦 Data type:",
        Array.isArray(directData.data) ? "Array" : typeof directData.data
      );
      console.log("📈 Items count:", directData.data?.length || 0);

      if (directData.data && directData.data.length > 0) {
        console.log("\n📋 First product sample:");
        const firstProduct = directData.data[0];
        console.log(JSON.stringify(firstProduct, null, 2));
      }
    } else {
      console.log(
        "❌ Direct API call failed:",
        directResponse.status,
        await directResponse.text()
      );
    }

    console.log("\n2️⃣ Testing local API endpoint...");

    // Test our local API
    const localResponse = await fetch(
      "http://localhost:3000/api/admin/printify/catalog"
    );
    const localText = await localResponse.text();

    console.log("📊 Local API status:", localResponse.status);
    console.log(
      "📝 Local API response (first 500 chars):",
      localText.substring(0, 500)
    );

    if (localResponse.ok) {
      try {
        const localData = JSON.parse(localText);
        console.log("✅ Local API response parsed successfully");
        console.log("📊 Local response structure:", Object.keys(localData));
        console.log(
          "📦 Blueprints type:",
          Array.isArray(localData.blueprints)
            ? "Array"
            : typeof localData.blueprints
        );
        console.log("📈 Blueprints count:", localData.blueprints?.length || 0);
      } catch (parseError) {
        console.log(
          "❌ Failed to parse local API response:",
          parseError.message
        );
      }
    }
  } catch (error) {
    console.error("❌ Debug failed:", error.message);
  }
}

debugCatalog();
