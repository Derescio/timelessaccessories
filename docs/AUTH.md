# Authentication Documentation

## Overview
The authentication system in this project uses NextAuth.js with a custom configuration that includes:
- JWT-based authentication
- Session cart handling
- Password comparison using bcrypt-ts-edge
- Custom authorization middleware
- Integration with Prisma and PostgreSQL
- **Guest checkout support** for non-authenticated users

## Configuration Files

### `auth.ts`
Main authentication configuration file that includes:
- Session configuration
- JWT handling
- Credentials provider setup
- Custom callbacks for session and JWT
- Cart session management
- Password comparison using bcrypt

### `middleware.ts`
Middleware configuration for protected routes:
```typescript
import NextAuth from "next-auth";
import { config as authConfig } from "./auth";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
```

## Protected Routes
The following paths require authentication:
- `/shipping`
- `/payment-method`
- `/place-order`
- `/profile`
- `/user/*`
- `/order/*`
- `/admin`

## Session Cart Handling
- Automatically generates a `sessionCartId` for guest users
- Merges guest cart with user cart upon sign-in
- Handles cart persistence across sessions

## Guest Checkout Authentication

### Overview
The system supports guest checkout while maintaining security and functionality. Guest users can complete purchases without creating accounts, but their orders are tracked via email addresses.

### Implementation Details

#### Auth Middleware Updates
The auth middleware (`auth.ts`) includes special handling for guest checkout:

```typescript
authorized({ request, auth }: any) {
  const pathname = request?.nextUrl?.pathname;
  const searchParams = request?.nextUrl?.searchParams;
  
  // Allow guest checkout for shipping and payment pages
  const isGuestCheckout = searchParams?.get('guest') === 'true';
  const isCheckoutPath = pathname === '/shipping' || pathname === '/payment-method' || pathname === '/place-order';
  
  if (!auth && isCheckoutPath) {
    if (isGuestCheckout) {
      return true; // Allow guest checkout
    } else {
      return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${pathname}&message=Please sign in to continue with checkout`, request.nextUrl.origin));
    }
  }
  // ... rest of authorization logic
}
```

#### Cart Merging for Guest Users
When guests sign in after adding items to cart, the system automatically merges their session cart with their user account:

```typescript
// In JWT callback
if (trigger === 'signIn' || trigger === 'signUp') {
  const sessionCartId = cookiesObject.get('sessionCartId')?.value;
  
  if (sessionCartId) {
    const sessionCart = await prisma.cart.findFirst({
      where: { sessionId: sessionCartId },
      include: { items: true }
    });
    
    if (sessionCart && sessionCart.items.length > 0) {
      // Merge with existing user cart or assign to user
      // ... merging logic
    }
  }
}
```

#### Guest Order Creation
Guest orders are created without requiring authentication:

```typescript
// Guest order functions don't require userId
export const createGuestOrder = async (orderData: OrderData) => {
  const order = await prisma.order.create({
    data: {
      guestEmail: orderData.shippingAddress.email,
      // No userId required
      cartId: cart.id,
      // ... other order data
    }
  });
};
```

### Protected vs Guest-Accessible Routes

#### Fully Protected Routes (Require Authentication)
- `/profile`
- `/user/*`
- `/admin`
- `/order/*` (for viewing order history)

#### Guest-Accessible Routes (With `?guest=true`)
- `/shipping?guest=true`
- `/payment-method?guest=true` 
- `/place-order?guest=true`
- `/confirmation` (for guest orders)

#### Public Routes (No Authentication Required)
- `/` (homepage)
- `/products`
- `/products/[slug]`
- `/cart`
- `/sign-in`
- `/sign-up`

### Security Considerations for Guest Checkout

1. **Data Protection**
   - Guest orders store minimal required information
   - No sensitive user data is persisted beyond order completion
   - Guest emails are used only for order tracking and communication

2. **Session Management**
   - Guest sessions use secure session IDs
   - Cart data is properly isolated between sessions
   - Session cleanup occurs after order completion

3. **Order Security**
   - Guest orders require valid shipping and payment information
   - Same payment security standards apply to guest and authenticated orders
   - Order access is controlled via secure order IDs

4. **Cart Security**
   - Session-based cart isolation
   - Secure cart merging when guests sign in
   - Proper cleanup of abandoned guest carts

## Usage Examples

### Protecting a Route
```typescript
import { auth } from "@/auth";

export default async function ProtectedPage() {
  const session = await auth();
  if (!session) return redirect("/auth/login");
  
  return <div>Protected Content</div>;
}
```

### Using Authentication in API Routes
```typescript
import { auth } from "@/auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return new Response("Unauthorized", { status: 401 });
  }
  // Handle authenticated request
}
```

### Integration with Uploadthing
File upload routes are protected using the auth middleware:
```typescript
import { auth } from "@/auth";

export const ourFileRouter = {
  productImage: f({ image: { maxFileSize: "4MB", maxFileCount: 4 } })
    .middleware(async () => {
      const session = await auth();
      if (!session?.user?.id) throw new Error("Unauthorized");
      return { userId: session.user.id };
    })
    // ...
};
```

## Testing Authentication
A test page is available at `/auth/test` to verify:
- Session status
- Sign in/out functionality
- Protected route behavior
- Session data structure

## Security Considerations
1. Passwords are hashed using bcrypt
2. JWT tokens are used for session management
3. CSRF protection is enabled
4. Secure cookie handling
5. Protected route patterns
6. Rate limiting on auth endpoints 