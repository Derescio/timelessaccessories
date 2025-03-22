import dotenv from "dotenv";
dotenv.config();

// Constants from environment
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYPAL_APP_SECRET || "";
const PAYPAL_API_BASE =
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

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

async function createPayPalOrder() {
  try {
    console.log("Getting access token...");
    const accessToken = await getAccessToken();

    console.log("Creating PayPal order...");
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: "10.00", // Test amount
          },
          description: "Test order for API verification",
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
        "PayPal-Request-Id": `test-order-${Date.now()}`, // Unique request ID
      },
      body: JSON.stringify(orderData),
    });

    const responseStatus = response.status;
    console.log("Response status:", responseStatus);

    const responseText = await response.text();
    console.log(
      "Response body (first 500 chars):",
      responseText.substring(0, 500) + (responseText.length > 500 ? "..." : "")
    );

    if (!response.ok) {
      throw new Error(`Failed to create PayPal order: ${responseText}`);
    }

    const orderResponse = JSON.parse(responseText);

    console.log("\nOrder created successfully!");
    console.log("Order ID:", orderResponse.id);
    console.log("Order Status:", orderResponse.status);
    console.log("Links:");

    orderResponse.links.forEach((link) => {
      console.log(`- ${link.rel}: ${link.href} [${link.method}]`);
    });

    // Return the order ID for use in the next test
    return orderResponse.id;
  } catch (error) {
    console.error("Error creating PayPal order:", error);
    throw error;
  }
}

// Self-executing async function to run the test
(async () => {
  console.log("Testing PayPal order creation...");
  try {
    const orderId = await createPayPalOrder();
    console.log("\nTest completed successfully!");
    console.log("You can use this order ID for capture testing:", orderId);
    console.log(
      "Note: This is a sandbox order and cannot be directly approved without the PayPal UI flow"
    );
  } catch (error) {
    console.error("\nTest failed:", error);
    process.exit(1);
  }
})();
