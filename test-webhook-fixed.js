// Use one of the actual order IDs from the user's test
const ORDER_ID = "cmbf89kqv000a20qgbqqvk3h1"; // Browser 2 order
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
      amount: 32099,
      amount_captured: 32099,
      amount_refunded: 0,
      billing_details: {
        email: "test@example.com",
        name: "Test User",
      },
      captured: true,
      currency: "usd",
      metadata: {
        orderId: ORDER_ID,
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

async function testWebhook() {
  try {
    console.log(`🧪 Testing LOCAL webhook for order: ${ORDER_ID}`);
    console.log(`📡 Sending to: ${WEBHOOK_URL}\n`);

    const payload = JSON.stringify(mockChargeEvent);
    const signature = `t=${Math.floor(Date.now() / 1000)},v1=test_signature_for_local_development`;

    console.log("🚀 Sending webhook to LOCAL development server...\n");

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
      console.log("\n✅ LOCAL webhook test completed successfully!");
      console.log(
        "🔍 Check the development server console for our detailed logging."
      );
      console.log(
        "📊 Run check-reserved-stock.js to see if reserved stock was properly released."
      );
    } else {
      console.log("\n❌ LOCAL webhook test failed!");
    }
  } catch (error) {
    console.error("❌ Error testing LOCAL webhook:", error);
  }
}

testWebhook();
