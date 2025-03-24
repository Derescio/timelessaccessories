# Payment Processing Tools

This directory contains utility scripts for testing and debugging payment processing in the Timeless Accessories e-commerce platform.

## Available Scripts

### Order Status

```bash
# Check status of an order and its payment
npm run check-order <orderId>
```

Example:

```bash
npm run check-order cm8m02ncq000d20gchkoje34b
```

This will display detailed information about the order, including its payment status, items, and customer information.

### Stripe Payment Processing

```bash
# Manually process a Stripe payment that succeeded but wasn't properly handled by webhooks
npm run process-payment <orderId> <paymentIntentId>
```

Example:

```bash
npm run process-payment cm8m02ncq000d20gchkoje34b pi_3R5ti84hgKBUixPS1N7Hl5RV
```

This script:

1. Retrieves the specified payment intent from Stripe
2. Ensures it has the correct order ID in its metadata
3. Creates a simulated `payment_intent.succeeded` webhook event
4. Sends it to the local webhook endpoint for processing

Use this tool when:

- A customer reports their payment was successful but their order is still in "Pending" status
- You see a successful payment in Stripe but the webhook failed to update the order status

### Stripe Webhook Testing

```bash
# Test the Stripe webhook handler with a sample event
npm run test:stripe-webhook <eventType> [orderId]
```

Examples:

```bash
# General webhook test
npm run test:stripe-webhook payment_intent.succeeded

# Test with specific order ID
npm run test:stripe-webhook payment_intent.succeeded cm8m02ncq000d20gchkoje34b
```

This script:

1. Creates a sample Stripe event of the specified type
2. Sends it to the local webhook endpoint for processing
3. Reports on the success or failure of the webhook handler

### PayPal Testing

```bash
# Test PayPal order capture
npm run test:paypal-capture <orderId>

# Test PayPal webhooks
npm run test:paypal-webhook <eventType> [orderId]
```

Examples:

```bash
npm run test:paypal-capture cm8m02ncq000d20gchkoje34b
npm run test:paypal-webhook PAYMENT.CAPTURE.COMPLETED
```

## Troubleshooting Payment Issues

When a customer reports payment issues:

1. Use `npm run check-order <orderId>` to check the current status of the order and payment
2. Check the payment provider dashboard (Stripe or PayPal) to confirm if payment was successful
3. If payment succeeded but order status is still "Pending":
   - For Stripe: Use `npm run process-payment <orderId> <paymentIntentId>` to manually trigger the webhook
   - For PayPal: Use `npm run test:paypal-webhook PAYMENT.CAPTURE.COMPLETED <orderId>`
4. Check the order status again to confirm it was updated

## Development Notes

- These scripts access the database directly using Prisma
- Environment variables must be properly configured for scripts to work
- For local testing, make sure the Next.js development server is running
- Scripts use webhook signatures for security, simulating the real payment provider webhooks
