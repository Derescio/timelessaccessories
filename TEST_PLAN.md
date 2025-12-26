# Security Audit & Authentication Fixes - Test Plan

## Overview
This test plan covers all changes made during the security audit and authentication fixes, including:
- Authentication helper functions
- API route security hardening
- Middleware authentication fixes
- File upload security
- Payment route validation
- Decimal serialization fixes

---

## 1. Authentication & Authorization Tests

### 1.1 Admin Route Access
**Test Cases:**
- [ ] **TC-1.1.1**: Unauthenticated user tries to access `/admin`
  - **Expected**: Redirected to `/sign-in` with message
  - **Verify**: Check middleware logs show redirect

- [ ] **TC-1.1.2**: Authenticated regular user (role: USER) tries to access `/admin`
  - **Expected**: Redirected to `/sign-in` with "Admin access required" message
  - **Verify**: Server-side check in `app/admin/layout.tsx` blocks access

- [ ] **TC-1.1.3**: Authenticated admin user (role: ADMIN) accesses `/admin`
  - **Expected**: Successfully accesses admin dashboard
  - **Verify**: Dashboard loads without errors
  - **Verify**: All admin features are accessible

- [ ] **TC-1.1.4**: Admin user accesses `/admin/users`
  - **Expected**: Users page loads successfully
  - **Verify**: No Decimal serialization errors
  - **Verify**: User list displays correctly

- [ ] **TC-1.1.5**: Admin user accesses `/admin/users/[id]`
  - **Expected**: User detail page loads
  - **Verify**: Order data displays correctly (no Decimal errors)
  - **Verify**: `discountAmount` is properly serialized

### 1.2 Middleware Authentication
**Test Cases:**
- [ ] **TC-1.2.1**: Check middleware logs for admin route access
  - **Verify**: Logs show "Role not in middleware auth object, allowing through for server-side check"
  - **Verify**: Server-side check successfully validates ADMIN role

- [ ] **TC-1.2.2**: Session callback logs
  - **Verify**: JWT callback shows role "ADMIN" in token
  - **Verify**: Session callback shows role "ADMIN" in session

---

## 2. API Route Security Tests

### 2.1 Admin API Routes (Require Admin Authentication)
**Routes to Test:**
- `/api/admin/categories` (GET)
- `/api/admin/designs` (GET)
- `/api/admin/designs/upload` (POST)
- `/api/admin/debug-stock` (GET, POST)
- `/api/admin/printify/products` (GET)
- `/api/admin/printify/products/[id]` (DELETE, PATCH)
- `/api/admin/printify/test-connection` (POST)
- `/api/admin/printify/import-product` (POST)
- `/api/admin/printify/sync-product` (POST)
- `/api/admin/printify/settings` (GET, POST)
- `/api/admin/printify/catalog` (GET)
- `/api/admin/cleanup-stock` (POST)
- `/api/products/[id]` (PATCH)
- `/api/debug-paypal-webhook` (GET)
- `/api/debug-webhook-secret` (GET)
- `/api/test-db` (GET)

**Test Cases:**
- [ ] **TC-2.1.1**: Unauthenticated request to admin API route
  - **Expected**: Returns 401 Unauthorized
  - **Verify**: Error message: "Unauthorized"

- [ ] **TC-2.1.2**: Regular user (role: USER) requests admin API route
  - **Expected**: Returns 403 Forbidden
  - **Verify**: Error message: "Forbidden - Admin access required"

- [ ] **TC-2.1.3**: Admin user (role: ADMIN) requests admin API route
  - **Expected**: Returns 200 OK with data
  - **Verify**: Data is returned correctly

- [ ] **TC-2.1.4**: Verify database role check (not just session role)
  - **Expected**: Role is verified from database, not just session
  - **Verify**: `requireAdmin()` helper queries database

### 2.2 Payment Route Security
**Route:** `/api/payment/stripe` (POST)

**Test Cases:**
- [ ] **TC-2.2.1**: Valid payment intent creation (authenticated user)
  - **Expected**: Returns client secret
  - **Verify**: Order exists and amount matches

- [ ] **TC-2.2.2**: Valid payment intent creation (guest user)
  - **Expected**: Returns client secret
  - **Verify**: Guest checkout still works

- [ ] **TC-2.2.3**: Invalid order ID
  - **Expected**: Returns 404 Not Found
  - **Verify**: Error message: "Order not found"

- [ ] **TC-2.2.4**: Amount mismatch (amount doesn't match order total)
  - **Expected**: Returns 400 Bad Request
  - **Verify**: Error message: "Amount does not match order total"

- [ ] **TC-2.2.5**: Invalid amount (negative or zero)
  - **Expected**: Returns 400 Bad Request
  - **Verify**: Zod validation catches invalid input

- [ ] **TC-2.2.6**: Missing required fields
  - **Expected**: Returns 400 Bad Request
  - **Verify**: Validation error details returned

### 2.3 File Upload Security
**Route:** `/api/admin/designs/upload` (POST)

**Test Cases:**
- [ ] **TC-2.3.1**: Valid image upload (admin user)
  - **Expected**: File uploaded successfully
  - **Verify**: File saved with secure random filename
  - **Verify**: Filename doesn't contain path traversal characters

- [ ] **TC-2.3.2**: Non-image file upload attempt
  - **Expected**: Returns 400 Bad Request
  - **Verify**: Error message about invalid file type

- [ ] **TC-2.3.3**: File with fake MIME type (e.g., .exe renamed to .png)
  - **Expected**: Returns 400 Bad Request
  - **Verify**: Magic byte validation catches fake image

- [ ] **TC-2.3.4**: File too large (>5MB)
  - **Expected**: Returns 400 Bad Request
  - **Verify**: Error message about file size limit

- [ ] **TC-2.3.5**: Filename with path traversal attempt (e.g., `../../../etc/passwd`)
  - **Expected**: Path sanitized, file saved safely
  - **Verify**: `basename()` prevents directory traversal

- [ ] **TC-2.3.6**: Design name with dangerous characters
  - **Expected**: Name sanitized
  - **Verify**: Special characters removed from design name

### 2.4 Debug Endpoints Security
**Routes:**
- `/api/debug-paypal-webhook` (GET)
- `/api/debug-webhook-secret` (GET)
- `/api/test-db` (GET)

**Test Cases:**
- [ ] **TC-2.4.1**: Unauthenticated access to debug endpoint
  - **Expected**: Returns 401 Unauthorized

- [ ] **TC-2.4.2**: Regular user access to debug endpoint
  - **Expected**: Returns 403 Forbidden

- [ ] **TC-2.4.3**: Admin access to debug endpoint (production)
  - **Expected**: For webhook secret, no secret preview shown
  - **Verify**: Message: "Secret preview disabled in production for security"

- [ ] **TC-2.4.4**: Admin access to debug endpoint (development)
  - **Expected**: Debug data returned
  - **Verify**: Data is useful for debugging

---

## 3. Guest Shopping Flow Tests

### 3.1 Guest Checkout Flow
**Test Cases:**
- [ ] **TC-3.1.1**: Guest user browses products
  - **Expected**: Can view product listings
  - **Verify**: No authentication required

- [ ] **TC-3.1.2**: Guest user adds items to cart
  - **Expected**: Cart persists with session cookie
  - **Verify**: `sessionCartId` cookie is set

- [ ] **TC-3.1.3**: Guest user proceeds to checkout with `?guest=true`
  - **Expected**: Can access `/shipping`, `/payment-method`, `/place-order`
  - **Verify**: Middleware allows guest checkout paths

- [ ] **TC-3.1.4**: Guest user creates order
  - **Expected**: Order created successfully
  - **Verify**: Order has `guestEmail` but no `userId`

- [ ] **TC-3.1.5**: Guest user views order confirmation
  - **Expected**: Can access `/order-success` and `/order/[id]/stripe-payment-success`
  - **Verify**: Guest-allowed paths work

- [ ] **TC-3.1.6**: Guest user creates Stripe payment intent
  - **Expected**: Payment intent created successfully
  - **Verify**: Order validation works for guest orders

### 3.2 Authenticated Shopping Flow
**Test Cases:**
- [ ] **TC-3.2.1**: Authenticated user completes checkout
  - **Expected**: Normal checkout flow works
  - **Verify**: Order has `userId` set

- [ ] **TC-3.2.2**: Authenticated user views order history
  - **Expected**: Can access `/user/orders`
  - **Verify**: Protected paths require authentication

---

## 4. Data Serialization Tests

### 4.1 Decimal Field Serialization
**Test Cases:**
- [ ] **TC-4.1.1**: User list page loads without errors
  - **Expected**: No "Decimal objects are not supported" errors
  - **Verify**: All Decimal fields converted to strings

- [ ] **TC-4.1.2**: User detail page displays order data
  - **Expected**: Order totals, subtotals, taxes display correctly
  - **Verify**: `discountAmount` is serialized (not Decimal object)

- [ ] **TC-4.1.3**: Orders with discount amounts
  - **Expected**: Discount amounts display correctly
  - **Verify**: No serialization errors in console

---

## 5. Authentication Helper Functions Tests

### 5.1 Helper Function Behavior
**Test Cases:**
- [ ] **TC-5.1.1**: `requireAdmin()` with unauthenticated user
  - **Expected**: Returns 401 error response
  - **Verify**: Error message: "Unauthorized"

- [ ] **TC-5.1.2**: `requireAdmin()` with regular user
  - **Expected**: Returns 403 error response
  - **Verify**: Error message: "Forbidden - Admin access required"

- [ ] **TC-5.1.3**: `requireAdmin()` with admin user
  - **Expected**: Returns user object
  - **Verify**: User role verified from database (not just session)

- [ ] **TC-5.1.4**: `getAuthenticatedUser()` returns correct user data
  - **Expected**: User object with id, email, name, role
  - **Verify**: Data matches database record

---

## 6. Edge Cases & Error Handling

### 6.1 Error Handling
**Test Cases:**
- [ ] **TC-6.1.1**: API route with database error
  - **Expected**: Returns 500 with generic error message
  - **Verify**: No sensitive error details exposed

- [ ] **TC-6.1.2**: Invalid request body to API route
  - **Expected**: Returns 400 with validation errors
  - **Verify**: Zod validation errors are clear

- [ ] **TC-6.1.3**: Missing environment variables
  - **Expected**: Appropriate error handling
  - **Verify**: No crashes, graceful error messages

### 6.2 Session & Token Edge Cases
**Test Cases:**
- [ ] **TC-6.2.1**: Expired session access
  - **Expected**: Redirected to sign-in
  - **Verify**: Session expiration handled correctly

- [ ] **TC-6.2.2**: User role changed in database (session still has old role)
  - **Expected**: Database check catches role change
  - **Verify**: `requireAdmin()` queries database, not just session

---

## 7. Performance & Load Tests

### 7.1 Performance
**Test Cases:**
- [ ] **TC-7.1.1**: Multiple concurrent admin API requests
  - **Expected**: All requests handled correctly
  - **Verify**: No race conditions in authentication checks

- [ ] **TC-7.1.2**: Large file upload performance
  - **Expected**: 5MB file upload completes in reasonable time
  - **Verify**: File validation doesn't cause timeouts

---

## 8. Security Regression Tests

### 8.1 Previously Vulnerable Routes
**Test Cases:**
- [ ] **TC-8.1.1**: Product PATCH without authentication
  - **Expected**: Returns 401/403
  - **Verify**: No longer allows unauthenticated updates

- [ ] **TC-8.1.2**: Debug endpoints without authentication
  - **Expected**: Returns 401/403
  - **Verify**: Sensitive data no longer exposed

- [ ] **TC-8.1.3**: File upload with malicious filename
  - **Expected**: Filename sanitized
  - **Verify**: Path traversal prevented

---

## 9. Integration Tests

### 9.1 End-to-End Flows
**Test Cases:**
- [ ] **TC-9.1.1**: Complete admin workflow
  - **Steps**: Login as admin → Access dashboard → View users → View orders → Manage products
  - **Expected**: All steps work without errors

- [ ] **TC-9.1.2**: Complete guest checkout flow
  - **Steps**: Browse → Add to cart → Checkout → Payment → Confirmation
  - **Expected**: All steps work without authentication

- [ ] **TC-9.1.3**: User signs up after guest checkout
  - **Steps**: Guest checkout → Sign up → View order history
  - **Expected**: Can view previous guest orders by email match

---

## 10. Logging & Monitoring Tests

### 10.1 Log Verification
**Test Cases:**
- [ ] **TC-10.1.1**: Verify authentication logs are present
  - **Expected**: JWT callback logs show role
  - **Expected**: Session callback logs show role
  - **Expected**: Middleware logs show auth object structure

- [ ] **TC-10.1.2**: Verify security event logging
  - **Expected**: Failed authentication attempts logged
  - **Expected**: Admin access attempts logged

---

## Test Execution Checklist

### Pre-Test Setup
- [ ] Ensure test database is set up
- [ ] Create test users (admin, regular user)
- [ ] Create test products and orders
- [ ] Clear browser cookies/session
- [ ] Set up test environment variables

### Test Execution Order
1. Authentication & Authorization (Section 1)
2. API Route Security (Section 2)
3. Guest Shopping Flow (Section 3)
4. Data Serialization (Section 4)
5. Authentication Helpers (Section 5)
6. Edge Cases (Section 6)
7. Performance (Section 7)
8. Security Regression (Section 8)
9. Integration (Section 9)
10. Logging (Section 10)

### Post-Test Verification
- [ ] Review all console logs for errors
- [ ] Check database for any test data cleanup
- [ ] Verify no sensitive data in logs
- [ ] Confirm all security measures are active

---

## Known Issues & Workarounds

### Middleware Role Access
**Issue**: NextAuth v5 middleware doesn't include custom fields (like `role`) in the `auth` object.

**Workaround**: Middleware allows authenticated users through, and server-side checks verify the ADMIN role.

**Impact**: Low - Server-side checks provide the same security level.

**Test**: Verify server-side checks in `app/admin/layout.tsx` and `app/admin/page.tsx` are working.

---

## Success Criteria

All tests should pass with:
- ✅ No authentication bypasses
- ✅ No unauthorized access to admin routes
- ✅ Guest checkout flow works end-to-end
- ✅ No Decimal serialization errors
- ✅ All API routes properly secured
- ✅ File upload security measures working
- ✅ Payment validation working correctly
- ✅ No sensitive data exposure in errors/logs

---

## Notes

- Some tests may require manual verification (e.g., checking logs)
- Performance tests may need to be run in a staging environment
- Security regression tests should be run regularly
- Integration tests should cover the most common user flows



