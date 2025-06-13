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

### Server-to-Client Component Serialization
**Issue**: "Only plain objects can be passed to Client Components from Server Components. Decimal objects are not supported."

**Root Cause**: Prisma's `Decimal` type cannot be serialized when passing data from Server Components to Client Components in Next.js.

**Solution**: Convert all Decimal fields to numbers or strings in server actions before returning data:

```typescript
// ❌ This will cause serialization error
const order = await db.order.findUnique({
  where: { id },
  // ... includes
});
return order; // Contains Decimal fields

// ✅ Proper serialization
const order = await db.order.findUnique({
  where: { id },
  // ... includes
});

const serializedOrder = {
  ...order,
  subtotal: Number(order.subtotal),
  tax: Number(order.tax),
  shipping: Number(order.shipping),
  total: Number(order.total),
  discountAmount: order.discountAmount ? Number(order.discountAmount) : null,
  items: order.items.map(item => ({
    ...item,
    price: Number(item.price),
  })),
};
return serializedOrder;
```

**Key Lessons**:
1. **Always convert Decimal fields** in server actions that return data to client components
2. **Update TypeScript interfaces** to reflect serialized types (number instead of Decimal)
3. **Be systematic** - check all functions that return order data (getOrders, getOrderById, updateOrderStatus, etc.)
4. **Handle null values** properly when converting Decimals
5. **Test admin pages** specifically as they often display raw database data

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

## UI/UX Design Patterns

### Product Card Design
We learned several important lessons about designing effective product cards:

1. **Visual Hierarchy**
   - Price and product name should be most prominent
   - Secondary information (description, ratings) should be less prominent
   - Use consistent spacing and alignment for better readability

2. **Interactive Elements**
   - Implement smooth transitions and animations for better user feedback
   - Use hover states to indicate interactive elements
   - Keep call-to-action buttons clear and consistent

3. **Responsive Design**
   - Ensure cards look good at all screen sizes
   - Use proper image aspect ratios
   - Implement proper text truncation for long content

4. **Performance Considerations**
   - Optimize image loading with proper sizing
   - Use CSS transitions instead of JavaScript for animations
   - Implement proper lazy loading for images

### Component State Management
When working with interactive UI components, we learned to:

1. **Use State for Interactive Elements**
   ```typescript
   const [isHovered, setIsHovered] = useState(false);
   ```

2. **Implement Smooth Transitions**
   ```typescript
   className={cn(
     "object-cover transition-transform duration-500",
     isHovered ? "scale-105" : "scale-100"
   )}
   ```

3. **Handle Loading States**
   - Show loading skeletons for better UX
   - Implement proper error states
   - Use proper disabled states for buttons

### Accessibility Best Practices
We implemented several accessibility improvements:

1. **Proper ARIA Labels**
   - Added descriptive labels for interactive elements
   - Implemented proper focus management
   - Ensured keyboard navigation works correctly

2. **Color Contrast**
   - Maintained proper contrast ratios for text
   - Used semantic colors for different states
   - Implemented proper focus indicators

3. **Screen Reader Support**
   - Added proper alt text for images
   - Implemented proper heading hierarchy
   - Used semantic HTML elements

## Component Architecture

### Reusable Components
We learned to create more maintainable components by:

1. **Separating Concerns**
   - Split UI logic from business logic
   - Create reusable hooks for common functionality
   - Use composition over inheritance

2. **Props Design**
   - Keep props interface minimal and focused
   - Use TypeScript for better type safety
   - Document prop requirements clearly

3. **State Management**
   - Use local state for UI-specific state
   - Lift state up when needed
   - Implement proper state initialization 

## Data Mapping and Transformation

1. When displaying user-facing data from database records, always map technical identifiers to user-friendly display names.
   - Implement proper joins in database queries to retrieve display name information
   - Create mapping functions to transform internal IDs to user-friendly names
   - Use display names consistently across the application UI
   - Example: Transforming product attribute IDs to readable names in order details

2. Handling complex object serialization requires careful planning:
   - JSON serialization strips methods and complex types
   - Circular references must be handled before serialization
   - Date objects need explicit conversion to ISO strings
   - BigInt and Decimal types need conversion to strings or numbers
   - Map data structures to plain objects before serialization
   - Always create explicit serialization functions for complex objects

3. Multi-step data transformations should be properly logged for debugging:
   - Add console logs at key transformation steps
   - Log input and output of critical mapping functions
   - Use structured logging with contextual information
   - Include identifiers in logs to trace specific records
   - Remove sensitive information before logging

## Order Management Lessons

6. Order item attributes display:
   - Store both internal attribute IDs and display names for order items
   - Query ProductTypeAttribute records to map attribute IDs to display names
   - Use meaningful labels like "Specifications" instead of technical terms
   - Present attribute information in a structured, easy-to-read format
   - Maintain a clear visual hierarchy for order details
   - Implement proper data transformation pipeline from database to UI 

## Promotion Usage Best Practices

- Always set a per-user limit (`perUserLimit`) for promotions to prevent abuse.
- Require guests to enter an email to use promo codes. Track usage by email.
- After an order is placed or the cart is emptied, clear all applied promotions from the cart and local storage.
- Never auto-apply promo codes to new carts. Users must manually enter codes for each new cart/session.
- Filter out promo codes in the cart UI if the user/email has reached their usage limit. 

# Lessons Learned

## Database & ORM Issues

### Foreign Key Constraints with Guest Users
**Issue**: Using string literals like `'guest'` as foreign key values causes constraint violations.
**Lesson**: Always create proper database records for guest users rather than using placeholder strings.
**Solution**: Create/find user records for guest emails and use actual user IDs.

### Interface Completeness
**Issue**: Missing fields in TypeScript interfaces can cause silent failures where data isn't saved.
**Lesson**: Always ensure interfaces match the complete database schema, especially for optional fields.
**Solution**: Regular audits of interfaces against Prisma schema to catch missing fields.

## Order Processing & Promotion Tracking

### Order Creation Data Flow
**Issue**: Promotion data not being passed through the entire order creation pipeline.
**Lesson**: Complex data flows require validation at each step to ensure data integrity.
**Solution**: Add comprehensive logging and validation at each stage of the process.

### Webhook Reliability
**Issue**: Webhooks failing silently when promotion tracking encounters errors.
**Lesson**: Webhook handlers should be resilient and not fail the entire process for non-critical operations.
**Solution**: Wrap promotion tracking in try-catch blocks and log errors without failing the webhook.

## Debugging & Logging

### Comprehensive Logging Strategy
**Issue**: Difficult to trace where promotion tracking was failing without proper logging.
**Lesson**: Add logging at key decision points, not just success/failure states.
**Solution**: Implement structured logging with consistent emoji prefixes for easy filtering:
- 🎯 Starting operations
- 🔍 Data inspection
- 🔄 Processing steps  
- ✅ Success states
- ⚠️ Warning conditions
- ❌ Error states

### Guest vs Authenticated User Handling
**Issue**: Different code paths for guest and authenticated users can lead to inconsistent behavior.
**Lesson**: Unify user handling logic where possible, or ensure both paths are thoroughly tested.
**Solution**: Create helper functions that normalize user data regardless of authentication state.

## React Component Performance & Infinite Loops

### Maximum Update Depth Exceeded
**Issue**: "Maximum update depth exceeded. This can happen when a component calls setState inside useEffect, but useEffect either doesn't have a dependency array, or one of the dependencies changes on every render."

**Root Causes**:
1. **Functions in dependency arrays** that are recreated on every render
2. **Complex state updates** within useEffect that trigger re-renders
3. **Object/array references** that change on every render
4. **Async operations** in useEffect that update state continuously

**Solutions**:
```typescript
// ❌ Problematic patterns
useEffect(() => {
  someFunction(); // Function recreated every render
}, [someFunction, complexObject, array?.length]);

// ❌ State updates causing loops
useEffect(() => {
  if (condition) {
    setState(newValue); // Can trigger infinite loop
  }
}, [condition, state]);

// ✅ Fixed patterns
useEffect(() => {
  // Use stable references only
}, [cart?.id, primitiveValue]);

// ✅ Remove function dependencies
const stableFunction = useCallback(() => {
  // logic
}, [stableDependencies]);

// ✅ Use refs for validation flags
const validationInProgress = useRef(false);
```

**Key Lessons**:
1. **Minimize useEffect dependencies** - only include primitive values and stable references
2. **Remove function dependencies** unless absolutely necessary
3. **Use useRef for flags** that shouldn't trigger re-renders
4. **Simplify complex logic** - break down complex useEffects into smaller, focused ones
5. **Debug with console.log** to identify which dependency is changing
6. **Test thoroughly** after removing dependencies to ensure functionality still works 