# Changelog

All notable changes to this project will be documented in this file.

## [1.4.1] - 2025-12-26

### Fixed
- **Double Stock Reduction Bug (PayPal)** - Fixed critical issue where inventory quantity was being reduced twice after PayPal payment completion
  - Removed duplicate direct Prisma decrement in `approvePayPalOrder` function
  - Added payment status check in PayPal webhook to prevent double stock reduction
  - Stock reduction now handled exclusively by `reduceActualStock()` function which properly manages both `quantity` and `reservedStock`
- **Double Stock Reduction Protection (Stripe)** - Added safeguards to prevent duplicate stock reduction in Stripe webhook handlers
  - Added payment status check before stock reduction in both `checkout.session.completed` and `charge.succeeded` event handlers
  - Webhook now skips stock reduction if payment was already processed by frontend
- **TypeScript Compilation Errors** - Fixed scope issues with `stockResult` variable in webhook handlers
  - Declared `stockResult` with proper typing outside conditional blocks
  - Updated return statements to safely handle both processed and unprocessed payment scenarios
- **Authentication & Authorization Issues** - Fixed multiple auth-related issues affecting admin dashboard access
  - **Admin Page Redirection**: Fixed admin page not redirecting unauthenticated users on Vercel deployment by adding proper middleware matcher configuration
  - **User Role in Middleware**: Implemented workaround for NextAuth v5 middleware limitation where custom fields (role) aren't available in middleware auth object
    - Added comprehensive logging to debug auth object structure
    - Enhanced middleware to allow authenticated users through and rely on server-side check in `app/admin/layout.tsx` for definitive role verification
  - **Decimal Serialization Error**: Fixed "Only plain objects can be passed to Client Components. Decimal objects are not supported" error when accessing admin users page
    - Added `discountAmount` field serialization in `getUsers` and `getUserById` functions in `lib/actions/user.actions.ts`

### Technical Details
- Modified `lib/actions/order.actions.ts` to remove duplicate stock decrement logic
- Enhanced `app/api/webhook/paypal/route.ts` with payment status validation
- Enhanced `app/api/webhook/stripe/route.ts` with payment status validation for both event types
- All stock reductions now go through centralized `reduceActualStock()` function ensuring consistent behavior
- Enhanced `middleware.ts` with proper NextAuth matcher configuration
- Updated `auth.config.ts` with comprehensive admin role checking and logging
- Enhanced `auth.ts` JWT and session callbacks with explicit role setting and logging
- Fixed Decimal serialization in `lib/actions/user.actions.ts` for `discountAmount` field

### Impact
- **Critical Fix**: Prevents inventory from being incorrectly reduced by 2x the ordered quantity
- **Improved Reliability**: Webhook handlers now handle race conditions and duplicate events gracefully
- **Better Logging**: Added comprehensive logging to track stock reduction operations

---

## [1.4.0] - 2025-01-25

### Added - Promotions System
- **Complete Promotions Management System** - Comprehensive discount and coupon management
- **Multiple Promotion Types**:
  - Percentage Discount (e.g., "20% off")
  - Fixed Amount Discount (e.g., "$10 off")
  - Free Item (gift with purchase)
  - Buy One Get One Free (BOGO)
- **Flexible Product Targeting**:
  - Apply to all products (default)
  - Target specific categories
  - Target individual products
  - Combined category and product targeting
- **Advanced Features**:
  - Coupon code generation and validation
  - Usage limits and tracking
  - Scheduled promotions (start/end dates)
  - Active/inactive status management
  - Minimum order value requirements
- **Admin Interface**:
  - Tabbed form interface (Basic Info, Rules & Conditions, Product Targeting)
  - Promotions list with filtering (All, Active, Scheduled, Expired, Inactive)
  - Search functionality (name, description, coupon code)
  - Status badges with color coding
  - Usage statistics display
  - Edit and delete functionality
- **Technical Implementation**:
  - Server actions for CRUD operations (`lib/actions/promotions-actions.ts`)
  - Decimal field serialization for client-server compatibility
  - Form validation and error handling
  - Database schema with Prisma models
  - API integration with categories and products
- **Documentation**:
  - Technical documentation (`docs/PROMOTIONS_SYSTEM.md`)
  - User guide for administrators (`docs/PROMOTIONS_USER_GUIDE.md`)
  - Updated README with promotions information

### Fixed
- **Decimal Serialization Issue** - Resolved "Only plain objects can be passed to Client Components" error
- **Edit Form Population** - Fixed missing form fields in promotion edit page
- **API Response Handling** - Corrected categories and products API response parsing

### Technical Details
- Added `Promotion` and `PromotionUsage` Prisma models
- Implemented comprehensive validation for promotion data
- Added admin access control for all promotion operations
- Created responsive UI components with Shadcn UI
- Integrated with existing categories and products systems
- Added usage tracking and statistics calculation

---

## Previous Versions

[Previous changelog entries would go here...] 