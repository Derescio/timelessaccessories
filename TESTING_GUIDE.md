# Testing Guide for Product and Category Management

## Prerequisites
- Ensure the development server is running (`npm run dev`)
- Ensure you're logged in with admin privileges
- Database has been migrated with latest schema changes

## 1. Category Management Testing

### 1.1 Create a Category Hierarchy
1. Navigate to `/admin/categories`
2. Create the following root-level categories:
   - "Jewelry" (slug: "jewelry")
   - "Watches" (slug: "watches")
   - "Accessories" (slug: "accessories")

3. Create subcategories for Jewelry:
   - "Necklaces" (parent: Jewelry)
   - "Rings" (parent: Jewelry)
   - "Bracelets" (parent: Jewelry)

4. Create subcategories for Watches:
   - "Luxury Watches" (parent: Watches)
   - "Smart Watches" (parent: Watches)

5. Create subcategories for Accessories:
   - "Bags" (parent: Accessories)
   - "Wallets" (parent: Accessories)

### 1.2 Test Category Validation
- Try creating a category with an existing slug
- Try updating a category to have itself as a parent
- Try updating a category to have one of its descendants as a parent

### 1.3 Test Category Images
- Upload images to several categories
- Verify images display correctly in the category list
- Verify images upload to the correct storage location

## 2. Product Management Testing

### 2.1 Create Basic Products
Create the following products (with basic info first, inventory later):

1. **Gold Pendant Necklace**
   - Category: Necklaces
   - Slug: "gold-pendant-necklace"
   - Description: "Elegant gold pendant necklace with diamond accent"
   - Set status to Active

2. **Silver Ring**
   - Category: Rings
   - Slug: "silver-ring"
   - Description: "Sterling silver ring with elegant design"
   - Set status to Active

3. **Luxury Watch**
   - Category: Luxury Watches
   - Slug: "luxury-watch"
   - Description: "Premium luxury watch with Swiss movement"
   - Set status to Active

4. **Crossbody Bag**
   - Category: Bags
   - Slug: "crossbody-bag"
   - Description: "Stylish crossbody bag for everyday use"
   - Set status to Inactive (to test status filtering)

### 2.2 Add Inventory to Products

For each product created, add inventory:

1. **Gold Pendant Necklace**
   - SKU: JEW-NEC-001
   - Cost Price: 150.00
   - Retail Price: 299.99
   - Compare-at Price: 349.99
   - Discount: Enable discount
   - Quantity: 25
   - Set as Default: Yes

2. **Silver Ring**
   - SKU: JEW-RNG-001
   - Cost Price: 75.00
   - Retail Price: 149.99
   - Quantity: 50
   - Set as Default: Yes

3. **Luxury Watch**
   - First Inventory:
     - SKU: WAT-LUX-001
     - Cost Price: 700.00
     - Retail Price: 1299.99
     - Quantity: 10
     - Set as Default: Yes
   
   - Second Inventory (to test multiple inventory items):
     - SKU: WAT-LUX-002
     - Cost Price: 800.00
     - Retail Price: 1499.99
     - Quantity: 5
     - Set as Default: No

4. **Crossbody Bag**
   - SKU: ACC-BAG-001
   - Cost Price: 40.00
   - Retail Price: 89.99
   - Compare-at Price: 119.99
   - Discount: Enable discount
   - Quantity: 0 (to test out-of-stock indicator)
   - Set as Default: Yes

### 2.3 Test Product Listing and Filtering
1. Navigate to `/admin/products`
2. Verify all products appear in the list
3. Check that price and stock are displayed correctly
4. Verify that the "Inactive" badge appears on the Crossbody Bag
5. Verify that the "Out of Stock" badge appears on the Crossbody Bag

### 2.4 Test Product Editing
1. Edit the "Gold Pendant Necklace" product:
   - Change description
   - Update retail price to 329.99
   - Verify changes are saved correctly

2. Edit the "Luxury Watch" default inventory:
   - Decrease stock to 8
   - Verify inventory count updates

### 2.5 Test Inventory Management
1. Add another inventory item to "Silver Ring":
   - SKU: JEW-RNG-002
   - Cost Price: 85.00
   - Retail Price: 199.99
   - Quantity: 15
   - Set as Default: No

2. Edit the existing inventory of "Crossbody Bag":
   - Update quantity from 0 to 10
   - Verify "Out of Stock" badge is removed

3. Test deleting an inventory item:
   - Try to delete the only inventory item of "Silver Ring" (should be prevented)
   - Delete the non-default inventory item of "Luxury Watch" (should succeed)

### 2.6 Test Product Deletion
1. Delete the "Crossbody Bag" product
2. Verify it's removed from the product listing
3. Verify its inventories are also deleted (cascade deletion)

## 3. Frontend Testing

### 3.1 Test Category Display
1. Navigate to the main storefront
2. Verify the category hierarchy is displayed correctly
3. Click on categories and verify they show the correct products

### 3.2 Test Featured Products
1. Set "Gold Pendant Necklace" and "Luxury Watch" as featured products
   - Edit each product and set `{ "featured": true }` in the metadata field
2. Navigate to the homepage
3. Verify the featured products are displayed

### 3.3 Test Product Detail Pages
1. Click on "Gold Pendant Necklace" from the product listing
2. Verify all product details are displayed correctly:
   - Name, description, price
   - Discount indicators
   - Category information
   - Stock status

## 4. Bug Testing

### 4.1 Edge Cases
- Try to set invalid values for inventory (negative stock, prices)
- Try to create products with very long names/descriptions
- Test with empty fields where possible

### 4.2 Decimal Handling
- Create a product with a price that has more than 2 decimal places
- Verify the price is correctly rounded/displayed

### 4.3 Concurrency Issues
- Try updating the same product from two different browser windows
- Verify that no data corruption occurs

## 5. Fix Verification

### 5.1 Check Dynamic Params Warning
- Navigate between product pages and verify the fix for the dynamic params warning:
  ```
  Route "/admin/products/[id]" used `params.id`. `params` should be awaited before using its properties.
  ```
- Confirm the warning no longer appears in the console

## Test Results

| Test | Status | Notes |
|------|--------|-------|
| Create Category Hierarchy | | |
| Category Validation | | |
| Category Images | | |
| Create Basic Products | | |
| Add Inventory | | |
| Product Listing/Filtering | | |
| Product Editing | | |
| Inventory Management | | |
| Product Deletion | | |
| Category Display | | |
| Featured Products | | |
| Product Detail Pages | | |
| Edge Cases | | |
| Decimal Handling | | |
| Concurrency Issues | | |
| Dynamic Params Fix | | | 