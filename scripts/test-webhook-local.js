#!/usr/bin/env node

/**
 * Local Webhook Testing Script
 *
 * This script simulates a Stripe checkout.session.completed webhook event
 * to test the inventory management locally.
 *
 * Usage: node scripts/test-webhook-local.js [orderId]
 */

const orderId = process.argv[2];

if (!orderId) {
  console.error("❌ Please provide an order ID");
  console.log("Usage: node scripts/test-webhook-local.js [orderId]");
  process.exit(1);
}

// Simulate a Stripe checkout.session.completed event
const mockEvent = {
  type: "checkout.session.completed",
  data: {
    object: {
      id: `cs_test_${Date.now()}`,
      payment_status: "paid",
      payment_intent: `pi_test_${Date.now()}`,
      customer_email: "test@example.com",
      amount_total: 10000, // $100.00 in cents
      metadata: {
        orderId: orderId,
      },
    },
  },
};

async function testWebhook() {
  try {
    console.log(`🧪 Testing webhook locally for order: ${orderId}`);
    console.log(`📋 Mock event:`, JSON.stringify(mockEvent, null, 2));

    const response = await fetch("http://localhost:3000/api/webhook/stripe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "test_signature_for_local_development",
      },
      body: JSON.stringify(mockEvent),
    });

    const responseText = await response.text();

    console.log(`📊 Response Status: ${response.status}`);
    console.log(
      `📊 Response Headers:`,
      Object.fromEntries(response.headers.entries())
    );
    console.log(`📊 Response Body:`, responseText);

    if (response.ok) {
      console.log("✅ Webhook test completed successfully");
    } else {
      console.error("❌ Webhook test failed");
    }
  } catch (error) {
    console.error("❌ Error testing webhook:", error.message);
  }
}

testWebhook();
