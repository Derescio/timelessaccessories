import dotenv from "dotenv";
import crypto from "crypto";
dotenv.config();

// Constants from environment
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || "";
const CLIENT_SECRET = process.env.PAYPAL_APP_SECRET || "";
const PAYPAL_API_BASE =
  process.env.PAYPAL_API_URL || "https://api-m.sandbox.paypal.com";

// You will need to create a webhook in the PayPal Developer Dashboard and set this ID
const WEBHOOK_ID = process.env.PAYPAL_WEBHOOK_ID || "";

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

async function verifyWebhookSignature(webhookId, eventBody, headers) {
  try {
    console.log("Verifying webhook signature...");
    const accessToken = await getAccessToken();

    const verificationData = {
      webhook_id: webhookId,
      event_body: eventBody,
      transmission_id: headers["paypal-transmission-id"],
      transmission_time: headers["paypal-transmission-time"],
      cert_url: headers["paypal-cert-url"],
      auth_algo: headers["paypal-auth-algo"],
      transmission_sig: headers["paypal-transmission-sig"],
    };

    const response = await fetch(
      `${PAYPAL_API_BASE}/v1/notifications/verify-webhook-signature`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(verificationData),
      }
    );

    const responseStatus = response.status;
    console.log("Response status:", responseStatus);

    const responseText = await response.text();
    console.log("Response body:", responseText);

    if (!response.ok) {
      throw new Error(`Failed to verify webhook signature: ${responseText}`);
    }

    const verificationResponse = JSON.parse(responseText);

    console.log(
      "\nVerification result:",
      verificationResponse.verification_status
    );

    return verificationResponse.verification_status === "SUCCESS";
  } catch (error) {
    console.error("Error verifying webhook signature:", error);
    throw error;
  }
}

function generateMockWebhookEvent() {
  // Create a sample event body - this simulates what PayPal would send
  const eventBody = JSON.stringify({
    id: `WH-${Date.now()}-${Math.floor(Math.random() * 1000000)}`,
    event_type: "PAYMENT.CAPTURE.COMPLETED",
    create_time: new Date().toISOString(),
    resource: {
      id: `CAP-${Date.now()}`,
      status: "COMPLETED",
      amount: {
        currency_code: "USD",
        value: "10.00",
      },
    },
    links: [],
  });

  // Generate mock headers (these won't be valid for verification, but show the structure)
  const mockHeaders = {
    "paypal-transmission-id": `${Date.now()}-${crypto.randomBytes(8).toString("hex")}`,
    "paypal-transmission-time": new Date().toISOString(),
    "paypal-cert-url":
      "https://api-m.sandbox.paypal.com/v1/notifications/certs/CERT-123",
    "paypal-auth-algo": "SHA256withRSA",
    "paypal-transmission-sig": "invalid-signature-for-testing",
  };

  return { eventBody, mockHeaders };
}

// Self-executing async function to run the test
(async () => {
  console.log("Testing PayPal webhook verification...");

  // Check if webhook ID is set
  if (!WEBHOOK_ID) {
    console.error(
      "\n❌ Error: PAYPAL_WEBHOOK_ID is not set in your environment variables"
    );
    console.error(
      "You need to create a webhook in the PayPal Developer Dashboard and set the ID"
    );
    console.error("Instructions:");
    console.error("1. Go to https://developer.paypal.com/dashboard/");
    console.error("2. Navigate to Your Apps > Select your app > Webhooks");
    console.error(
      "3. Add a webhook with your endpoint URL (e.g., https://your-site.com/api/webhooks/paypal)"
    );
    console.error(
      "4. Configure event types to listen for (e.g., PAYMENT.CAPTURE.COMPLETED)"
    );
    console.error(
      "5. Copy the Webhook ID and set it as PAYPAL_WEBHOOK_ID in your .env file"
    );
    process.exit(1);
  }

  try {
    const { eventBody, mockHeaders } = generateMockWebhookEvent();

    console.log("Mock event body:", eventBody);
    console.log(
      "Mock headers (these will not pass real verification):",
      mockHeaders
    );

    console.log(
      "\nNotice: Real verification will fail with these mock values."
    );
    console.log(
      "This test is to verify your webhook ID and API configuration."
    );

    try {
      await verifyWebhookSignature(WEBHOOK_ID, eventBody, mockHeaders);
      console.log(
        "Note: If verification succeeded with mock data, something unusual is happening."
      );
    } catch (error) {
      console.log(
        "\nExpected verification error with mock data:",
        error.message
      );
      console.log(
        "This is normal because we used mock data that PayPal did not sign."
      );
      console.log("\nTo test with real data, you need to:");
      console.log("1. Implement the webhook endpoint in your application");
      console.log("2. Make it log all request headers and body");
      console.log("3. Trigger a real PayPal event (like a test payment)");
      console.log("4. Use the real headers and body in this verification test");
    }

    console.log("\nWebhook configuration test completed!");
  } catch (error) {
    console.error("\nTest failed unexpectedly:", error);
    process.exit(1);
  }
})();
