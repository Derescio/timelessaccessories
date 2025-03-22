import dotenv from "dotenv";
dotenv.config();

// Constants from environment
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYPAL_APP_SECRET || "";
const PAYPAL_API_BASE =
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

// Get order ID from command line argument, if provided
const inputOrderId = process.argv[2];

async function getAccessToken() {
  try {
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString(
      "base64"
    );
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${auth}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get PayPal access token: ${errorText}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error getting PayPal access token:", error);
    throw new Error("Failed to authenticate with PayPal");
  }
}

async function createTestOrder() {
  try {
    console.log("Creating a test order for capture...");
    const accessToken = await getAccessToken();

    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "5.00",
          },
          description: "Test order for capture API testing",
        },
      ],
      application_context: {
        brand_name: "Timeless Accessories",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: "https://example.com/success",
        cancel_url: "https://example.com/cancel",
      },
    };

    const response = await fetch(`${PAYPAL_API_BASE}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
        "PayPal-Request-Id": `test-order-${Date.now()}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create test order: ${errorText}`);
    }

    const orderResponse = await response.json();
    console.log("Test order created with ID:", orderResponse.id);
    return orderResponse.id;
  } catch (error) {
    console.error("Error creating test order:", error);
    throw error;
  }
}
//const orderId = '1JA78948GU6117446';
async function getOrderDetails(orderId) {
  try {
    console.log(`Getting details for order: ${orderId}`);
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const responseStatus = response.status;
    console.log("Response status:", responseStatus);

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(`Failed to get order details: ${responseText}`);
    }

    const orderDetails = JSON.parse(responseText);
    console.log("Order status:", orderDetails.status);

    return orderDetails;
  } catch (error) {
    console.error("Error getting order details:", error);
    throw error;
  }
}

async function capturePayment(orderId) {
  try {
    console.log(`Attempting to capture payment for order: ${orderId}`);
    const accessToken = await getAccessToken();

    const response = await fetch(
      `${PAYPAL_API_BASE}/v2/checkout/orders/${orderId}/capture`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
          "PayPal-Request-Id": `capture-${Date.now()}`,
        },
        // Empty body as required by PayPal API
      }
    );

    const responseStatus = response.status;
    console.log("Response status:", responseStatus);

    const responseText = await response.text();
    console.log(
      "Response body (first 500 chars):",
      responseText.substring(0, 500) + (responseText.length > 500 ? "..." : "")
    );

    if (!response.ok) {
      if (responseText.includes("PERMISSION_DENIED")) {
        console.error("\n❌ PERMISSION DENIED ERROR DETECTED!");
        console.error(
          "This confirms the same permission issue that your application is encountering."
        );
        console.error(
          "You need to configure the correct permissions in your PayPal Developer Dashboard:"
        );
        console.error(
          "- Make sure your app has Transaction Search, Vault, Orders, and Payments capabilities"
        );
      }

      throw new Error(`Failed to capture payment: ${responseText}`);
    }

    const captureResponse = JSON.parse(responseText);

    console.log("\nPayment captured successfully!");
    console.log("Capture ID:", captureResponse.id);
    console.log("Status:", captureResponse.status);

    return captureResponse;
  } catch (error) {
    console.error("Error capturing payment:", error);
    throw error;
  }
}

// Self-executing async function to run the test
(async () => {
  console.log("Testing PayPal payment capture...");
  try {
    // Use provided order ID or create a new test order
    const orderId = inputOrderId || (await createTestOrder());
    console.log(`Using order ID: ${orderId}`);

    // Get order details to check its status
    const orderDetails = await getOrderDetails(orderId);

    // Check if order is in a status that can be captured
    if (
      orderDetails.status !== "APPROVED" &&
      orderDetails.status !== "COMPLETED"
    ) {
      console.warn(
        "\n⚠️ Warning: Order is not in APPROVED status, capture may fail"
      );
      console.warn("Order status:", orderDetails.status);
      console.warn(
        "For sandbox testing, you typically need to approve the order through the PayPal UI flow"
      );

      if (!inputOrderId) {
        console.warn(
          "\nThis is a test order we just created, so it cannot be captured directly."
        );
        console.warn("To properly test capture, you need to:");
        console.warn("1. Create an order through your application");
        console.warn("2. Approve it via the PayPal UI flow");
        console.warn("3. Run this script with the approved order ID:");
        console.warn(
          `   node scripts/test-paypal-capture.js YOUR_APPROVED_ORDER_ID`
        );
        process.exit(0);
      }

      console.log(
        "\nAttempting capture anyway to see the exact error response..."
      );
    }

    // Attempt to capture the payment
    await capturePayment(orderId);
    console.log("\nTest completed successfully!");
  } catch (error) {
    console.error("\nTest failed:", error);
    process.exit(1);
  }
})();
