# PayPal Webhook Setup Guide

## 🎯 Overview
This guide will help you set up PayPal webhooks for production-grade payment processing reliability.

## 📋 Prerequisites
- PayPal Developer Account
- Your website must be publicly accessible (for production) or use ngrok (for testing)
- PayPal App created in Developer Dashboard

## 🔧 Step-by-Step Setup

### 1. Access PayPal Developer Dashboard
1. Go to [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. Sign in with your PayPal Developer account
3. Navigate to **"My Apps & Credentials"**

### 2. Select Your Application
1. Click on your existing PayPal application
2. If you don't have one, create a new app:
   - Click **"Create App"**
   - Choose **"Default Application"**
   - Select **"Merchant"** features
   - Choose **"Sandbox"** for testing or **"Live"** for production

### 3. Add Webhook Configuration
1. In your app dashboard, find the **"Webhooks"** section
2. Click **"Add Webhook"**
3. Configure the webhook:

#### Webhook URL Configuration:
```
Development: https://your-ngrok-url.ngrok.io/api/webhook/paypal
Production: https://your-domain.com/api/webhook/paypal
```

#### Event Types to Subscribe To:
✅ **PAYMENT.CAPTURE.COMPLETED** (Required)
✅ **PAYMENT.CAPTURE.DENIED** (Recommended)
✅ **PAYMENT.CAPTURE.PENDING** (Recommended)
✅ **PAYMENT.CAPTURE.REFUNDED** (Recommended)

### 4. Get Webhook ID
1. After creating the webhook, copy the **Webhook ID**
2. It will look like: `WH-1A234567890123456-7B890123456789012`

### 5. Update Environment Variables
Add to your `.env.local` file:
```env
PAYPAL_WEBHOOK_ID=WH-your-webhook-id-here
```

### 6. Test Webhook Configuration
Run the webhook test script:
```bash
node scripts/test-paypal-webhook-local.js
```

### 7. Enable Webhook Signature Verification (Production)
In `app/api/webhook/paypal/route.ts`, uncomment and configure:
```typescript
// In production, verify the webhook signature
const isVerified = await verifyPayPalWebhook(request.headers, rawBody);
if (!isVerified) {
  console.error(`❌ PAYPAL WEBHOOK: Invalid signature`);
  return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
}
```

## 🧪 Testing Your Webhook

### Local Testing with ngrok
1. Install ngrok: `npm install -g ngrok`
2. Start your development server: `npm run dev`
3. In another terminal: `ngrok http 3000`
4. Use the ngrok URL for your webhook endpoint
5. Make a test PayPal payment

### Verify Webhook Events
Check your logs for webhook messages:
```
🚀 PAYPAL WEBHOOK: Starting POST request processing
📊 PAYPAL WEBHOOK: Event type: PAYMENT.CAPTURE.COMPLETED
✅ PAYPAL WEBHOOK: Successfully completed processing
```

## ⚡ Benefits of Webhook Setup

### Reliability
- **Backup Processing**: If frontend fails, webhook ensures order completion
- **Network Resilience**: Handles cases where user loses connection
- **Guaranteed Delivery**: PayPal retries failed webhook calls

### Business Benefits
- **Better Customer Experience**: Orders complete even if user closes browser
- **Reduced Support**: Fewer "payment went through but order didn't" issues
- **Industry Standard**: Expected by payment processors

### Technical Benefits
- **Separation of Concerns**: Payment capture separate from frontend
- **Audit Trail**: Complete log of all payment events
- **Future-Proof**: Ready for advanced features like refunds, disputes

## 🔍 Monitoring & Troubleshooting

### Webhook Logs
Monitor your application logs for webhook events:
```bash
# Filter for PayPal webhook logs
tail -f logs/application.log | grep "PAYPAL WEBHOOK"
```

### PayPal Developer Dashboard
- View webhook delivery attempts
- See failed webhook calls
- Retry failed webhooks manually

### Common Issues
1. **Webhook not receiving events**: Check URL accessibility
2. **Invalid signature**: Verify webhook ID and signature verification
3. **Processing errors**: Check application logs for errors

## 🚦 Current vs Future State

### Current (Frontend Processing Only)
```
Payment → Frontend Capture → Email/Cart/Stock
```

### With Webhooks (Dual Processing)
```
Payment → Frontend Capture → Email/Cart/Stock
       ↘ Webhook Backup → Email/Cart/Stock (if frontend failed)
```

## 🔧 Implementation Notes

Your current system will continue working with both:
- **Frontend processing** handles immediate cases
- **Webhook processing** handles edge cases and provides backup

This dual approach ensures maximum reliability for your production e-commerce platform. 