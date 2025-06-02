#!/usr/bin/env node

/**
 * Fixed Production Webhook Test Script
 */

const crypto = require("crypto");

// Use the webhook secret that matches your Vercel environment
const WEBHOOK_SECRET = "whsec_jp79fYEOe4OtZEqjzAtZbwCr85Vh0l2G";
const PRODUCTION_WEBHOOK_URL = "https://www.shop-dw.com/api/webhook/stripe";

// Test order from our previous testing
const TEST_ORDER_ID = "cmbfmwuz200002054v83j1j0u";

// Create a proper Stripe webhook event
const mockEvent = {
  id: "evt_test_" + Date.now(),
  object: "event",
  api_version: "2025-02-24.acacia",
  created: Math.floor(Date.now() / 1000),
  type: "checkout.session.completed",
  data: {
    object: {
      id: "cs_test_" + Date.now(),
      object: "checkout_session",
      payment_status: "paid",
      payment_intent: "pi_test_" + Date.now(),
      customer_email: "test@example.com",
      amount_total: 7998, // $79.98 in cents
      metadata: {
        orderId: TEST_ORDER_ID,
      },
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: "req_test_" + Date.now(),
  },
};

function createStripeSignature(payload, secret) {
  // Remove the "whsec_" prefix from the secret for HMAC
  const actualSecret = secret.startsWith("whsec_") ? secret.slice(6) : secret;

  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;

  console.log(`🔐 Creating signature with:`);
  console.log(`   Secret length: ${actualSecret.length}`);
  console.log(`   Timestamp: ${timestamp}`);
  console.log(`   Payload length: ${payload.length}`);

  const signature = crypto
    .createHmac("sha256", actualSecret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

async function testProductionWebhook() {
  try {
    console.log("🧪 Testing production webhook...");
    console.log("🎯 Target URL:", PRODUCTION_WEBHOOK_URL);
    console.log("📦 Test Order ID:", TEST_ORDER_ID);
    console.log(
      "🔑 Using webhook secret:",
      WEBHOOK_SECRET.substring(0, 20) + "..."
    );

    const payload = JSON.stringify(mockEvent);
    const signature = createStripeSignature(payload, WEBHOOK_SECRET);

    console.log("🔐 Generated signature:", signature.substring(0, 50) + "...");
    console.log("📝 Payload preview:", payload.substring(0, 200) + "...");

    const response = await fetch(PRODUCTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
        "User-Agent": "Stripe/1.0 (+https://stripe.com/docs/webhooks)",
      },
      body: payload,
    });

    console.log("📊 Response Status:", response.status);
    console.log("📊 Response Status Text:", response.statusText);

    const responseText = await response.text();
    console.log("📄 Response Body:", responseText);

    if (response.ok) {
      console.log("✅ Webhook test successful!");

      // Parse the response to see the results
      try {
        const responseData = JSON.parse(responseText);
        console.log("📊 Webhook Results:");
        console.log("   - Message:", responseData.message);
        console.log("   - Order ID:", responseData.orderId);
        console.log("   - Stock Reduction:", responseData.stockReduction);
        console.log("   - Timestamp:", responseData.timestamp);
      } catch (e) {
        console.log("📊 Raw response (not JSON)");
      }
    } else {
      console.log("❌ Webhook test failed!");

      // Try to diagnose the error
      if (response.status === 400) {
        console.log("🔍 Signature verification likely failed");
        console.log(
          "💡 Check if webhook secret in Vercel environment matches test secret"
        );
      }
    }
  } catch (error) {
    console.error("❌ Error testing webhook:", error);
  }
}

testProductionWebhook();
