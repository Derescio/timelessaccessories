# Development Lessons & Best Practices

## TypeScript & ESLint

### Global Variables in TypeScript with ESLint

When working with global variables in TypeScript, particularly with tools like Prisma that require global instance management, we encountered an interesting case where best practices needed careful consideration:

```typescript
declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}
```

**Key Learnings:**
1. While `let` and `const` are preferred over `var` in modern JavaScript/TypeScript, global declarations are an exception
2. The `no-var` ESLint rule needs to be disabled specifically for global declarations
3. Using `var` for global declarations is the correct approach because:
   - It properly declares properties on the global object
   - It maintains consistent behavior across different JavaScript environments
   - It follows TypeScript's expectations for global augmentation

**Best Practices:**
- Document ESLint rule exceptions with clear comments
- Use `var` only for global declarations, stick to `let`/`const` everywhere else
- When extending global types, ensure proper TypeScript namespace declarations

This pattern is particularly useful when:
- Managing singleton instances (like database connections)
- Preventing hot reload issues in development
- Ensuring proper type safety with global variables 

## Database Configuration
1. When using Prisma with Neon in a serverless environment:
   - Use `@neondatabase/serverless` for connection pooling
   - Configure WebSocket support for better connection management
   - Create connection pools per request to avoid idle connections
   - Use environment-specific database URLs

2. Prisma Client Generation:
   - Add `prisma generate` to build and postinstall scripts for Vercel deployment
   - Handle permission issues by cleaning node_modules/.prisma when needed
   - Use proper error handling for database operations

## Checkout Form Handling and Data Flow

### Field Naming Consistency Across Interfaces

When implementing multi-step checkout processes, field naming consistency becomes critical. We encountered issues with postal code data not being properly saved due to inconsistent field naming:

**Key Learnings:**
1. Field naming must be consistent throughout the entire data flow:
   - Form state in the frontend (`formData.postalCode`)
   - LocalStorage data structures (`zipCode` vs `postalCode`)
   - Server-side interfaces (`data.shippingAddress.zipCode`)
   - Database schema fields (`address.postalCode`)

2. Data transformations between pages should include explicit field mappings:
   ```typescript
   // Ensure postal code is explicitly mapped when saving to localStorage
   localStorage.setItem('checkoutData', JSON.stringify({
     shippingAddress: {
       ...formData,
       zipCode: formData.postalCode, // Explicit mapping for consistency
     },
     // other fields...
   }));
   ```

3. Implement fallback logic for different field names:
   ```typescript
   // Extract postal code from multiple possible sources
   const postalCode = checkoutData.shippingAddress.zipCode || 
                      checkoutData.shippingAddress.postalCode || 
                      "";
   ```

**Best Practices:**
- Add detailed logging throughout the data flow to track field values
- Use standardized naming conventions across all interfaces
- Implement explicit type checking when accessing potentially missing fields
- Add validation to ensure required fields are present before submission
- Always log raw data objects for debugging complex multi-step forms

## Authentication Setup
1. NextAuth.js Integration:
   - Use the beta version for Next.js 14+ compatibility
   - Implement proper session and JWT handling
   - Configure protected routes with middleware
   - Handle cart sessions for guest users

2. Security Best Practices:
   - Use bcrypt for password hashing
   - Implement proper session management
   - Configure CSRF protection
   - Set up secure cookie handling
   - Use environment variables for sensitive data

3. File Upload Security:
   - Integrate auth with Uploadthing
   - Implement file size and type restrictions
   - Add user-specific upload permissions
   - Store file metadata with user context

## Testing and Documentation
1. Authentication Testing:
   - Create test pages for auth functionality
   - Verify protected routes
   - Test session persistence
   - Validate user roles and permissions

2. Documentation Importance:
   - Document configuration files
   - Provide usage examples
   - List security considerations
   - Keep track of lessons learned

## Deployment Considerations
1. Vercel Deployment:
   - Configure build scripts properly
   - Handle dependency caching
   - Set up environment variables
   - Test in production environment 

## UI Component Installation
1. Shadcn/UI Components:
   - Use `npx shadcn@latest add [component-name]` for installation
   - NOT `npx shadcn-ui` which is incorrect
   - Can install multiple components at once: `npx shadcn@latest add component1 component2`
   - Components are added to `@/components/ui/`
   - Tailwind CSS classes can be customized in the component files 

## Next.js 15 Dynamic Parameter Handling

When upgrading to Next.js 15, we encountered issues with dynamic route parameters in the product details page. The application threw runtime errors and build-time type errors related to params handling.

**Key Learnings:**
1. In Next.js 15, route parameters are now Promises that must be awaited before use:
   ```typescript
   // Old approach (worked in Next.js 14)
   export default async function ProductDetailPage({ params }: PageProps) {
       const { slug } = params; // Error in Next.js 15: params is now a Promise
       // ...
   }
   
   // Next.js 15 approach
   export default async function ProductDetailPage({ params }: PageProps) {
       const resolvedParams = await params;
       const { slug } = resolvedParams;
       // ...
   }
   ```

2. TypeScript interfaces need to be updated to reflect the Promise-based params:
   ```typescript
   // Old interface (Next.js 14)
   interface PageProps {
       params: {
           slug: string;
       };
       searchParams?: { [key: string]: string | string[] | undefined };
   }
   
   // Next.js 15 interface
   interface PageProps {
       params: Promise<{
           slug: string;
       }>;
       searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
   }
   ```

3. This change applies to all route parameters, including searchParams

**Debugging Steps We Used:**
1. Identified runtime error: `Error: Route "/products/[slug]" used params.slug. params should be awaited before using its properties.`
2. Fixed runtime error by awaiting params
3. Encountered build-time type errors when running `npm run build`
4. Fixed type errors by updating the PageProps interface to use Promise types

**Best Practices:**
- Always await route parameters in Next.js 15 before accessing their properties
- Update type definitions to match the new Promise-based parameter pattern
- Review your entire application for instances of dynamic routes when upgrading
- Check both runtime behavior and type safety when dealing with changes to framework APIs

**Impact:**
- Failing to properly handle these Promises can cause both runtime errors and type errors
- The runtime errors may not be immediately apparent in development mode
- Build errors will catch type issues, but only if you're using TypeScript properly

This change is part of Next.js 15's improvements to better handle asynchronous data fetching and rendering.

## PayPal Integration Challenges

When implementing PayPal integration in our e-commerce application, we encountered several issues that required careful consideration and thoughtful solutions.

### Permission Denied Errors

**Problem:**
After PayPal order approval, the capture process was failing with a PERMISSION_DENIED error:

```
PayPal capture failed with status 403 {"name":"NOT_AUTHORIZED","details":[{"issue":"PERMISSION_DENIED","description":"You do not have permission to access or perform operations on this resource."}],"message":"Authorization failed due to insufficient permissions."}
```

**Key Learnings:**
1. PayPal's sandbox environment requires specific app permissions that must be explicitly configured
2. Different PayPal operations (create order, capture payment) require different permission sets
3. Developer accounts must have the right permission scope for API interactions

**Solution:**
1. Configure the correct permissions in the PayPal Developer Dashboard:
   - Transaction Search
   - Vault
   - Orders
   - PayPal Checkout Advanced
   - Payments
2. For development testing, we implemented a sandbox-only workaround:
   ```typescript
   // Only use this approach in development for testing UI flows
   if (isDevelopment && PAYPAL_API_BASE.includes('sandbox') && 
       responseText.includes('PERMISSION_DENIED')) {
     console.warn('Using mock response in development mode');
     return mockSuccessResponse;
   }
   ```

### Cart Deletion During Payment Flow

**Problem:**
The original checkout flow deleted the cart immediately after creating an order, which caused issues when users were redirected back from PayPal. Without the cart, the confirmation page couldn't display order details.

**Key Learnings:**
1. Multi-step payment flows need to preserve state across HTTP redirects
2. Cart data should be retained until the payment is fully completed
3. Alternative data sources (like order data) should be available as fallbacks

**Solution:**
1. Implemented a new function `createOrderWithoutDeletingCart` that preserves the cart during payment flow
2. Created an API endpoint to fetch order details directly by ID
3. Updated the confirmation page to load data from either the cart or the order

### Missing Client ID Errors

**Problem:**
The PayPal JavaScript SDK script failed to load with errors when the client ID was missing or invalid.

**Key Learnings:**
1. Environment variables must be properly configured and accessible to client-side code
2. Client-side errors need user-friendly handling
3. Descriptive error messages help with debugging

**Solution:**
1. Added error state and friendly user feedback for script loading failures
2. Implemented validation for the PayPal client ID before attempting to load the SDK
3. Added detailed console logging with troubleshooting steps

### Best Practices for Payment Integration:

1. **Graceful Degradation:**
   - Always provide fallbacks if payment options fail to load
   - Show meaningful error messages to users
   - Log detailed information for debugging

2. **State Preservation:**
   - Never delete critical data until the entire payment flow is complete
   - Implement alternative data retrieval methods
   - Use session storage or databases to preserve state across redirects

3. **Environment Awareness:**
   - Create different logic for development vs. production
   - Never use development workarounds in production code
   - Clearly mark and document any environment-specific code

4. **Comprehensive Testing:**
   - Test the entire payment flow from start to finish
   - Verify successful payments, cancellations, and error scenarios
   - Test with real sandbox accounts

5. **Security Considerations:**
   - Keep API keys and secrets secure
   - Validate all payment data on the server
   - Implement proper error handling that doesn't expose sensitive information

These lessons have significantly improved our payment processing workflow and created a more robust checkout experience for users. 