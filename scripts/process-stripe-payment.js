/**
 * Stripe Payment Processor
 *
 * This script manually creates a payment_intent.succeeded webhook event
 * for a specific order ID and payment intent ID, allowing us to process
 * payment intents that were successful but did not trigger webhooks properly.
 *
 * Usage:
 *   node scripts/process-stripe-payment.js <orderId> <paymentIntentId>
 *
 * Example:
 *   node scripts/process-stripe-payment.js cm8m02ncq000d20gchkoje34b pi_3R5ti84hgKBUixPS1N7Hl5RV
 */

require("dotenv").config();
const Stripe = require("stripe");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const crypto = require("crypto");

// Configuration
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const WEBHOOK_SECRET =
  process.env.STRIPE_WEBHOOK_SECRET ||
  "whsec_test_12345678901234567890123456789012";
const WEBHOOK_URL = "http://localhost:3001/api/webhooks/stripe";

// Command line arguments
const ORDER_ID = process.argv[2];
const PAYMENT_INTENT_ID = process.argv[3];

if (!ORDER_ID || !PAYMENT_INTENT_ID) {
  console.error(
    "Usage: node scripts/process-stripe-payment.js <orderId> <paymentIntentId>"
  );
  process.exit(1);
}

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

// Get a payment intent and create a webhook event
async function processPaymentIntent() {
  console.log(
    `Processing payment intent ${PAYMENT_INTENT_ID} for order ${ORDER_ID}`
  );

  try {
    // Get the payment intent details from Stripe
    const paymentIntent =
      await stripe.paymentIntents.retrieve(PAYMENT_INTENT_ID);
    console.log(
      `Retrieved payment intent with status: ${paymentIntent.status}`
    );

    // Make sure it's for the correct order
    if (paymentIntent.metadata?.orderId !== ORDER_ID) {
      console.log(`Adding order ID ${ORDER_ID} to payment intent metadata`);
      // Update the payment intent to add the order ID
      await stripe.paymentIntents.update(PAYMENT_INTENT_ID, {
        metadata: {
          orderId: ORDER_ID,
          ...paymentIntent.metadata,
        },
      });
    }

    // Create a payment_intent.succeeded event
    const event = {
      id: `evt_manual_${Math.random().toString(36).substring(2, 10)}`,
      object: "event",
      api_version: "2023-10-16",
      created: Math.floor(Date.now() / 1000),
      data: {
        object: {
          ...paymentIntent,
          status: "succeeded", // Override status to succeeded
          amount_received: paymentIntent.amount,
        },
      },
      livemode: false,
      pending_webhooks: 1,
      request: {
        id: `req_manual_${Math.random().toString(36).substring(2, 10)}`,
      },
      type: "payment_intent.succeeded",
    };

    // Send the webhook event
    await sendWebhookEvent(event);
  } catch (error) {
    console.error("Error processing payment intent:", error);
    process.exit(1);
  }
}

// Send webhook event to local endpoint
async function sendWebhookEvent(event) {
  console.log(`Sending webhook event to ${WEBHOOK_URL}`);

  const signature = generateWebhookSignature(event, WEBHOOK_SECRET);
  const payload = JSON.stringify(event);

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
      console.log("✅ Order payment processed successfully");
    } else {
      console.error("❌ Failed to process order payment");
    }
  } catch (error) {
    console.error("Error sending webhook:", error);
  }
}

// Run the script
processPaymentIntent().catch(console.error);
