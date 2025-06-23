# Checkout Flow Testing with Discount Logs

## Overview
This guide explains how to test the checkout flow with discounts and what logs to look for in the browser console.

## Log Categories

### 🛒 Cart Logs
**Prefix**: `🛒 [CART]`
- **Promotion Application**: When a discount code is applied
- **Promotion Removal**: When a discount is removed
- **State Updates**: After promotion changes

### 🚚 Shipping Logs  
**Prefix**: `🚚 [SHIPPING]`
- **Form Submission**: When shipping form is submitted
- **Data Saving**: When checkout data is saved to localStorage
- **LASCO vs GLOBAL**: Different flows for different markets

### ✅ Confirmation Logs
**Prefix**: `✅ [CONFIRMATION]`
- **Data Loading**: When confirmation page loads
- **Promotion Preservation**: When promotions are preserved from localStorage
- **Order Creation**: When orders are created with promotions

### 🎯 Promotion Tracking Logs
**Prefix**: `🎯 [CONFIRMATION]`
- **Hook State**: useCartPromotions hook state
- **Order Creation**: Detailed promotion data during order creation

## Testing Steps

### 1. Start with Cart
1. Go to `/cart` or `/cart-demo`
2. Apply a promotion code (e.g., `WELCOME10`)
3. **Look for these logs:**
   ```
   🛒 [CART] Applying promotion: {
     promotionId: "...",
     couponCode: "WELCOME10",
     discount: 10.00,
     cartId: "...",
     currentPromotionsCount: 0,
     timestamp: "..."
   }
   
   🛒 [CART] Promotion applied - Updated state: {
     totalPromotions: 1,
     totalDiscount: 10.00,
     cartTotal: 100.00,
     finalTotal: 90.00
   }
   ```

### 2. Proceed to Shipping
1. Click "Proceed to Checkout" or go to `/shipping`
2. Fill out the shipping form
3. **Look for these logs:**
   ```
   🎯 [SHIPPING] Promotions state: {
     cartId: "...",
     appliedPromotionsCount: 1,
     appliedPromotions: [...],
     totalDiscount: 10.00,
     ...
   }
   ```

### 3. Submit Shipping Form
1. Submit the shipping form
2. **Look for these logs:**
   ```
   🚚 [SHIPPING] Form submission started: {
     cartId: "...",
     appliedPromotionsCount: 1,
     appliedPromotions: [...],
     totalDiscount: 10.00,
     orderSummary: {...},
     market: "GLOBAL" or "LASCO"
   }
   
   🚚 [SHIPPING] Saving checkout data to localStorage: {
     appliedPromotionsCount: 1,
     appliedPromotions: [...],
     discount: 10.00,
     total: 107.00,
     pendingCreation: true
   }
   
   🚚 [SHIPPING] Data saved to localStorage successfully
   🚚 [SHIPPING] Redirecting to confirmation page
   ```

### 4. Confirmation Page Load
1. The confirmation page should load automatically
2. **Look for these logs:**
   ```
   ✅ [CONFIRMATION] Starting data load: {
     urlOrderId: null,
     hasCheckoutDataInStorage: true,
     hasCartIdInStorage: true,
     market: "GLOBAL"
   }
   
   ✅ [CONFIRMATION] Retrieved localStorage data: {
     hasCheckoutData: true,
     hasCartId: true,
     checkoutDataLength: 1234
   }
   
   ✅ [CONFIRMATION] Parsed checkout data: {
     cartId: "...",
     appliedPromotionsCount: 1,
     appliedPromotions: [...],
     discount: 10.00,
     total: 107.00,
     pendingCreation: true
   }
   ```

### 5. Promotion Hook State
1. **Look for these logs:**
   ```
   🎯 [CONFIRMATION] Promotions state: {
     cartId: "...",
     appliedPromotionsCount: 1,
     appliedPromotions: [...],
     totalDiscount: 10.00,
     checkoutDataPromotions: [...],
     checkoutDataDiscount: 10.00,
     promotionsPreserved: true
   }
   ```

### 6. Order Creation (if applicable)
1. If creating a new order, **look for these logs:**
   ```
   🎯 handleCreateOrder - Applied promotions data: {
     appliedPromotionsCount: 1,
     appliedPromotions: [...],
     firstAppliedPromotion: {...},
     promotionDiscount: 10.00,
     checkoutDataDiscount: 10.00,
     calculatedDiscount: 10.00,
     orderDataWillInclude: {
       discount: 10.00,
       appliedPromotion: {...}
     }
   }
   ```

## What to Verify

### ✅ Success Indicators
- [ ] Cart shows applied promotion
- [ ] Shipping page shows discount in order summary
- [ ] Confirmation page shows discount in order summary
- [ ] All logs show consistent promotion data
- [ ] `appliedPromotionsCount` remains consistent
- [ ] `discount` amount remains consistent
- [ ] `totalDiscount` calculations are correct

### ❌ Failure Indicators
- [ ] Promotion disappears between pages
- [ ] `appliedPromotionsCount` becomes 0
- [ ] `discount` becomes 0 or undefined
- [ ] Order total doesn't reflect discount
- [ ] Missing promotion data in localStorage
- [ ] Console errors about missing promotion data

## Common Issues to Watch For

### 1. Cart ID Mismatch
```javascript
// Bad - different cart IDs
🛒 [CART] cartId: "cart-123"
🚚 [SHIPPING] cartId: "cart-456"  // ❌ Different!
```

### 2. Missing Promotion Data
```javascript
// Bad - promotions lost
🚚 [SHIPPING] appliedPromotionsCount: 1
✅ [CONFIRMATION] appliedPromotionsCount: 0  // ❌ Lost!
```

### 3. Discount Calculation Errors
```javascript
// Bad - discount not applied
🛒 [CART] totalDiscount: 10.00
✅ [CONFIRMATION] promotionDiscount: 0  // ❌ Lost!
```

## Test Scenarios

### Scenario 1: Guest User with WELCOME10
1. Go to `/cart-demo`
2. Apply `WELCOME10` code
3. Proceed through checkout as guest
4. Verify discount persists

### Scenario 2: Authenticated User with Multiple Promotions
1. Sign in
2. Apply multiple promotion codes
3. Proceed through checkout
4. Verify all promotions persist

### Scenario 3: LASCO Market Flow
1. Set market to LASCO
2. Apply promotion
3. Complete checkout (order created immediately)
4. Verify promotion data preserved

### Scenario 4: GLOBAL Market Flow
1. Set market to GLOBAL
2. Apply promotion
3. Complete checkout (order created on confirmation)
4. Verify promotion data preserved

## Browser Console Commands

### Check localStorage Data
```javascript
// Check cart promotions
console.log('Cart Promotions:', JSON.parse(localStorage.getItem('cart-promotions-by-cart') || '{}'));

// Check checkout data
console.log('Checkout Data:', JSON.parse(localStorage.getItem('checkoutData') || '{}'));

// Check cart ID
console.log('Cart ID:', localStorage.getItem('cartId'));
```

### Clear Test Data
```javascript
// Clear all test data
localStorage.removeItem('cart-promotions-by-cart');
localStorage.removeItem('checkoutData');
localStorage.removeItem('cartId');
localStorage.removeItem('lascoPayOrderId');
console.log('Test data cleared');
```

## Quick Test Page

Visit `/test-promotion-persistence` for a quick test environment with:
- Add test promotions
- Simulate checkout flow
- View localStorage data
- Clear test data

## Expected Log Flow Summary

```
🛒 [CART] Applying promotion → 
🛒 [CART] Promotion applied → 
🚚 [SHIPPING] Form submission started → 
🚚 [SHIPPING] Saving checkout data → 
🚚 [SHIPPING] Redirecting to confirmation → 
✅ [CONFIRMATION] Starting data load → 
✅ [CONFIRMATION] Parsed checkout data → 
🎯 [CONFIRMATION] Promotions state → 
✅ [CONFIRMATION] Updated checkout data with preserved promotions → 
🎯 handleCreateOrder - Applied promotions data (if creating order)
```

This log flow should show consistent promotion data throughout the entire checkout process. 