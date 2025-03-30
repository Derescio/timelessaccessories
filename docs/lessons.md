# Lessons Learned

This document captures key lessons, challenges, and solutions encountered during the development of the Timeless Accessories e-commerce platform.

## Architecture & Design

### 1. Hierarchical Data Management

**Challenge:** Implementing a hierarchical category system with proper validation.

**Lesson:** When working with self-referential relationships:
- Always implement validation to prevent circular references
- Optimize recursive checks for performance
- Include proper error messages for easier debugging
- Consider edge cases (such as updating without changing parent)

**Solution:** We implemented a robust check that prevents circular references while allowing updates to existing categories when the parent isn't changing:

```typescript
// Skip circular reference check when parent isn't changing
if (data.parentId !== existingCategory.parentId) {
  const isDescendant = await isChildDescendant(data.id, data.parentId);
  if (isDescendant) {
    return { success: false, error: "Cannot set a descendant category as parent" };
  }
}
```

### 2. State Management

**Challenge:** Managing complex form state with hierarchical selections.

**Lesson:** Use form libraries like React Hook Form with proper validation schemas to handle complex forms. Break down complex UI components into smaller, focused components.

### 3. Next.js 15 Dynamic Routes

**Challenge:** Handling dynamic route parameters in Next.js 15.

**Lesson:** In Next.js 15, dynamic route parameters are now Promise-based and must be awaited:
- Always await params before accessing properties
- Update type definitions to reflect Promise-based params
- Handle loading states appropriately
- Consider error boundaries for failed parameter resolution

**Solution:**
```typescript
interface EditProductPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
    const resolvedParams = await params;
    const { success, data: product, error } = await getProductById(resolvedParams.id);
    // ... rest of the component
}
```

## Database

### 1. Connection Issues

**Challenge:** Intermittent database connection issues with cloud PostgreSQL provider (Neon).

**Lesson:** Cloud database providers may have connection limits or timeout policies that affect development. Implement robust connection handling:
- Connection pooling
- Automatic retries
- Proper error handling
- Logging for diagnostics

### 2. Schema Evolution

**Challenge:** Adding fields to existing models with data.

**Lesson:** Plan migrations carefully, especially when adding required fields to existing tables:
- Include default values or make new fields optional
- Consider data backfill strategies
- Test migrations on copy of production data before applying

### 3. Prisma Decimal Types

**Challenge:** Handling Prisma Decimal types in client components.

**Lesson:** Prisma's Decimal type cannot be directly passed to client components. Always convert Decimal values to numbers:
- Convert Decimal to number before sending to client
- Handle null values appropriately
- Consider precision loss implications
- Implement consistent conversion across the application

**Solution:**
```typescript
// Convert Decimal values to numbers before sending to client
const inventoryData = {
    ...data,
    costPrice: Number(data.costPrice),
    retailPrice: Number(data.retailPrice),
    compareAtPrice: data.compareAtPrice ? Number(data.compareAtPrice) : null,
};
```

## Third-party Services

### 1. Image Handling

**Challenge:** Managing image uploads and URLs with UploadThing.

**Lesson:** External services may return different response formats:
- Build adapters to normalize responses
- Add fallbacks for missing values
- Handle errors gracefully
- Test integrations with mock services

```typescript
// Example of defensive URL extraction from UploadThing response
const url = file.ufsUrl || file.url || file.fileUrl || defaultImageUrl;
```

### 2. Payment Integrations

**Challenge:** Integrating multiple payment providers.

**Lesson:** Abstract payment logic behind a unified interface:
- Create provider-specific adapters
- Implement common error handling
- Consider regional requirements
- Test each integration independently

## Development Workflow

### 1. Error Handling & Debugging

**Challenge:** Tracking down issues in server actions and API routes.

**Lesson:** Implement comprehensive logging and debugging:
- Use detailed logs with context information
- Include try/catch blocks with specific error messages
- Implement client-side error reporting
- Consider adding a debug mode toggle

### 2. Performance Optimization

**Challenge:** Maintaining performance with complex database queries.

**Lesson:** Always consider query performance:
- Add appropriate indexes
- Use query builders or ORM features for optimization
- Implement pagination for large data sets
- Consider caching for frequently accessed data

## Future Considerations

### 1. Scalability Planning

As the application grows, consider:
- Implementing microservices for separation of concerns
- Using serverless functions for specific operations
- Adding a CDN for static assets and images
- Implementing database sharding or read replicas

### 2. Security Practices

Always prioritize security:
- Regular dependency updates
- Input validation on both client and server
- Proper authentication and authorization checks
- Rate limiting for public endpoints

## Data Handling
1. **Decimal Type Handling**
   - Prisma's Decimal type needs proper conversion when passing to client components
   - Convert to string/number before sending to client
   - Use proper type checking and conversion
   - Example: `Number(decimalValue.toString())`

2. **Chart Data Types**
   - Recharts expects numeric values for chart data
   - String values need to be converted to numbers
   - Handle type conversion at the data source
   - Validate data types before rendering

3. **Data Aggregation**
   - Use proper filtering instead of find for multiple results
   - Calculate totals correctly for percentages
   - Handle empty or null values gracefully
   - Consider edge cases in data processing

## Chart Implementation
1. **Recharts Best Practices**
   - Use ResponsiveContainer for proper sizing
   - Set appropriate radius values for visibility
   - Add padding between segments
   - Include proper tooltips and labels
   - Handle empty data states

2. **Chart Configuration**
   - Set minimum angles for small segments
   - Use donut chart style for better visibility
   - Add proper spacing between elements
   - Include percentage labels
   - Format tooltip values appropriately

3. **Performance Considerations**
   - Convert data types before rendering
   - Sort data efficiently
   - Handle large datasets properly
   - Consider using memoization for expensive calculations

## Error Handling
1. **Data Validation**
   - Validate data before processing
   - Handle missing or invalid values
   - Provide fallback displays
   - Show meaningful error messages

2. **Type Safety**
   - Use proper TypeScript types
   - Validate data structures
   - Handle edge cases
   - Document type requirements

3. **User Feedback**
   - Show loading states
   - Display error messages clearly
   - Provide fallback content
   - Guide users when data is missing

## Debugging Tips
1. **Chart Issues**
   - Check data types and formats
   - Verify data structure
   - Test with sample data
   - Add console logs for debugging
   - Use React DevTools for component inspection

2. **Data Processing**
   - Log intermediate results
   - Verify calculations
   - Check data transformations
   - Validate type conversions

3. **Performance**
   - Monitor render cycles
   - Check data processing time
   - Verify memory usage
   - Test with different data sizes

## Best Practices
1. **Code Organization**
   - Separate data processing from rendering
   - Use proper type definitions
   - Document complex logic
   - Follow consistent patterns

2. **User Experience**
   - Provide loading states
   - Handle empty data gracefully
   - Show meaningful messages
   - Ensure responsive design

3. **Maintenance**
   - Keep code clean and documented
   - Use consistent naming
   - Follow established patterns
   - Write maintainable code

## Cart and Inventory Management

### 1. Inventory ID vs SKU Usage

**Challenge:** Inconsistent use of inventory IDs and SKUs across the application.

**Lesson:** When dealing with inventory management:
- Be consistent with identifier usage (either ID or SKU, not both)
- Document the chosen approach clearly
- Update all related components to use the same identifier
- Consider the implications of using each type (IDs are internal, SKUs are business-facing)

**Solution:** We standardized on using SKUs for inventory lookups:
```typescript
// Find inventory by SKU consistently
const inventory = await prisma.productInventory.findUnique({
  where: { sku: inventoryId },
});
```

### 2. Cart Item Management

**Challenge:** Managing cart items with multiple inventory variants.

**Lesson:** When implementing cart functionality:
- Use consistent identifiers for inventory items
- Handle inventory availability checks properly
- Implement proper error handling for out-of-stock items
- Consider edge cases like quantity updates

**Solution:** We implemented a robust cart system that:
- Uses SKUs for inventory lookups
- Checks inventory availability before adding items
- Handles quantity updates with proper validation
- Provides clear error messages for users

### 3. Type Safety in Cart Operations

**Challenge:** Ensuring type safety across cart operations.

**Lesson:** When working with cart operations:
- Define clear interfaces for cart items
- Use proper type validation
- Handle edge cases in type definitions
- Consider null/undefined scenarios

**Solution:** We implemented proper type definitions:
```typescript
interface CartItemDetails {
  id: string;
  productId: string;
  inventoryId: string;
  name: string;
  slug: string;
  quantity: number;
  price: number;
  image: string;
  discountPercentage: number | null;
  hasDiscount: boolean;
  maxQuantity: number;
}
```
