/**
 * Stripe Payment Testing Script
 *
 * This script can be loaded in the browser console when testing Stripe payments.
 *
 * Usage:
 * 1. Copy this entire file
 * 2. Open browser console on the cart page
 * 3. Paste and press Enter
 * 4. Call testStripePayment() with an order ID
 */

async function testStripePayment(orderId) {
  if (!orderId) {
    console.error("❌ Order ID is required");
    return;
  }

  console.log(`🔍 Testing Stripe payment for order: ${orderId}`);

  try {
    // Make a direct request to the Stripe payment intent API
    const response = await fetch(`/api/payments/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ orderId }),
    });

    console.log(
      `📡 Response status: ${response.status} ${response.statusText}`
    );

    const data = await response.json();

    console.log("=== STRIPE API RESPONSE ===");
    console.log(JSON.stringify(data, null, 2));
    console.log("=========================");

    if (data.clientSecret) {
      console.log("✅ Success! Client secret obtained.");
      console.log(
        `To confirm payment, you would use this client secret with Stripe Elements.`
      );
    } else {
      console.error("❌ Failed to get client secret");
    }

    return data;
  } catch (error) {
    console.error("❌ Test error:", error);
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
    };
  }
}

console.log("🧪 Stripe payment testing script loaded");
console.log('Call testStripePayment("order-id-here") to test');

// Make function available globally
window.testStripePayment = testStripePayment;
