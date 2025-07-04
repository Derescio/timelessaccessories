#!/usr/bin/env node

/**
 * Debug PayPal Webhook Issues
 * This script helps identify why PayPal emails aren't being sent
 */

import dotenv from "dotenv";
dotenv.config();

const WEBHOOK_URL =
  process.env.WEBHOOK_URL || "http://localhost:3000/api/webhook/paypal";
const TEST_ORDER_ID = process.env.TEST_ORDER_ID || "test-order-123";

// Test if webhook endpoint is accessible
async function testWebhookEndpoint() {
  console.log("🧪 Testing PayPal webhook endpoint...");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "GET",
    });

    console.log(`📊 GET Response: ${response.status} ${response.statusText}`);

    if (response.status === 405) {
      console.log(
        "✅ Endpoint exists (Method Not Allowed is expected for GET)"
      );
    } else {
      console.log("⚠️ Unexpected response for GET request");
    }
  } catch (error) {
    console.error("❌ Cannot reach webhook endpoint:", error.message);
    return false;
  }

  return true;
}

// Test with mock PayPal event
async function testMockPayPalEvent() {
  console.log("\n🧪 Testing with mock PayPal event...");

  const mockEvent = {
    id: "WH-TEST-123",
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    create_time: new Date().toISOString(),
    resource: {
      id: "CAP-TEST-123",
      status: "COMPLETED",
      amount: {
        currency_code: "USD",
        value: "100.00",
      },
      purchase_units: [
        {
          custom_id: TEST_ORDER_ID, // This is the key field for order ID
        },
      ],
    },
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PayPal/Test",
      },
      body: JSON.stringify(mockEvent),
    });

    const responseText = await response.text();
    console.log(`📊 POST Response: ${response.status} ${response.statusText}`);
    console.log(`📝 Response Body: ${responseText}`);

    if (response.ok) {
      console.log("✅ Mock webhook processed successfully");
      console.log("📧 Check your email and server logs for confirmation");
    } else {
      console.log("❌ Mock webhook failed");
    }
  } catch (error) {
    console.error("❌ Error sending mock webhook:", error.message);
  }
}

// Check PayPal webhook configuration
async function checkPayPalConfig() {
  console.log("\n🔍 Checking PayPal configuration...");

  const requiredEnvVars = [
    "PAYPAL_CLIENT_ID",
    "PAYPAL_APP_SECRET",
    "NEXT_PUBLIC_PAYPAL_CLIENT_ID",
  ];

  const missing = requiredEnvVars.filter((env) => !process.env[env]);

  if (missing.length > 0) {
    console.log("❌ Missing environment variables:", missing);
    return false;
  }

  console.log("✅ PayPal environment variables are set");

  // Test PayPal API connection
  try {
    const auth = Buffer.from(
      `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_APP_SECRET}`
    ).toString("base64");
    const apiUrl =
      process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

    const response = await fetch(`${apiUrl}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (response.ok) {
      console.log("✅ PayPal API connection successful");
    } else {
      console.log("❌ PayPal API connection failed");
      return false;
    }
  } catch (error) {
    console.log("❌ PayPal API test failed:", error.message);
    return false;
  }

  return true;
}

// Main debug function
async function debugPayPalWebhook() {
  console.log("🚀 PayPal Webhook Debugging Tool\n");
  console.log(`🎯 Testing webhook URL: ${WEBHOOK_URL}`);
  console.log(`🆔 Using test order ID: ${TEST_ORDER_ID}\n`);

  // Step 1: Test webhook endpoint
  const endpointOk = await testWebhookEndpoint();
  if (!endpointOk) {
    console.log("\n❌ Cannot proceed - webhook endpoint is not accessible");
    return;
  }

  // Step 2: Check PayPal configuration
  const configOk = await checkPayPalConfig();
  if (!configOk) {
    console.log("\n❌ Cannot proceed - PayPal configuration issues");
    return;
  }

  // Step 3: Test with mock event
  await testMockPayPalEvent();

  console.log("\n📋 Next Steps:");
  console.log("1. Check your server logs for webhook processing messages");
  console.log("2. Verify PayPal Developer Dashboard webhook configuration");
  console.log("3. Make sure your webhook URL is publicly accessible");
  console.log("4. Check if PAYMENT.CAPTURE.COMPLETED events are enabled");
  console.log("\n💡 Common Issues:");
  console.log("- PayPal webhook not configured in Developer Dashboard");
  console.log(
    "- Webhook URL not publicly accessible (use ngrok for local testing)"
  );
  console.log("- Order ID not being passed in custom_id field");
  console.log("- Email service configuration issues");
}

// Run the debug tool
debugPayPalWebhook().catch(console.error);
