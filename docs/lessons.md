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
- Route parameters are now wrapped in a Promise
- Parameters must be awaited before use
- Type definitions need to reflect Promise-based nature
- API routes need to handle Promise-based parameters
- Error handling should account for Promise rejection

**Solution Example for Page Routes:**
```typescript
interface DynamicPageProps {
    params: Promise<{
        id: string;
    }>;
}

export default async function DynamicPage({ params }: DynamicPageProps) {
    const resolvedParams = await params;
    const id = resolvedParams.id;
    // ... rest of the component
}
```

**Solution Example for API Routes:**
```typescript
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const id = resolvedParams.id;
        // ... handle the request
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to process request" },
            { status: 500 }
        );
    }
}
```

**Key Points:**
1. Always await params before accessing properties
2. Update TypeScript interfaces to reflect Promise-based params
3. Handle potential Promise rejection in API routes
4. Consider loading states while params are resolving
5. Use error boundaries for failed parameter resolution

### 4. Form Design and UX

**Challenge:** Creating intuitive forms that prevent validation errors during user input.

**Lesson:** Design forms with user experience in mind:
- Use controlled components to manage form state
- Delay validation until appropriate (e.g., on blur or submit)
- Provide clear visual feedback for validation states
- Consider manual actions instead of automatic behavior for derived fields

**Solution:**
```typescript
// Instead of automatic slug generation, use a button
<Button 
    type="button" 
    variant="outline" 
    onClick={() => {
        const name = form.getValues("name");
        if (name && name.length >= 3) {
            form.setValue("slug", slugify(name), { shouldValidate: true });
            sonnerToast.success("Slug generated from name");
        } else {
            sonnerToast.error("Name must be at least 3 characters long");
        }
    }}
>
    Generate
</Button>
```

### 5. Component Organization

**Challenge:** Managing complex UIs with multiple related components.

**Lesson:** Organize components effectively:
- Use a tabbed interface for related form sections
- Create sub-components for logical grouping
- Implement context providers for shared state
- Consider component composition patterns

**Solution:**
```typescript
// Tabs for form organization
<Tabs defaultValue="basic" className="w-full">
    <TabsList className="grid w-full grid-cols-5">
        <TabsTrigger value="basic">Basic Details</TabsTrigger>
        <TabsTrigger value="pricing">Pricing</TabsTrigger>
        <TabsTrigger value="inventory">Inventory</TabsTrigger>
        <TabsTrigger value="image">Images</TabsTrigger>
        <TabsTrigger value="display">Display</TabsTrigger>
    </TabsList>
    <TabsContent value="basic" className="space-y-4">
        <BasicInfoTab />
    </TabsContent>
    {/* Other tab contents */}
</Tabs>
```

## Email & Webhooks

### 1. React Import Issues in Email Templates

**Challenge:** Webhook endpoints returning 500 errors with "React is not defined" when sending order confirmation emails.

**Symptoms:**
- Webhooks receive events successfully but fail during email template rendering
- Error occurs in both server-side email functions and React Email components
- Payment processing completes but confirmation emails fail silently

**Root Cause:** Missing React imports in email template files when using React Email components.

**Lesson:** When using React Email with server-side rendering:
- **Always import React** in files that use JSX syntax, even if not explicitly referenced
- React imports are required for both the email service function and template components
- Server-side email rendering requires explicit React imports unlike client components
- Use `React.createElement()` for programmatic component creation in server contexts
- **Never use Next.js client components** in email templates (Link, Image, etc.)
- Use React Email components instead of Next.js components

**Solution:**

1. **Fix email service function (`email/index.tsx`):**
```typescript
import React from "react";
import { Resend } from "resend";
import PurchaseReceiptEmail from "@/email/purchase-receipts";

// Use React.createElement for server-side rendering
const emailResult = await resend.emails.send({
    from: `${APP_NAME} <${SENDER_EMAIL}>`,
    to: userEmail,
    subject: `Order Confirmation - ${formattedOrder.id}`,
    react: React.createElement(PurchaseReceiptEmail, { order: formattedOrder }),
});
```

2. **Fix email template component (`email/purchase-receipts.tsx`):**
```typescript
import React from 'react';
import { Body, Container, Heading, Html, Link, /* other components */ } from '@react-email/components';

export default function PurchaseReceiptEmail({ order }: { order: any }) {
    return (
        <Html>
            {/* Use React Email Link component, not Next.js Link */}
            <Link href="mailto:support@example.com">support@example.com</Link>
        </Html>
    );
}
```

**Common Error Messages:**
- `React is not defined` → Missing React import in email templates
- `Attempted to call the default export of .../next/dist/client/app-dir/link.js from the server` → Using Next.js Link component in email template
- `Cannot read property 'createElement' of undefined` → Missing React import for JSX syntax

**Testing Strategy:**
- Test email templates in isolation before integrating with webhooks
- Use React Email's preview functionality for development
- Verify all imports are correct in both service functions and template components

## Cart & Promotions

### 1. Coupon Persistence Issues

**Challenge:** Applied coupon codes disappearing after page refresh or navigation.

**Symptoms:**
- User applies coupon successfully
- Coupon shows in cart with discount applied
- After page refresh, coupon disappears
- localStorage contains promotion data but it's not being loaded

**Root Cause:** Overly aggressive cart state clearing logic that removes promotions when cart loads.

**Lesson:** When implementing cart state management:
- **Avoid clearing user-applied data** during normal cart loading operations
- Only clear promotions when explicitly intended (order completion, user action)
- Be careful with `useEffect` dependencies that trigger on cart ID changes
- Cart loading should not affect previously applied promotions
- **Test persistence scenarios** thoroughly (page refresh, navigation, browser restart)

**Anti-Pattern to Avoid:**
```typescript
// ❌ This clears promotions every time cart loads
useEffect(() => {
    if (cart?.id && previousCartHash && cart.id !== previousCartHash) {
        // This triggers on every page load when cart goes from null to loaded
        localStorage.removeItem(`cart-promotions-${cart.id}`);
    }
}, [cart?.id]);
```

**Solution:**
- Remove automatic promotion clearing on cart state changes
- Only clear promotions on explicit user actions or order completion
- Keep promotion state management simple and predictable
- Use cart ID as a key for promotion storage but don't clear on cart loading

**Prevention:**
1. Always test coupon persistence after page refresh
2. Avoid clearing user data during normal loading operations  
3. Be explicit about when and why promotions should be cleared
4. Use descriptive variable names and comments for clearing logic
5. Consider the user experience impact of any automatic clearing behavior

**Testing Checklist:**
- [ ] Apply coupon → Refresh page → Coupon persists
- [ ] Apply coupon → Navigate away → Return → Coupon persists  
- [ ] Apply coupon → Close browser → Reopen → Coupon persists
- [ ] Complete order → Promotions cleared appropriately
- [ ] Multiple coupons → All persist correctly
