# Development Lessons

## TypeScript and Prisma Integration

### Decimal to Number Conversion
When working with Prisma's Decimal type and Next.js, we encountered issues with serialization. Prisma's Decimal objects cannot be directly passed to client components. The solution was to convert all Decimal values to JavaScript numbers before returning them from server components or server actions.

```typescript
// Convert Decimal to Number in server actions
const products = productsData.map(product => ({
  ...product,
  inventories: product.inventories.map(inventory => ({
    ...inventory,
    retailPrice: Number(inventory.retailPrice)
  }))
}));
```

### Type Safety with Optional vs. Required Properties
We learned the importance of properly defining which properties are required vs. optional in TypeScript interfaces and Zod schemas. When we initially defined `productId` as optional in the inventory schema, we encountered type errors because Prisma expected it to be a required string.

Solution:
1. Made `productId` required in the Zod schema:
```typescript
productId: z.string({ required_error: "Product ID is required" }),
```

2. Added validation in server actions to ensure `productId` is defined:
```typescript
if (!data.productId) {
  return { success: false, error: "Product ID is required" };
}
```

## Next.js App Router Patterns

### Dynamic Route Parameters
We encountered a warning about synchronously accessing dynamic route parameters. Next.js recommends awaiting params before using them in async server components:

```typescript
// Warning occurs here
const { id } = params;

// Solution is to use the params directly in awaited calls
const [productResult, categoriesResult] = await Promise.all([
  getProductById(params.id),
  getCategories()
]);
```

### Form Management with Multiple Related Models
Managing forms for products and their related inventory items required careful design. We learned to:

1. Create separate forms and action functions for each model
2. Use tabs UI to separate product details from inventory management
3. Implement proper validations at both the client and server level
4. Handle relationships between models (e.g., setting a default inventory item)

## Database Design Insights

### Default Values and Relationships
For the ProductInventory model, we implemented a pattern to ensure one inventory item is always marked as default:

```typescript
// If it's set as default, unset any existing default
if (data.isDefault) {
  await db.productInventory.updateMany({
    where: { 
      productId: data.productId,
      isDefault: true 
    },
    data: { isDefault: false }
  });
}
```

### Cascade Deletion
We set up cascade deletion for inventory items when a product is deleted:
```prisma
model ProductInventory {
  // ...
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)
}
```

This ensures that when a product is deleted, all its associated inventory items are automatically deleted as well, preventing orphaned records.

## UI Component Design

### Form Organization
For complex forms like product management, we found it beneficial to:
1. Split related functionality into tabs (product details vs. inventory)
2. Use conditional rendering for optional fields (e.g., discount-related fields)
3. Provide clear validation feedback
4. Include auto-generation features (e.g., SKU generation, slug creation)

### Table Layouts for Data Management
We implemented tables with consistent action patterns:
1. View, Edit, and Delete actions
2. Confirmation dialogs for destructive operations

### Product Card Optimization
When implementing the product card component, we learned several important lessons about UI/UX:

1. **Mobile-First Design**
   - Implement responsive layouts using flexbox
   - Use appropriate spacing and sizing for mobile devices
   - Consider touch targets for mobile users

2. **Performance Considerations**
   - Use Next.js Image component for optimized image loading
   - Implement proper loading states
   - Handle image fallbacks gracefully

3. **Interactive Elements**
   - Add hover states for better user feedback
   - Implement smooth transitions for interactive elements
   - Use proper button states (loading, disabled, active)

4. **Layout Structure**
   - Keep important information visible at a glance
   - Use proper typography hierarchy
   - Maintain consistent spacing and alignment

Example implementation:
```typescript
<Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
    <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
            {/* Price information */}
        </div>
        <Button
            variant="outline"
            size="sm"
            className="group-hover:border-primary group-hover:text-primary transition-colors"
        >
            View More
        </Button>
    </div>
</Card>
```

### Wishlist Implementation
Implementing the wishlist feature taught us about:

1. **State Management**
   - Using server actions for data mutations
   - Implementing optimistic updates for better UX
   - Handling loading states during operations

2. **Error Handling**
   - Proper error messages for authentication requirements
   - Graceful fallbacks for failed operations
   - User-friendly error notifications

3. **Type Safety**
   - Ensuring proper type definitions for wishlist items
   - Handling null/undefined cases
   - Maintaining type consistency across components

Example:
```typescript
const handleWishlistToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const result = await toggleWishlist(id);
        if (result.success) {
            setIsInWishlist(result.isInWishlist);
            toast.success(result.isInWishlist ? "Added to wishlist" : "Removed from wishlist");
        }
    } finally {
        setIsLoading(false);
    }
};
```

## Featured Products Implementation
- **Database Consistency**: When implementing boolean flags like `isFeatured`, ensure consistency between database columns and metadata fields. We initially had a mismatch between the `isFeatured` column and `metadata.featured`, causing confusion in the UI.
- **Type Safety**: Always define proper TypeScript interfaces and Zod schemas for form data. This helps catch type-related issues early and provides better IDE support.
- **Backward Compatibility**: When updating database schemas, consider maintaining backward compatibility. In our case, we kept the `metadata.featured` field in sync with the new `isFeatured` column to support existing data.
- **Data Migration**: When adding new columns to existing tables, plan for data migration. We needed to update existing products to set the `isFeatured` flag correctly based on their metadata.

## Next Steps and Improvements

1. **Image Management**: Add proper image upload and management for products
2. **Variant Management**: Improve the UI for managing multiple inventory variants
3. **Batch Operations**: Add functionality for batch creating or updating products
4. **Advanced Filters**: Implement more advanced filtering and search capabilities
5. **Caching Strategy**: Implement more efficient data caching for product listings

## Order Management and Display

### Shipping Address Display
When working with JSON data in the database that needs to be displayed in the UI, we learned several important lessons:

1. **JSON String Handling**
   - Always check if the data is a string that needs parsing or an object that can be used directly
   - Use try-catch blocks when parsing JSON to handle malformed data gracefully
   - Format the data appropriately for display using string manipulation and proper styling

Example implementation:
```typescript
{typeof shippingAddress === 'string' ? (
    (() => {
        try {
            const parsedAddress = JSON.parse(shippingAddress);
            return Object.entries(parsedAddress)
                .filter(([, value]) => value)
                .map(([key, value]) => (
                    <p key={key} className="capitalize">
                        <span className="font-medium">
                            {key.replace(/([A-Z])/g, ' $1').trim()}:
                        </span> 
                        {String(value)}
                    </p>
                ));
        } catch (e) {
            return <p>{String(shippingAddress)}</p>;
        }
    })()
) : (
    // Handle object data directly
)}
```

### Prisma Query Structure
When working with Prisma queries that involve nested relations and selections:

1. **Include vs. Select**
   - Cannot use both `include` and `select` at the same level in a Prisma query
   - Use `include` when you need to fetch related data with its own selection criteria
   - Use `select` when you need to pick specific fields from the current model

2. **Nested Relations**
   - Structure queries to properly handle nested relations
   - Consider the performance implications of deeply nested includes
   - Use appropriate field selection to minimize data transfer

Example of proper query structure:
```typescript
const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
        items: {
            include: {
                product: {
                    select: {
                        id: true,
                        name: true,
                        // ... other fields
                    }
                },
                inventory: {
                    select: {
                        // ... inventory fields
                    }
                }
            }
        }
    }
});
``` 