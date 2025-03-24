/**
 * Stripe Webhook Testing Script
 *
 * This script helps test Stripe webhook handling by creating a sample webhook event
 * and sending it to your local webhook endpoint.
 *
 * Usage:
 * 1. Make sure your development server is running
 * 2. Run: node scripts/test-stripe-webhook.js
 *
 * Requirements:
 * - Stripe CLI installed (https://stripe.com/docs/stripe-cli)
 * - STRIPE_SECRET_KEY environment variable set
 */

require("dotenv").config();
const Stripe = require("stripe");
// Import node-fetch differently because it's an ESM module used in CommonJS
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const crypto = require("crypto");

// Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ||
  "whsec_test_12345678901234567890123456789012"; // Use a test secret if not set
const WEBHOOK_URL = "http://localhost:3001/api/webhooks/stripe";
const ORDER_ID = process.argv[2]; // Optional: pass order ID as command line argument

// Initialize Stripe
const stripe = new Stripe(STRIPE_SECRET_KEY, {
  apiVersion: "2023-10-16",
});

// Helper to generate a fake signature
function generateWebhookSignature(payload, secret) {
  const timestamp = Math.floor(Date.now() / 1000);
  const signedPayload = `${timestamp}.${JSON.stringify(payload)}`;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return `t=${timestamp},v1=${signature}`;
}

// Create a mock payment intent for testing
async function createMockPaymentIntent() {
  // Use provided order ID or generate a random one
  const orderId =
    ORDER_ID || `test_order_${Math.random().toString(36).substring(2, 10)}`;

  console.log(`Creating mock payment intent for order: ${orderId}`);

  try {
    // Create a real payment intent in test mode
    const paymentIntent = await stripe.paymentIntents.create({
      amount: 1000, // $10.00
      currency: "usd",
      metadata: {
        orderId: orderId,
        userId: "test_user_123",
      },
      payment_method_types: ["card"],
    });

    console.log(`Created payment intent: ${paymentIntent.id}`);
    return paymentIntent;
  } catch (error) {
    console.error("Error creating payment intent:", error);
    process.exit(1);
  }
}

// Create a mock webhook event
async function createMockWebhookEvent(type) {
  const paymentIntent = await createMockPaymentIntent();

  // Modify the payment intent based on event type
  let modifiedPaymentIntent = { ...paymentIntent };

  if (type === "payment_intent.succeeded") {
    // For succeeded events, set the status to 'succeeded'
    modifiedPaymentIntent.status = "succeeded";
    modifiedPaymentIntent.amount_received = modifiedPaymentIntent.amount;
    modifiedPaymentIntent.latest_charge =
      "ch_" + Math.random().toString(36).substring(2, 15);
  } else if (type === "payment_intent.payment_failed") {
    // For failed events, set appropriate failure properties
    modifiedPaymentIntent.status = "requires_payment_method";
    modifiedPaymentIntent.last_payment_error = {
      code: "card_declined",
      message: "Your card was declined.",
      type: "card_error",
      decline_code: "generic_decline",
    };
  } else if (type === "charge.succeeded") {
    // For charge.succeeded events, create a mock charge object
    return {
      id: `evt_${Math.random().toString(36).substring(2, 10)}`,
      object: "event",
      api_version: "2023-10-16",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          id: `ch_${Math.random().toString(36).substring(2, 15)}`,
          object: "charge",
          amount: paymentIntent.amount,
          amount_captured: paymentIntent.amount,
          amount_refunded: 0,
          application: null,
          application_fee: null,
          application_fee_amount: null,
          balance_transaction: `txn_${Math.random().toString(36).substring(2, 10)}`,
          billing_details: {
            address: {
              city: null,
              country: null,
              line1: null,
              line2: null,
              postal_code: null,
              state: null,
            },
            email: "customer@example.com",
            name: "Test Customer",
            phone: null,
          },
          calculated_statement_descriptor: "TIMELESS ACCESSORIES",
          captured: true,
          created: Math.floor(Date.now() / 1000),
          currency: "usd",
          customer: null,
          description: "Test charge for order",
          destination: null,
          dispute: null,
          disputed: false,
          failure_code: null,
          failure_message: null,
          fraud_details: {},
          invoice: null,
          livemode: false,
          metadata: paymentIntent.metadata, // Include order ID in metadata
          outcome: {
            network_status: "approved_by_network",
            reason: null,
            risk_level: "normal",
            risk_score: 26,
            seller_message: "Payment complete.",
            type: "authorized",
          },
          paid: true,
          payment_intent: paymentIntent.id,
          payment_method: `pm_${Math.random().toString(36).substring(2, 10)}`,
          payment_method_details: {
            card: {
              brand: "visa",
              checks: {
                address_line1_check: null,
                address_postal_code_check: null,
                cvc_check: "pass",
              },
              country: "US",
              exp_month: 12,
              exp_year: 2034,
              fingerprint: "2jgWjJhHLBgQGZEP",
              funding: "credit",
              installments: null,
              last4: "4242",
              network: "visa",
              three_d_secure: null,
              wallet: null,
            },
            type: "card",
          },
          receipt_email: "customer@example.com",
          receipt_number: null,
          receipt_url: `https://pay.stripe.com/receipts/payment/${Math.random().toString(36).substring(2, 15)}`,
          refunded: false,
          refunds: {
            object: "list",
            data: [],
            has_more: false,
            total_count: 0,
            url: `/v1/charges/ch_${Math.random().toString(36).substring(2, 15)}/refunds`,
          },
          review: null,
          shipping: null,
          source: null,
          source_transfer: null,
          statement_descriptor: null,
          statement_descriptor_suffix: null,
          status: "succeeded",
          transfer_data: null,
          transfer_group: null,
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_${Math.random().toString(36).substring(2, 10)}`,
        idempotency_key: `idempotency_${Math.random().toString(36).substring(2, 10)}`,
      },
      type: type,
    };
  }

  return {
    id: `evt_${Math.random().toString(36).substring(2, 10)}`,
    object: "event",
    api_version: "2023-10-16",
    created: Math.floor(Date.now() / 1000),
    data: {
      object: modifiedPaymentIntent,
    },
    livemode: false,
    pending_webhooks: 1,
    request: {
      id: `req_${Math.random().toString(36).substring(2, 10)}`,
      idempotency_key: `idempotency_${Math.random().toString(36).substring(2, 10)}`,
    },
    type: type,
  };
}

// Send mock webhook event to your endpoint
async function sendWebhookEvent(event) {
  if (!WEBHOOK_SECRET) {
    console.error(
      "STRIPE_WEBHOOK_SECRET is not set. Using a test secret for local development."
    );
  }

  const signature = generateWebhookSignature(event, WEBHOOK_SECRET);
  const payload = JSON.stringify(event);

  console.log(`Sending ${event.type} webhook to ${WEBHOOK_URL}`);
  console.log(`Event ID: ${event.id}`);
  console.log(`Payment Intent ID: ${event.data.object.id}`);

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Stripe-Signature": signature,
      },
      body: payload,
    });

    const responseText = await response.text();
    console.log(`Response status: ${response.status}`);
    console.log(`Response body: ${responseText}`);

    if (response.ok) {
      console.log("✅ Webhook sent successfully!");
    } else {
      console.error("❌ Failed to send webhook");
    }
  } catch (error) {
    console.error("Error sending webhook:", error);
  }
}

// Test different webhook events
async function testWebhooks() {
  console.log("=== Stripe Webhook Tester ===");

  if (!STRIPE_SECRET_KEY) {
    console.error("STRIPE_SECRET_KEY is not set");
    process.exit(1);
  }

  // Test charge.succeeded (primary way Stripe processes payments)
  console.log("\n📤 Testing charge.succeeded webhook...");
  const chargeEvent = await createMockWebhookEvent("charge.succeeded");
  await sendWebhookEvent(chargeEvent);

  // Test successful payment intent
  console.log("\n📤 Testing payment_intent.succeeded webhook...");
  const successEvent = await createMockWebhookEvent("payment_intent.succeeded");
  await sendWebhookEvent(successEvent);

  // Test failed payment
  console.log("\n📤 Testing payment_intent.payment_failed webhook...");
  const failedEvent = await createMockWebhookEvent(
    "payment_intent.payment_failed"
  );
  await sendWebhookEvent(failedEvent);

  console.log("\n==== Webhook Testing Complete ====");
  console.log("Remember that these are simulated webhooks.");
  console.log(
    "For real webhook testing, use: stripe listen --forward-to localhost:3000/api/webhooks/stripe"
  );
}

// Run the tests
testWebhooks().catch((error) => {
  console.error("Error running tests:", error);
});
