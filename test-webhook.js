const fetch = require("node-fetch");

// Use the order ID from your recent test
const ORDER_ID = "cmbf7hfnv000720cwh9ilismg";
const WEBHOOK_URL = "http://localhost:3000/api/webhook/stripe";

// Create a mock Stripe charge.succeeded event
const mockChargeEvent = {
  id: `evt_test_${Date.now()}`,
  object: "event",
  api_version: "2025-02-24.acacia",
  created: Math.floor(Date.now() / 1000),
  data: {
    object: {
      id: `ch_test_${Date.now()}`,
      object: "charge",
      amount: 32099, // $320.99 in cents
      amount_captured: 32099,
      amount_refunded: 0,
      billing_details: {
        email: "test@example.com",
        name: "Test User",
      },
      captured: true,
      currency: "usd",
      metadata: {
        orderId: ORDER_ID, // This is the key part!
      },
      paid: true,
      status: "succeeded",
    },
  },
  livemode: false,
  pending_webhooks: 1,
  request: {
    id: `req_test_${Date.now()}`,
  },
  type: "charge.succeeded",
};

// Generate a simple signature (for testing - in production this would be more secure)
function generateTestSignature(payload) {
  const timestamp = Math.floor(Date.now() / 1000);
  return `t=${timestamp},v1=test_signature_for_local_development`;
}

async function testWebhook() {
  try {
    console.log(`🧪 Testing webhook for order: ${ORDER_ID}`);
    console.log(`📡 Sending to: ${WEBHOOK_URL}\n`);

    const payload = JSON.stringify(mockChargeEvent);
    const signature = generateTestSignature(payload);

    console.log(
      "📦 Webhook payload:",
      JSON.stringify(mockChargeEvent, null, 2)
    );
    console.log("\n🔐 Signature:", signature);
    console.log("\n🚀 Sending webhook...\n");

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": signature,
      },
      body: payload,
    });

    const responseText = await response.text();

    console.log(`📊 Response Status: ${response.status}`);
    console.log(`📄 Response Body:`, responseText);

    if (response.ok) {
      console.log("\n✅ Webhook test completed successfully!");
      console.log(
        "🔍 Check the development server logs for detailed stock reduction logs."
      );
    } else {
      console.log("\n❌ Webhook test failed!");
    }
  } catch (error) {
    console.error("❌ Error testing webhook:", error);
  }
}

testWebhook();
