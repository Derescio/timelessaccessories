# Authentication Documentation

## Overview
The authentication system in this project uses NextAuth.js with a custom configuration that includes:
- JWT-based authentication
- Session cart handling
- Password comparison using bcrypt-ts-edge
- Custom authorization middleware
- Integration with Prisma and PostgreSQL

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