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

1. Client-side environment variables in Next.js must be prefixed with `NEXT_PUBLIC_`
2. Hard-coded credentials are a security risk and cause maintenance issues
3. Always include fallback values for environment variables to prevent runtime errors:

   ```typescript
   const clientId = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";
   ```

**Solution:**

1. Fixed environment variable names in `.env` file:

   ```
   PAYPAL_CLIENT_ID=... # Server-side only
   NEXT_PUBLIC_PAYPAL_CLIENT_ID=... # Available on client
   ```

2. Removed hardcoded credentials from the PayPalCheckout component
3. Added console logging to verify the correct values are being used
4. Implemented proper error handling for missing credentials

### Best Practices for Payment Integration

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

## Next.js Image Configuration Challenges

When working with Next.js's built-in Image component for optimized images, we encountered issues with images from external domains, particularly with Vercel Blob Storage and PayPal.

### Unconfigured Host Error

**Problem:**
Images failed to load with the following error:

```
⨯ Error: Invalid src prop (https://hebbkx1anhila5yf.public.blob.vercel-storage.com/HeroImage-Wl3RWWw6YOnIN9bl2xJRPITHuYRdIw.png) on `next/image`, hostname "hebbkx1anhila5yf.public.blob.vercel-storage.com" is not configured under images in your `next.config.js`
```

**Key Learnings:**

1. Next.js requires explicit configuration for external image domains for security
2. Both the `domains` array and `remotePatterns` configurations may be needed
3. `domains` is simpler but less secure (whole domain is allowed)
4. `remotePatterns` is more flexible and secure (can specify protocol, pathname patterns)

**Solution:**
We updated `next.config.js` to properly handle all required image domains:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // ... other config
  images: {
    domains: [
      "www.paypalobjects.com",
      "hebbkx1anhila5yf.public.blob.vercel-storage.com"
    ],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.paypal.com",
        pathname: "**",
      },
      {
        protocol: "https",
        hostname: "*.vercel-storage.com",
        pathname: "**",
      },
    ],
  },
};
```

This configuration is important for:

1. PayPal button images that are loaded from PayPal's CDN
2. Vercel Blob Storage images used throughout the site
3. Any other third-party image services integrated with the application

**Debugging Note:**
When the Next.js development server emits an image domain error, it provides the exact hostname that needs to be added to the configuration, making it straightforward to fix.

## Environment Variable Configuration For Production

When deploying to production, proper environment variable management is crucial. We encountered issues with our application working in development but failing in production due to environment variable misconfigurations.

**Key Learnings:**

1. Different environments (dev/prod) should have consistent variable naming
2. Development-only workarounds must be properly conditioned:

   ```typescript
   // Good approach - only applies in development
   if (process.env.NODE_ENV === 'development') {
     // Development-only code
   }
   
   // Bad approach - hardcoded values that will cause issues in production
   const clientId = "hardcoded_value"; // Will prevent proper production behavior
   ```

3. The `.env` file's `NODE_ENV` setting affects server behavior:

   ```
   # For local development
   NODE_ENV="development"
   
   # For production-like testing
   NODE_ENV="production"
   ```

**Best Practices:**

1. Use a `.env.local` file for local development overrides (not committed to git)
2. Set `NODE_ENV="development"` for local testing
3. Consistently use environment variable prefixes:
   - `NEXT_PUBLIC_` for client-side variables
   - No prefix for server-side only variables
4. Always include fallbacks for environment variables to prevent crashes
5. Test the application with production environment settings before deploying

By following these practices, we were able to ensure our application functions correctly in both development and production environments.

## Address Management in E-commerce Applications

When implementing address management in our e-commerce application, we encountered the challenge of distinguishing between addresses created during checkout and those explicitly managed by users in their account settings.

### Separating Checkout Addresses from User-Managed Addresses

**Problem:**
Initially, all addresses were displayed in the user's address book, including those created during checkout. This led to cluttered address books filled with one-time delivery addresses that users didn't necessarily want to save.

**Key Learnings:**

1. Checkout-created addresses and user-managed addresses serve different purposes:
   - Checkout addresses are created for one-time use during the ordering process
   - User-managed addresses are explicitly saved by users for future orders
2. The user interface should only show addresses that users explicitly want to manage
3. Addresses created during checkout should still be associated with the user for order history

**Solution:**

1. Added an `isUserManaged` boolean field to the Address model with a default value of `false`:

   ```prisma
   model Address {
     // ... other fields
     isUserManaged Boolean @default(false)
   }
   ```

2. Modified address creation and retrieval logic:

   ```typescript
   // Only retrieve addresses that users explicitly want to manage
   export async function getUserAddresses() {
     // ... authentication check
     const addresses = await db.address.findMany({
       where: { 
         userId,
         isUserManaged: true // Only get addresses marked as user-managed
       },
       // ... other query options
     });
     // ... return addresses
   }
   ```

3. Updated address creation in checkout to ensure addresses are not automatically added to the user's address book:

   ```typescript
   await db.address.create({
     data: {
       userId,
       // ... address fields
       isUserManaged: false // Checkout-created addresses aren't user-managed by default
     }
   });
   ```

4. Created a function for users to explicitly mark addresses as managed:

   ```typescript
   export async function markAddressAsUserManaged(addressId: string) {
     // ... authentication check
     // Update address to mark as user-managed
     const address = await db.address.update({
       where: { id: addressId },
       data: { isUserManaged: true }
     });
     // ... return result
   }
   ```

5. Ensured addresses created directly in the user's address management UI are always marked as user-managed:

   ```typescript
   export async function addUserAddress(addressData) {
     // ... authentication check
     const address = await db.address.create({
       data: {
         // ... address fields
         isUserManaged: true // User explicitly created this address
       }
     });
     // ... return result
   }
   ```

**Best Practices:**

- Clearly distinguish between system-created and user-managed data in your schema
- Design database schemas with flags that control visibility in different contexts
- Use boolean flags with meaningful defaults for toggleable behavior
- Keep data for historical records even if not shown in the UI
- Provide mechanisms for users to "import" or "save" system-created data for future use

This approach has significantly improved our user experience by keeping address books clean and focused while still maintaining all address data for order history and analytics.

## Handling Intermittent Client-Side Errors

When dealing with third-party integrations like payment providers, certain errors may occur that are expected and should be handled gracefully without alarming users or cluttering error logs.

### PayPal Error Silencing for Improved UX

**Problem:**
The PayPal integration would log a console error "Target window is closed" when users navigated away from the payment flow or closed the PayPal popup. While this is expected behavior, it resulted in confusing error logs and potentially triggered monitoring alerts.

**Key Learnings:**

1. Some client-side errors are expected and don't represent actual problems
2. Error logging systems can be overwhelmed by non-actionable errors
3. Clean console logs improve development experience and customer support

**Solution:**
We implemented a targeted approach to intercept and silence specific known PayPal errors:

1. Used a global error handler to intercept PayPal-specific errors:

   ```javascript
   // Listen for errors in the PayPal SDK
   window.addEventListener('error', (event) => {
     // Check if the error is from PayPal and is about a closed window
     if (
       event.message.includes('Target window is closed') &&
       event.filename.includes('paypal')
     ) {
       // Prevent the error from being logged to console
       event.preventDefault();
     }
   });
   ```

2. Added clear documentation about the silenced errors:

   ```javascript
   /**
    * This error handler prevents PayPal's "Target window is closed" errors 
    * from being logged to the console when a user closes the PayPal popup
    * or navigates away from the payment flow. This is expected behavior
    * and not an actual error.
    */
   ```

**Best Practices:**

- Only silence errors that are well-understood and expected
- Document any error silencing with clear explanations
- Be specific in error matching to avoid hiding unexpected issues
- Consider implementing different handling for development vs. production
- Monitor silenced errors periodically to ensure they remain non-actionable

This approach has resulted in cleaner logs, better developer experience, and less noise in our monitoring systems, while still ensuring that actual issues are properly reported and addressed.
