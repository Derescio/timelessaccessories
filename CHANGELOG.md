# Changelog

All notable changes to this project will be documented in this file.

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