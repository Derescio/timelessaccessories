// Test utility for verifying checkout flow
// Run this file with node to simulate the checkout process and log address details

/**
 * This is a simple test utility to verify our postal code fixes
 * It simulates the localStorage and checkout data flow
 */
import fs from "fs";
import path from "path";

// Set up a log file
const logFile = path.join(__dirname, "../../checkout-test-log-lasco.txt");
function writeLog(message) {
  fs.appendFileSync(logFile, message + "\n");
}

// Clear previous log file
if (fs.existsSync(logFile)) {
  fs.unlinkSync(logFile);
}

// Mock checkout data with postal code for LASCO market
const mockCheckoutData = {
  shippingAddress: {
    fullName: "Test User",
    streetAddress: "123 Test St",
    city: "Test City",
    state: "Test State",
    postalCode: "12345",
    zipCode: "12345", // Verify both field names
    parish: "Kingston", // For LASCO market, use parish instead of country
    courier: "Courier Service 1", // LASCO specific
    shippingPrice: 1500,
  },
  paymentMethod: {
    type: "LascoPay",
  },
  useCourier: true, // LASCO specific
  orderId: "test-order-id", // LASCO specific
};

// Simulate data transformation in checkout process for LASCO market
function simulateCheckoutProcess() {
  writeLog("Starting LASCO market checkout process simulation...");

  // Step 1: Saving checkout data to localStorage (shipping page)
  writeLog("Step 1: Saving checkout data for LASCO market");
  writeLog(
    "Checkout data in shipping page: " +
      JSON.stringify(
        {
          ...mockCheckoutData,
          shippingAddress: {
            ...mockCheckoutData.shippingAddress,
            postalCode: mockCheckoutData.shippingAddress.postalCode,
          },
        },
        null,
        2
      )
  );

  // Step 2: Transform the data for order creation (shipping page for LASCO)
  writeLog("\nStep 2: Preparing order data in shipping page (LASCO flow)");

  // This is how we create the address data in order.actions.ts
  const addressData = {
    userId: "test-user-id",
    street: mockCheckoutData.shippingAddress.streetAddress || "",
    city: mockCheckoutData.shippingAddress.city || "",
    state: mockCheckoutData.shippingAddress.state || "",
    postalCode: mockCheckoutData.shippingAddress.postalCode || "",
    country: mockCheckoutData.shippingAddress.parish || "", // For LASCO, the parish is stored in country field
  };

  writeLog(
    "Address data for database: " + JSON.stringify(addressData, null, 2)
  );

  // Step 3: Create order shipping data (order creation)
  writeLog("\nStep 3: Creating order with shipping address (LASCO flow)");

  const orderData = {
    cartId: "test-cart-id",
    shippingAddress: {
      fullName: mockCheckoutData.shippingAddress.fullName,
      email: "test@example.com",
      phone: "",
      address: mockCheckoutData.shippingAddress.streetAddress,
      city: mockCheckoutData.shippingAddress.city,
      state: mockCheckoutData.shippingAddress.state || "",
      zipCode: mockCheckoutData.shippingAddress.postalCode || "",
      country: mockCheckoutData.shippingAddress.parish || "", // For LASCO, use parish
    },
    shipping: {
      method: `Courier - ${mockCheckoutData.shippingAddress.courier}`,
      cost: mockCheckoutData.shippingAddress.shippingPrice || 0,
    },
    payment: {
      method: mockCheckoutData.paymentMethod.type,
      status: "PENDING",
      providerId: "", // Will be filled after LascoPay payment
    },
    subtotal: 10000,
    tax: 700,
    total: 12200, // Including courier cost
    status: "PENDING",
  };

  writeLog(
    "Order data for order creation: " +
      JSON.stringify(
        {
          ...orderData,
          shippingAddress: {
            ...orderData.shippingAddress,
            zipCode: orderData.shippingAddress.zipCode, // Highlight the zipCode field
            country: orderData.shippingAddress.country, // Highlight the country field (parish)
          },
        },
        null,
        2
      )
  );

  writeLog("\nTest complete!");
  console.log(`LASCO market test completed. Check ${logFile} for results.`);
}

// Run the simulation
simulateCheckoutProcess();

// To run this test: node lib/utils/test-checkout-flow.js
