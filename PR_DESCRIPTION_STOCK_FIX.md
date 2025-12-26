# Fix: Double Stock Reduction Bug & Authentication Issues

## 🐛 Problems

### 1. Double Stock Reduction Bug
Inventory quantities were being reduced by **2x the ordered amount** after PayPal payment completion. This was causing incorrect stock levels and potential overselling issues.

### 2. Authentication & Authorization Issues
- Admin page not redirecting unauthenticated users on Vercel deployment
- User role was `undefined` in NextAuth v5 middleware for admin users
- Decimal serialization error when accessing admin users page (`discountAmount` field)

## 🔍 Root Cause Analysis
The issue was caused by **duplicate stock reduction logic** in the PayPal payment flow:

1. **Direct Prisma Decrement** (lines 622-634 in `lib/actions/order.actions.ts`):
   - Stock was being decremented directly using Prisma's `decrement` operation within the payment transaction

2. **reduceActualStock() Call** (line 648 in `lib/actions/order.actions.ts`):
   - The same stock was being reduced again via the `reduceActualStock()` function

3. **Webhook Handler** (`app/api/webhook/paypal/route.ts`):
   - The PayPal webhook was also reducing stock, potentially causing a third reduction

## ✅ Solution

### PayPal Payment Flow
1. **Removed duplicate direct Prisma decrement** from `approvePayPalOrder` function
2. **Added payment status check** in PayPal webhook handler to skip stock reduction if payment was already processed
3. **Centralized stock reduction** to use only `reduceActualStock()` function which properly handles both `quantity` and `reservedStock`

### Stripe Payment Flow
1. **Added same protection** to Stripe webhook handlers for both `checkout.session.completed` and `charge.succeeded` events
2. **Implemented payment status validation** before reducing stock to prevent duplicates

### TypeScript Fixes
- Fixed scope issues with `stockResult` variable in webhook handlers
- Declared variables with proper typing outside conditional blocks

### Authentication & Authorization Fixes
- Fixed admin page redirection by adding proper middleware matcher configuration
- Implemented workaround for NextAuth v5 middleware limitation where custom fields (role) aren't available in middleware auth object
- Added comprehensive logging to debug auth object structure and role access
- Enhanced middleware to allow authenticated users through and rely on server-side check in `app/admin/layout.tsx` for definitive role verification
- Fixed Decimal serialization error by converting `discountAmount` to string in user actions

## 📝 Changes Made

### Files Modified
- `lib/actions/order.actions.ts`
  - Removed duplicate stock decrement logic (lines 622-634)
  - Added comment explaining stock reduction is handled by `reduceActualStock()`

- `app/api/webhook/paypal/route.ts`
  - Added payment status check before stock reduction
  - Added proper variable scoping for `stockResult`
  - Enhanced logging for stock reduction operations

- `app/api/webhook/stripe/route.ts`
  - Added payment status check in both event handlers
  - Added proper variable scoping for `stockResult`
  - Enhanced logging for stock reduction operations

- `middleware.ts`
  - Added matcher configuration for NextAuth middleware

- `auth.config.ts`
  - Enhanced admin path protection with role checking
  - Added comprehensive logging for debugging
  - Implemented workaround for NextAuth v5 middleware limitations

- `auth.ts`
  - Added logging in JWT and session callbacks
  - Explicitly set token properties (sub, name, email, role)

- `lib/actions/user.actions.ts`
  - Fixed Decimal serialization for `discountAmount` field

## 🧪 Testing Recommendations
1. **PayPal Payment Test**:
   - Complete a PayPal purchase
   - Verify stock is reduced by exactly the ordered quantity (not 2x)
   - Check webhook logs to confirm stock reduction happens only once

2. **Stripe Payment Test**:
   - Complete a Stripe checkout
   - Verify stock is reduced by exactly the ordered quantity
   - Check webhook logs to confirm proper handling

3. **Edge Cases**:
   - Test with webhook arriving before frontend processing
   - Test with webhook arriving after frontend processing
   - Test with duplicate webhook events

## 🎯 Impact
- ✅ **Critical Fix**: Prevents inventory from being incorrectly reduced
- ✅ **Improved Reliability**: Handles race conditions and duplicate events
- ✅ **Better Observability**: Enhanced logging for debugging

## 📋 Checklist
- [x] Fixed double stock reduction in PayPal payments
- [x] Added protection to Stripe payments
- [x] Fixed TypeScript compilation errors
- [x] Enhanced logging for stock operations
- [x] Fixed admin page redirection on Vercel
- [x] Fixed user role undefined issue in middleware
- [x] Fixed Decimal serialization error in admin users page
- [x] Updated CHANGELOG.md
- [x] Build passes successfully

## 🔗 Related Issues
- Fixes inventory quantity being reduced by 2x after PayPal purchase
- Prevents potential overselling due to incorrect stock levels
- Fixes admin dashboard access issues on Vercel
- Resolves "Decimal objects are not supported" error in admin users page

