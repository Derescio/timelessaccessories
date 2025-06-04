#!/usr/bin/env node

/**
 * Test PayPal Webhook Locally Script
 *
 * This script tests the PayPal webhook with a mock PAYMENT.CAPTURE.COMPLETED event
 */

const LOCAL_WEBHOOK_URL = "http://localhost:3000/api/webhook/paypal";

// Use an existing test order from our previous testing
const TEST_ORDER_ID = "cmbhchhv500002038gr3g51ti";

// Mock PayPal PAYMENT.CAPTURE.COMPLETED event
const mockPayPalEvent = {
  id: "WH-2WR32451HC0233532-67976317FL4543714",
  event_version: "1.0",
  create_time: new Date().toISOString(),
  resource_type: "capture",
  event_type: "PAYMENT.CAPTURE.COMPLETED",
  summary: "Payment completed for $ 79.98 USD",
  resource: {
    id: "5TY05013RG002845M",
    amount: {
      currency_code: "USD",
      value: "79.98",
    },
    final_capture: true,
    seller_protection: {
      status: "ELIGIBLE",
      dispute_categories: ["ITEM_NOT_RECEIVED", "UNAUTHORIZED_TRANSACTION"],
    },
    seller_receivable_breakdown: {
      gross_amount: {
        currency_code: "USD",
        value: "79.98",
      },
      paypal_fee: {
        currency_code: "USD",
        value: "2.63",
      },
      net_amount: {
        currency_code: "USD",
        value: "77.35",
      },
    },
    status: "COMPLETED",
    create_time: new Date().toISOString(),
    update_time: new Date().toISOString(),
    purchase_units: [
      {
        reference_id: "default",
        amount: {
          currency_code: "USD",
          value: "79.98",
        },
        payee: {
          email_address: "sb-o0w0s12345678@business.example.com",
          merchant_id: "TESTMERCHANTID123",
        },
        description: "Payment for Order " + TEST_ORDER_ID,
        custom_id: TEST_ORDER_ID, // This is the key field - contains our order ID
        soft_descriptor: "TIMELESS ACCESSORIES",
      },
    ],
  },
  links: [
    {
      href: "https://api.sandbox.paypal.com/v1/notifications/webhooks-events/WH-2WR32451HC0233532-67976317FL4543714",
      rel: "self",
      method: "GET",
    },
  ],
};

async function testPayPalWebhook() {
  console.log("🧪 Testing PayPal webhook locally...");
  console.log(`📋 Test Order ID: ${TEST_ORDER_ID}`);
  console.log(`🎯 Webhook URL: ${LOCAL_WEBHOOK_URL}`);

  try {
    console.log("\n📤 Sending PayPal PAYMENT.CAPTURE.COMPLETED event...");

    const response = await fetch(LOCAL_WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "PayPal/AUHD-214.0-54906882",
        "PayPal-Auth-Algo": "SHA256withRSA",
        "PayPal-Transmission-Id": "b4c9d9e5-d92b-4b8e-9b3f-123456789abc",
        "PayPal-Cert-Id": "CERT-360caa42-fca2a594-1d93a270",
        "PayPal-Transmission-Sig": "test_signature_for_local_development",
        "PayPal-Transmission-Time": new Date().toISOString(),
      },
      body: JSON.stringify(mockPayPalEvent),
    });

    console.log(
      `📊 Response Status: ${response.status} ${response.statusText}`
    );

    const responseText = await response.text();
    let responseData;

    try {
      responseData = JSON.parse(responseText);
      console.log("📋 Response Body:", JSON.stringify(responseData, null, 2));
    } catch {
      console.log("📋 Response Body (raw):", responseText);
    }

    if (response.ok) {
      console.log("\n✅ PayPal webhook test completed successfully!");

      if (responseData?.stockReduction) {
        console.log(`📦 Stock Reduction: ${responseData.stockReduction}`);
      }

      if (responseData?.orderId) {
        console.log(`🆔 Order ID processed: ${responseData.orderId}`);
      }
    } else {
      console.log("\n❌ PayPal webhook test failed!");
      console.log("🔍 Response details:", responseData || responseText);
    }
  } catch (error) {
    console.error("\n💥 Error testing PayPal webhook:", error.message);

    if (error.code === "ECONNREFUSED") {
      console.log("\n💡 Make sure your Next.js development server is running:");
      console.log("   npm run dev");
    }
  }
}

// Helper function to check stock before and after
async function checkStockState() {
  try {
    console.log("\n🔍 Checking current stock state...");

    // You can uncomment and modify this if you want to check stock via API
    // const stockResponse = await fetch("http://localhost:3000/api/debug-paypal-webhook");
    // const stockData = await stockResponse.json();
    // console.log("📊 Current stock state:", stockData);
  } catch (error) {
    console.log("⚠️ Could not check stock state:", error.message);
  }
}

// Run the test
async function runTest() {
  console.log("🚀 Starting PayPal webhook local test...\n");

  await checkStockState();
  await testPayPalWebhook();

  console.log("\n🏁 Test completed!");
  console.log("\n💡 Next steps:");
  console.log("   1. Check the webhook logs in your terminal");
  console.log("   2. Verify stock reduction in database");
  console.log("   3. Check if confirmation email was sent");
}

runTest().catch(console.error);
