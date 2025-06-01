const { sendOrderConfirmationEmail } = require("../email/index.tsx");

async function testOrderEmail() {
  const orderId = "cmbe1zv4q000320ocvh15af49"; // Your recent order ID

  console.log(`Testing email for order: ${orderId}`);

  try {
    await sendOrderConfirmationEmail(orderId);
    console.log("✅ Email sent successfully!");
  } catch (error) {
    console.error("❌ Email failed:", error);
  }
}

testOrderEmail();
