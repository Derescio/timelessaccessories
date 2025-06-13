# 🎯 Promotion System Testing Checklist

## Updates (2024-06)
- **Per-User Limit:** Promotions can now have a per-user limit (`perUserLimit`). This restricts how many times a user (by account or guest email) can use a code.
- **Guest Email Enforcement:** Guests must enter an email to use promo codes. Usage is tracked by email.
- **Promo Code Persistence:** Promo codes are **not** auto-applied to new carts. After an order is placed or the cart is emptied, all applied promotions are cleared.
- **Cart Filtering:** If a guest has used a promo code up to their per-user limit, it will not be shown as applied in the cart for new items.

## Overview
This document provides comprehensive test cases for the promotion/coupon system. Use this checklist to ensure all promotion features work correctly across different scenarios.

## 🚀 Quick Setup
1. Run the test data script: `node scripts/create-promotion-test-cases.js`
2. Ensure you have products in your cart for testing
3. Test both as guest user and authenticated user

---

## 📋 Test Categories

### 1. PERCENTAGE DISCOUNT PROMOTIONS

#### 1.1 Site-wide Percentage Discount
- **Code:** `SAVE20`
- **Expected:** 20% off entire cart
- **Test Scenarios:**
  - [ ] Cart with single item ($550 Addidas shoes → $440)
  - [ ] Cart with multiple items
  - [ ] Empty cart (should show error)
  - [ ] Very small cart ($1 → $0.80)
 
#### 1.2 Welcome New Customer Discount
- **Code:** `WELCOME15`
- **Expected:** 15% off, one-time use per user
- **Test Scenarios:**
  - [ ] First-time use as guest user
  - [ ] First-time use as authenticated user
  - [ ] Second attempt by same user (should fail)
  - [ ] Different user using same code (should work)

#### 1.3 VIP Members Only
- **Code:** `VIP25`
- **Expected:** 25% off, requires authentication
- **Test Scenarios:**
  - [ ] Use as guest user (should fail with auth error)
  - [ ] Use as authenticated user (should work)
  - [ ] Sign in prompt appears for guest users

#### 1.4 Category-Specific Discount
- **Code:** `BRACELETS30`
- **Expected:** 30% off bracelet items only
- **Test Scenarios:**
  - [ ] Cart with only bracelet items
  - [ ] Cart with mixed items (only bracelets discounted)
  - [ ] Cart with no bracelet items (should fail)

### 2. FIXED AMOUNT DISCOUNT PROMOTIONS

#### 2.1 Minimum Order Requirement
- **Code:** `SAVE50`
- **Expected:** $50 off orders over $200
- **Test Scenarios:**
  - [ ] Cart total $199 (should fail - below minimum)
  - [ ] Cart total $200 (should work - exactly minimum)
  - [ ] Cart total $250 (should work - $50 off = $200)
  - [ ] Cart total $49 (discount larger than total - should cap at cart total)

#### 2.2 Small Fixed Discount
- **Code:** `TEST10`
- **Expected:** $10 off any order
- **Test Scenarios:**
  - [ ] Cart total $50 → $40
  - [ ] Cart total $5 → $0 (discount caps at cart total)
  - [ ] Multiple items in cart

#### 2.3 Premium Customer Discount
- **Code:** `PREMIUM100`
- **Expected:** $100 off orders over $500, requires auth
- **Test Scenarios:**
  - [ ] Guest user with $600 cart (should fail - auth required)
  - [ ] Authenticated user with $499 cart (should fail - below minimum)
  - [ ] Authenticated user with $600 cart (should work - $100 off)

### 3. BUY ONE GET ONE (BOGO) PROMOTIONS

#### 3.1 BOGO 50% Off
- **Code:** `BOGO50`
- **Expected:** 50% off cheapest item
- **Test Scenarios:**
  - [ ] Two items: $100 + $50 → discount $25 (50% off $50 item)
  - [ ] Three items: $100 + $80 + $50 → discount $25 (50% off cheapest)
  - [ ] Single item (should still work - 50% off that item)
  - [ ] Items with same price

#### 3.2 Category-Specific BOGO
- **Code:** `BOGOBRACELET`
- **Expected:** Free second bracelet (100% off cheapest bracelet)
- **Test Scenarios:**
  - [ ] Two bracelets in cart
  - [ ] One bracelet + other items (no discount)
  - [ ] Multiple bracelets (cheapest one free)

### 4. FREE ITEM PROMOTIONS

#### 4.1 Free Gift with Purchase
- **Code:** `FREEGIFT`
- **Expected:** Free Addidas shoes with orders over $300
- **Test Scenarios:**
  - [ ] Cart total $299 (should fail - below minimum)
  - [ ] Cart total $350 (should work - free item added)
  - [ ] Verify free item appears in cart/order
  - [ ] Free item should not count toward cart total

### 5. ERROR HANDLING & EDGE CASES

#### 5.1 Expired Promotions
- **Code:** `EXPIRED50`
- **Expected:** Error - "Invalid or expired coupon code"
- **Test Scenarios:**
  - [ ] Attempt to use expired code
  - [ ] Verify proper error message
  - [ ] No discount applied

#### 5.2 Inactive Promotions
- **Code:** `INACTIVE40`
- **Expected:** Error - "Invalid or expired coupon code"
- **Test Scenarios:**
  - [ ] Attempt to use inactive code
  - [ ] Verify proper error message

#### 5.3 Usage Limit Testing
- **Code:** `LIMITED2`
- **Expected:** Only 2 total uses allowed
- **Test Scenarios:**
  - [ ] First use (should work)
  - [ ] Second use (should work)
  - [ ] Third use (should fail - usage limit reached)
  - [ ] Different users trying after limit reached

#### 5.4 High Minimum Order
- **Code:** `HIGHMIN15`
- **Expected:** Requires $1000 minimum order
- **Test Scenarios:**
  - [ ] Cart total $999 (should fail)
  - [ ] Cart total $1000 (should work)
  - [ ] Proper error message for insufficient minimum

#### 5.5 Invalid Codes
- **Test Scenarios:**
  - [ ] Non-existent code: `INVALID123`
  - [ ] Empty code: ``
  - [ ] Special characters: `@#$%`
  - [ ] Very long code: `VERYLONGCOUPONCODETHATDOESNOTEXIST`

### 6. SEASONAL & TIME-BASED PROMOTIONS

#### 6.1 Holiday Promotion
- **Code:** `HOLIDAY35`
- **Expected:** 35% off during holiday period
- **Test Scenarios:**
  - [ ] Use during active period
  - [ ] Verify date range restrictions

#### 6.2 Flash Sale
- **Code:** `FLASH45`
- **Expected:** 45% off for 48 hours only
- **Test Scenarios:**
  - [ ] Use during flash sale period
  - [ ] Attempt use after expiration

### 7. USER EXPERIENCE TESTING

#### 7.1 Multiple Coupon Application
- **Test Scenarios:**
  - [ ] Apply first valid coupon
  - [ ] Attempt to apply second coupon (should work up to limit)
  - [ ] Attempt to apply same coupon twice (should fail)
  - [ ] Remove applied coupon
  - [ ] Apply different coupon after removal

#### 7.2 Authentication Flow
- **Test Scenarios:**
  - [ ] Guest user tries auth-required coupon
  - [ ] Sign-in prompt appears
  - [ ] After sign-in, coupon applies automatically
  - [ ] One-time use tracking across guest→user transition

#### 7.3 Cart Modifications
- **Test Scenarios:**
  - [ ] Apply coupon, then add items to cart
  - [ ] Apply coupon, then remove items from cart
  - [ ] Apply coupon, then modify quantities
  - [ ] Coupon becomes invalid after cart changes (e.g., below minimum)

### 8. MOBILE RESPONSIVENESS

#### 8.1 Mobile Interface
- **Test Scenarios:**
  - [ ] Coupon input field works on mobile
  - [ ] Applied coupons display correctly
  - [ ] Remove coupon button accessible (fixed in recent update)
  - [ ] Error messages readable on small screens
  - [ ] Success messages display properly

### 9. PERFORMANCE TESTING

#### 9.1 Load Testing
- **Test Scenarios:**
  - [ ] Apply multiple coupons quickly
  - [ ] Large cart with many items
  - [ ] Complex category-specific promotions
  - [ ] Database performance with many promotion records

### 10. INTEGRATION TESTING

#### 10.1 Checkout Integration
- **Test Scenarios:**
  - [ ] Applied coupons carry through to checkout
  - [ ] Discount amounts calculated correctly in order total
  - [ ] Promotion usage recorded after successful order
  - [ ] Free items added to order properly

#### 10.2 Order History
- **Test Scenarios:**
  - [ ] Promotion details saved in order record
  - [ ] Discount amounts tracked correctly
  - [ ] Usage limits updated after order completion

---

## 🧪 Testing Workflow

### Pre-Testing Setup
1. **Database State:** Ensure test promotions are created
2. **User Accounts:** Have both guest and authenticated user sessions ready
3. **Cart Items:** Add various products to cart for testing
4. **Browser Tools:** Open developer console to monitor API calls

### Testing Process
1. **Start with Basic Cases:** Test simple percentage and fixed discounts first
2. **Progress to Complex:** Move to BOGO, free items, and category-specific
3. **Test Edge Cases:** Try error conditions and boundary values
4. **Verify UI/UX:** Ensure all messages and states display correctly
5. **Check Data Persistence:** Verify promotions are recorded in database

### Post-Testing Cleanup
1. **Reset Usage Counts:** Clear test promotion usage if needed
2. **Document Issues:** Record any bugs or unexpected behavior
3. **Performance Notes:** Note any slow operations or UI issues

---

## 📊 Expected Results Summary

| Test Category | Total Tests | Critical Tests |
|---------------|-------------|----------------|
| Percentage Discounts | 12 | 8 |
| Fixed Amount Discounts | 9 | 6 |
| BOGO Promotions | 8 | 5 |
| Free Item Promotions | 4 | 3 |
| Error Handling | 15 | 10 |
| Seasonal Promotions | 4 | 2 |
| UX Testing | 12 | 8 |
| Mobile Testing | 5 | 4 |
| Performance Testing | 4 | 2 |
| Integration Testing | 6 | 5 |
| **TOTAL** | **79** | **53** |

---

## 🚨 Critical Issues to Watch For

1. **Security:** Ensure users can't bypass authentication requirements
2. **Data Integrity:** Verify usage limits and one-time use restrictions
3. **Financial Accuracy:** Confirm discount calculations are precise
4. **Performance:** Watch for slow API responses with complex promotions
5. **User Experience:** Ensure error messages are helpful and clear

---

## 📝 Test Execution Log

Use this section to track your testing progress:

```
[ ] Basic percentage discounts working
[ ] Fixed amount discounts working  
[ ] BOGO promotions working
[ ] Free item promotions working
[ ] Error handling working
[ ] Authentication flow working
[ ] Mobile interface working
[ ] Performance acceptable
[ ] Integration with checkout working
[ ] All critical tests passing
```

**Testing Date:** ___________  
**Tester:** ___________  
**Environment:** ___________  
**Issues Found:** ___________ 

---

## 🆕 Clearing Promotions After Order/Cart Emptied
- [ ] After a successful order or when the cart is emptied, all applied promotions are cleared from the cart and local storage.
- [ ] Promo codes must be re-entered for each new cart/session.
- [ ] No promo code is auto-applied to a new cart.