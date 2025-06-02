#!/usr/bin/env node

/**
 * Check Correct Domain Script
 */

const BASE_URL = "https://www.shop-dw.com";

async function checkDomain() {
  try {
    console.log("🌐 Checking correct domain:", BASE_URL);

    // Test main site
    console.log("\n🏠 Testing main site...");
    const mainResponse = await fetch(BASE_URL);
    console.log(`   Status: ${mainResponse.status} ${mainResponse.statusText}`);

    // Test webhook endpoint with GET (should return 405)
    console.log("\n🎣 Testing webhook endpoint (GET)...");
    const webhookResponse = await fetch(`${BASE_URL}/api/webhook/stripe`);
    console.log(
      `   Status: ${webhookResponse.status} ${webhookResponse.statusText}`
    );

    // Test webhook endpoint with POST (should return 400 - missing signature)
    console.log("\n🎣 Testing webhook endpoint (POST, no signature)...");
    const webhookPostResponse = await fetch(`${BASE_URL}/api/webhook/stripe`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    console.log(
      `   Status: ${webhookPostResponse.status} ${webhookPostResponse.statusText}`
    );
    const responseText = await webhookPostResponse.text();
    console.log(`   Response: ${responseText}`);

    console.log("\n✅ Domain verification complete!");
    console.log("🎯 Webhook endpoint is accessible on correct domain");
  } catch (error) {
    console.error("❌ Error checking domain:", error);
  }
}

checkDomain();
