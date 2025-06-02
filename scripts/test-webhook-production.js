#!/usr/bin/env node

/**
 * Test Production Webhook Script
 *
 * This script tests the production webhook with the webhook secret.
 * Make sure this matches the STRIPE_WEBHOOK_SECRET in your Vercel environment.
 */

const crypto = require("crypto");

// Use the webhook secret the user provided - this should match their Vercel environment
const WEBHOOK_SECRET = "whsec_jp79fYEOe4OtZEqjzAtZbwCr85Vh0l2G";
const PRODUCTION_WEBHOOK_URL =
  "https://timeless-accessories.vercel.app/api/webhook/stripe";

// Test order from our previous testing
const TEST_ORDER_ID = "cmbfmwuz200002054v83j1j0u";

// Mock checkout.session.completed event
const mockEvent = {
  id: "evt_test_" + Date.now(),
  object: "event",
  api_version: "2020-08-27",
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
};

function createStripeSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${payload}`;
  const signature = crypto
    .createHmac("sha256", secret)
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

    const response = await fetch(PRODUCTION_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": signature,
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
        console.log("   - Order ID:", responseData.orderId);
        console.log("   - Stock Reduction:", responseData.stockReduction);
        console.log("   - Timestamp:", responseData.timestamp);
      } catch (e) {
        // Response might not be JSON
      }
    } else {
      console.log("❌ Webhook test failed!");
    }
  } catch (error) {
    console.error("❌ Error testing webhook:", error);
  }
}

// Run the test
testProductionWebhook();
