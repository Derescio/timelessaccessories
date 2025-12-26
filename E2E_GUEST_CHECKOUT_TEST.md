# E2E Guest Checkout Test Guide

## Server Status
✅ Development server is starting...

## Test Flow Steps

### Step 1: Browse Products (No Authentication)
**Action:** Navigate to homepage and browse products
**Expected Logs:**
- No authentication required
- Products load successfully
- Session cart ID generated (if not exists)

**Checkpoints:**
- [ ] Can view product listings
- [ ] Can view product details
- [ ] No authentication errors

---

### Step 2: Add Items to Cart
**Action:** Add one or more products to cart
**Expected Logs:**
```
🛒 Cart operations - Adding item to cart
🛒 Cart operations - Session cart ID: [uuid]
🛒 Cart operations - Item added successfully
```

**Checkpoints:**
- [ ] Items added to cart
- [ ] Cart count updates in header
- [ ] Session cart ID cookie is set

---

### Step 3: Proceed to Checkout
**Action:** Go to cart and proceed to checkout with `?guest=true`
**Expected Logs:**
```
🔒 Auth Config - Guest checkout allowed
🛒 Cart operations - Cart retrieved
```

**Checkpoints:**
- [ ] Can access `/shipping?guest=true`
- [ ] Can access `/payment-method?guest=true`
- [ ] Can access `/place-order?guest=true`

---

### Step 4: Fill Shipping Information
**Action:** Enter guest shipping details
**Expected Logs:**
```
📦 Order creation - Creating guest order
📦 Order creation - Guest email: [email]
📦 Order creation - Session ID: [sessionCartId]
```

**Checkpoints:**
- [ ] Shipping form accepts guest email
- [ ] Address information saved
- [ ] Order created with `guestEmail` (no `userId`)

---

### Step 5: Select Payment Method
**Action:** Choose Stripe or PayPal
**Expected Logs:**
- Payment method selection logged
- Order ID displayed

**Checkpoints:**
- [ ] Payment method selection works
- [ ] Order ID is visible

---

### Step 6: Complete Payment (Stripe)
**Action:** Complete Stripe payment
**Expected Logs:**

**Before Payment:**
```
💳 Payment Success Page - Accessed for order: [orderId]
💳 Payment Success Page - User authenticated: false
💳 Payment Success Page - User ID: Guest
💳 Payment Success Page - Fetching order details
💳 Payment Success Page - Order found: { id, total }
💳 Payment Success Page - Retrieving payment intent
💳 Payment Success Page - Payment status: succeeded
```

**After Payment (Webhook):**
```
🚀 WEBHOOK [timestamp]: Starting POST request processing
📊 WEBHOOK [timestamp]: Event type: checkout.session.completed
🔄 WEBHOOK [timestamp]: Processing checkout.session.completed for order: [orderId]
📦 WEBHOOK [timestamp]: Updating order to paid: [orderId]
✅ WEBHOOK [timestamp]: Order updated successfully: [orderId]
📦 WEBHOOK [timestamp]: About to reduce stock for confirmed order: [orderId]
🔄 reduceOrderStock: Starting for order: [orderId]
📋 reduceOrderStock: Found [X] order items
🔄 reduceActualStock called with inventoryId: [id], quantity: [qty]
📊 Found inventory [sku]: { currentQuantity, currentReservedStock, requestedReduction }
🔄 Reducing stock: quantity by [qty], reservedStock by [released]
✅ Stock updated for [sku]: { newQuantity, newReservedStock, releasedReservedStock }
✅ reduceOrderStock: Successfully reduced stock for all [X] items
✅ WEBHOOK [timestamp]: Stock reduced successfully for order: [orderId]
📧 WEBHOOK [timestamp]: Sending order confirmation email for: [orderId]
✅ WEBHOOK [timestamp]: Email sent successfully for order: [orderId]
🎯 WEBHOOK [timestamp]: About to call recordPromotionUsage for order: [orderId]
✅ WEBHOOK [timestamp]: recordPromotionUsage completed for order: [orderId]
✅ WEBHOOK [timestamp]: Successfully completed processing for order: [orderId]
```

**Checkpoints:**
- [ ] Payment intent created successfully
- [ ] Payment completes
- [ ] Webhook receives event
- [ ] Order status updates to PROCESSING
- [ ] Stock is reduced (both quantity and reservedStock)
- [ ] Confirmation email sent
- [ ] Promotion usage recorded (if applicable)
- [ ] Cart is cleaned up

---

### Step 7: View Order Confirmation
**Action:** View success page after payment
**Expected Logs:**
```
💳 Payment Success Page - Payment successful, rendering success page
```

**Checkpoints:**
- [ ] Success page displays
- [ ] Order ID shown
- [ ] Total amount correct
- [ ] Guest email confirmation message shown
- [ ] No errors in console

---

## Critical Logs to Monitor

### 1. Order Creation
- ✅ Order created with `guestEmail`
- ✅ Order has no `userId` (null)
- ✅ Order status is `PENDING`
- ✅ Cart items converted to order items

### 2. Stock Reservation
- ✅ Stock reserved when order created
- ✅ `reservedStock` incremented
- ✅ Actual `quantity` not yet reduced

### 3. Payment Processing
- ✅ Payment intent created
- ✅ Payment succeeds
- ✅ Webhook triggered

### 4. Post-Payment Actions
- ✅ Order status → `PROCESSING`
- ✅ Payment record created with `COMPLETED`
- ✅ Stock `quantity` decremented
- ✅ Stock `reservedStock` decremented (released)
- ✅ Cart deleted
- ✅ Email sent
- ✅ Promotion usage recorded

### 5. No Duplicate Actions
- ✅ Email sent only once
- ✅ Stock reduced only once
- ✅ Cart cleaned up only once

---

## What to Watch For

### ✅ Success Indicators
- All webhook logs appear in sequence
- Stock reduction shows both quantity and reservedStock changes
- No error messages in logs
- Order status updates correctly
- Email confirmation sent

### ⚠️ Warning Signs
- Missing webhook logs (webhook may not have fired)
- Stock not reduced (check `reduceOrderStock` logs)
- Reserved stock not released (check `reduceActualStock` logs)
- Email not sent (check email service logs)
- Cart not cleaned up (check `cleanupCartAfterSuccessfulPayment` logs)
- Duplicate actions (same log appears twice)

### ❌ Error Indicators
- Webhook signature verification fails
- Order not found errors
- Stock reduction failures
- Email sending errors
- Database transaction errors

---

## Test Checklist

### Pre-Test
- [ ] Server is running
- [ ] Database is accessible
- [ ] Stripe test keys configured
- [ ] Email service configured
- [ ] Clear browser cookies (start fresh)

### During Test
- [ ] Browse products ✅
- [ ] Add to cart ✅
- [ ] Proceed to checkout with `?guest=true` ✅
- [ ] Fill shipping info ✅
- [ ] Select payment method ✅
- [ ] Complete payment ✅
- [ ] View confirmation page ✅

### Post-Test Verification
- [ ] Check database:
  - [ ] Order status is `PROCESSING`
  - [ ] Order has `guestEmail` set
  - [ ] Order has no `userId` (null)
  - [ ] Payment record exists with `COMPLETED` status
  - [ ] Cart is deleted
  - [ ] Stock quantities reduced
  - [ ] Reserved stock released
- [ ] Check email inbox for confirmation
- [ ] Review all logs for errors

---

## Log Collection Commands

If you want to save logs to a file:

```bash
# Windows PowerShell
npm run dev 2>&1 | Tee-Object -FilePath "guest-checkout-logs.txt"

# Or redirect to file
npm run dev > guest-checkout-logs.txt 2>&1
```

---

## Expected Database State After Test

### Order Table
- Status: `PROCESSING`
- `guestEmail`: [test email]
- `userId`: `null`
- `chargeId`: [payment intent ID]
- `status`: `PROCESSING`

### Payment Table
- `status`: `COMPLETED`
- `provider`: `Stripe`
- `paymentId`: [payment intent ID]
- `amount`: [order total]

### ProductInventory Table
- `quantity`: [reduced by order quantity]
- `reservedStock`: [reduced by order quantity]

### Cart Table
- Cart record: **DELETED**
- Cart items: **DELETED**

---

## Troubleshooting

### Webhook Not Firing
- Check Stripe dashboard for webhook events
- Verify webhook URL is correct
- Check webhook secret is configured
- Verify signature verification

### Stock Not Reduced
- Check `reduceOrderStock` function logs
- Verify order items exist
- Check inventory IDs match
- Verify transaction completed

### Email Not Sent
- Check email service configuration
- Verify email address is valid
- Check email service logs
- Verify `sendOrderConfirmationEmail` was called

### Cart Not Cleaned Up
- Check `cleanupCartAfterSuccessfulPayment` logs
- Verify order has `cartId`
- Check cart exists before cleanup
- Verify deletion succeeded

---

## Next Steps After Test

1. Review all logs collected
2. Verify database state matches expectations
3. Check email was received
4. Document any issues found
5. Test again if any actions failed



