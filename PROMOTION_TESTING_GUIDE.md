# Promotion System Testing Guide

## Overview

This guide provides comprehensive manual testing procedures for the database-first promotion persistence system. It covers both authenticated and guest user flows, ensuring the system works correctly across all scenarios.

## Prerequisites

### Test Environment Setup
1. **Database**: Ensure you have a clean test database
2. **Promotions**: Create test promotions via admin panel
3. **Products**: Ensure you have products with inventory
4. **Payment Methods**: Configure test payment methods (Stripe test mode, PayPal sandbox)

### Test Promotion Codes
Create these test promotions in your admin panel:

```sql
-- Test Promotion 1: Percentage Discount
INSERT INTO "Promotion" (
  id, name, "promotionType", value, "startDate", "endDate", 
  "couponCode", "isActive", "usageLimit", "applyToAllItems"
) VALUES (
  'test-promo-1', 'Test 20% Off', 'PERCENTAGE_DISCOUNT', 20, 
  '2024-01-01', '2025-12-31', 'TEST20', true, 100, true
);

-- Test Promotion 2: Fixed Amount Discount  
INSERT INTO "Promotion" (
  id, name, "promotionType", value, "startDate", "endDate",
  "couponCode", "isActive", "usageLimit", "applyToAllItems"
) VALUES (
  'test-promo-2', 'Test $10 Off', 'FIXED_AMOUNT_DISCOUNT', 10,
  '2024-01-01', '2025-12-31', 'SAVE10', true, 50, true
);

-- Test Promotion 3: Limited Use
INSERT INTO "Promotion" (
  id, name, "promotionType", value, "startDate", "endDate",
  "couponCode", "isActive", "usageLimit", "applyToAllItems"
) VALUES (
  'test-promo-3', 'Limited Use 15% Off', 'PERCENTAGE_DISCOUNT', 15,
  '2024-01-01', '2025-12-31', 'LIMITED15', true, 1, true
);
```

## Test Scenarios

### 🧪 **Test Suite 1: Guest User Flow**

#### Test 1.1: Basic Promotion Application
**Objective**: Verify guest users can apply and use promotions

**Steps**:
1. **Open incognito/private browser window**
2. **Navigate to product page** → Add product to cart
3. **Go to cart page** `/cart`
4. **Apply promotion code**: `TEST20`
5. **Verify promotion appears** in applied promotions section
6. **Check cart totals** - discount should be applied
7. **Navigate to shipping** `/shipping`
8. **Verify promotion persists** in order summary
9. **Complete shipping form** and submit
10. **Navigate to confirmation** `/confirmation`
11. **Verify promotion still applied** in order summary
12. **Create order** (click "Save & Proceed to Payment")
13. **Complete test payment** (use Stripe test card: `4242424242424242`)
14. **Verify order completion**

**Expected Results**:
- ✅ Promotion applies successfully in cart
- ✅ Promotion persists to shipping page
- ✅ Promotion persists to confirmation page
- ✅ Order created with promotion data
- ✅ Payment completes successfully
- ✅ Email confirmation sent

**Database Verification**:
```sql
-- Check order has promotion data
SELECT id, "appliedPromotionId", "discountAmount", "guestEmail", total 
FROM "Order" 
WHERE "guestEmail" = 'your-test-email@example.com'
ORDER BY "createdAt" DESC LIMIT 1;

-- Check promotion usage was recorded
SELECT * FROM "PromotionUsage" 
WHERE "orderId" = 'order-id-from-above';

-- Check promotion usage count incremented
SELECT "usageCount" FROM "Promotion" 
WHERE "couponCode" = 'TEST20';
```

#### Test 1.2: Promotion Removal
**Objective**: Verify guest users can remove promotions

**Steps**:
1. **Start fresh incognito session**
2. **Add product to cart** and apply `SAVE10`
3. **Verify promotion applied**
4. **Remove promotion** (click X button)
5. **Verify promotion removed** and totals updated
6. **Navigate to shipping** - verify no promotion
7. **Complete checkout** without promotion

**Expected Results**:
- ✅ Promotion removes successfully
- ✅ Cart totals update correctly
- ✅ No promotion data in subsequent pages
- ✅ Order created without promotion

#### Test 1.3: Invalid Promotion Codes
**Objective**: Verify error handling for invalid codes

**Steps**:
1. **Add product to cart**
2. **Try invalid code**: `INVALID123`
3. **Verify error message** displayed
4. **Try expired code**: `EXPIRED15` (if you have one)
5. **Try code over usage limit**: Apply `LIMITED15` twice

**Expected Results**:
- ✅ Clear error messages for invalid codes
- ✅ No promotion applied for invalid codes
- ✅ Cart totals remain unchanged

### 🔐 **Test Suite 2: Authenticated User Flow**

#### Test 2.1: Logged-in User Promotion Flow
**Objective**: Verify authenticated users can apply and use promotions

**Steps**:
1. **Log in** to your account
2. **Add product to cart**
3. **Apply promotion**: `TEST20`
4. **Complete full checkout flow**
5. **Verify order in account** `/user/account/orders`

**Expected Results**:
- ✅ Same behavior as guest user
- ✅ Order linked to user account
- ✅ Promotion usage linked to user

**Database Verification**:
```sql
-- Check user order with promotion
SELECT o.id, o."appliedPromotionId", o."discountAmount", u.email, o.total
FROM "Order" o
JOIN "User" u ON o."userId" = u.id
WHERE u.email = 'your-account-email@example.com'
ORDER BY o."createdAt" DESC LIMIT 1;

-- Check promotion usage linked to user
SELECT pu.*, u.email
FROM "PromotionUsage" pu
JOIN "User" u ON pu."userId" = u.id
WHERE u.email = 'your-account-email@example.com'
ORDER BY pu."createdAt" DESC LIMIT 1;
```

#### Test 2.2: Cross-Session Persistence
**Objective**: Verify promotions persist across browser sessions

**Steps**:
1. **Log in** and add product to cart
2. **Apply promotion**: `SAVE10`
3. **Close browser completely**
4. **Reopen browser** and log in
5. **Navigate to cart**
6. **Verify promotion still applied**

**Expected Results**:
- ✅ Promotion persists across sessions for logged-in users

### 🔄 **Test Suite 3: Edge Cases and Error Scenarios**

#### Test 3.1: Browser Refresh Testing
**Objective**: Verify system handles browser refreshes

**Steps**:
1. **Apply promotion** in cart
2. **Refresh page** - verify promotion persists
3. **Navigate to shipping**
4. **Refresh page** - verify promotion persists
5. **Navigate to confirmation**
6. **Refresh page** - verify promotion persists

**Expected Results**:
- ✅ Promotions survive page refreshes on all pages

#### Test 3.2: Multiple Promotions (if supported)
**Objective**: Test multiple promotion handling

**Steps**:
1. **Apply first promotion**: `TEST20`
2. **Try to apply second**: `SAVE10`
3. **Verify system behavior** (should prevent or replace)

**Expected Results**:
- ✅ System handles multiple promotions according to business rules

#### Test 3.3: Network Interruption
**Objective**: Test system resilience

**Steps**:
1. **Apply promotion** in cart
2. **Disconnect internet** briefly
3. **Reconnect and navigate** to shipping
4. **Verify promotion state**

**Expected Results**:
- ✅ Promotion data recovers from database

### 💳 **Test Suite 4: Payment Integration**

#### Test 4.1: Stripe Payment with Promotion
**Objective**: Verify Stripe webhook processes promotions

**Steps**:
1. **Complete checkout** with promotion using Stripe
2. **Use test card**: `4242424242424242`
3. **Monitor webhook logs** in Stripe dashboard
4. **Verify email received**

**Expected Results**:
- ✅ Payment processes successfully
- ✅ Webhook records promotion usage
- ✅ Email includes promotion details

#### Test 4.2: PayPal Payment with Promotion
**Objective**: Verify PayPal webhook processes promotions

**Steps**:
1. **Complete checkout** with promotion using PayPal
2. **Use PayPal sandbox account**
3. **Monitor webhook logs**
4. **Verify email received**

**Expected Results**:
- ✅ Payment processes successfully
- ✅ Webhook records promotion usage
- ✅ Email includes promotion details

### 📊 **Test Suite 5: Analytics and Reporting**

#### Test 5.1: Promotion Usage Tracking
**Objective**: Verify promotion analytics work

**Steps**:
1. **Complete several orders** with different promotions
2. **Check admin dashboard** promotion reports
3. **Verify usage counts** are accurate

**Database Verification**:
```sql
-- Check promotion usage summary
SELECT 
  p.name,
  p."couponCode",
  p."usageCount",
  COUNT(pu.id) as recorded_usage,
  SUM(pu."discountAmount") as total_discount
FROM "Promotion" p
LEFT JOIN "PromotionUsage" pu ON p.id = pu."promotionId"
GROUP BY p.id, p.name, p."couponCode", p."usageCount"
ORDER BY p."usageCount" DESC;
```

#### Test 5.2: Revenue Impact Analysis
**Objective**: Verify promotion impact tracking

**Steps**:
1. **Review promotion usage data**
2. **Calculate total discounts given**
3. **Verify order totals are correct**

**Database Verification**:
```sql
-- Analyze promotion impact
SELECT 
  DATE(pu."createdAt") as date,
  COUNT(*) as orders_with_promotions,
  SUM(pu."discountAmount") as total_discounts,
  AVG(pu."originalAmount") as avg_order_before_discount,
  AVG(pu."finalAmount") as avg_order_after_discount
FROM "PromotionUsage" pu
GROUP BY DATE(pu."createdAt")
ORDER BY date DESC;
```

## Troubleshooting Guide

### Common Issues and Solutions

#### Issue: Promotion doesn't persist to shipping page
**Diagnosis**:
```sql
-- Check if cart promotion exists
SELECT * FROM "CartPromotion" WHERE "cartId" = 'your-cart-id';
```
**Solution**: Verify `useCartPromotions` hook is using `cartData` parameter

#### Issue: Order created without promotion data
**Diagnosis**:
```sql
-- Check recent orders
SELECT id, "appliedPromotionId", "discountAmount" 
FROM "Order" 
ORDER BY "createdAt" DESC LIMIT 5;
```
**Solution**: Verify order creation passes `appliedPromotion` data

#### Issue: Promotion usage not recorded
**Diagnosis**:
```sql
-- Check if webhook processed
SELECT * FROM "PromotionUsage" 
WHERE "orderId" = 'your-order-id';
```
**Solution**: Check webhook logs and `recordPromotionUsage` function

#### Issue: Email not sent
**Diagnosis**: Check email service configuration and webhook logs
**Solution**: Verify `sendOrderConfirmationEmail` is called in webhooks

## Performance Testing

### Load Testing Scenarios

#### Scenario 1: Concurrent Promotion Applications
1. **Simulate 10+ users** applying same promotion simultaneously
2. **Verify no race conditions** in promotion application
3. **Check database consistency**

#### Scenario 2: High-Volume Checkout
1. **Process multiple orders** with promotions quickly
2. **Verify webhook processing** handles load
3. **Monitor database performance**

## Test Data Cleanup

After testing, clean up test data:

```sql
-- Clean up test orders and related data
DELETE FROM "PromotionUsage" WHERE "promotionId" IN (
  SELECT id FROM "Promotion" WHERE "couponCode" LIKE 'TEST%'
);

DELETE FROM "OrderItem" WHERE "orderId" IN (
  SELECT id FROM "Order" WHERE "appliedPromotionId" IN (
    SELECT id FROM "Promotion" WHERE "couponCode" LIKE 'TEST%'
  )
);

DELETE FROM "Order" WHERE "appliedPromotionId" IN (
  SELECT id FROM "Promotion" WHERE "couponCode" LIKE 'TEST%'
);

DELETE FROM "CartPromotion" WHERE "promotionId" IN (
  SELECT id FROM "Promotion" WHERE "couponCode" LIKE 'TEST%'
);

-- Reset promotion usage counts
UPDATE "Promotion" SET "usageCount" = 0 
WHERE "couponCode" LIKE 'TEST%';
```

## Success Criteria

### ✅ **System Reliability**
- [ ] Promotions persist across all pages (cart → shipping → confirmation)
- [ ] Works consistently for guest and authenticated users
- [ ] Survives browser refreshes and navigation
- [ ] Handles concurrent user sessions

### ✅ **Business Integration**
- [ ] Orders created with correct promotion data
- [ ] Webhooks process promotion usage correctly
- [ ] Email confirmations include promotion details
- [ ] Analytics track promotion effectiveness

### ✅ **User Experience**
- [ ] Clean UI without debug messages
- [ ] No duplicate toast notifications
- [ ] Consistent pricing throughout checkout
- [ ] Fast and responsive promotion application

### ✅ **Error Handling**
- [ ] Invalid promotion codes show clear errors
- [ ] Expired promotions are rejected
- [ ] Network failures handled gracefully
- [ ] System recovers from interruptions

## Reporting Template

Use this template to document test results:

```
## Test Execution Report

**Date**: [Date]
**Tester**: [Name]
**Environment**: [Dev/Staging/Prod]

### Test Results Summary
- Total Tests: [X]
- Passed: [X]
- Failed: [X]
- Skipped: [X]

### Failed Tests
1. **Test Name**: [Name]
   - **Issue**: [Description]
   - **Steps to Reproduce**: [Steps]
   - **Expected**: [Expected Result]
   - **Actual**: [Actual Result]
   - **Priority**: [High/Medium/Low]

### Database State
- Promotions Created: [X]
- Orders Processed: [X]
- Usage Records: [X]
- Emails Sent: [X]

### Performance Notes
- Average Response Time: [X]ms
- Database Query Performance: [Notes]
- Memory Usage: [Notes]

### Recommendations
- [Any recommendations for improvements]
```

This comprehensive testing guide ensures the promotion system works reliably across all user scenarios and integrates properly with the payment and email systems. 