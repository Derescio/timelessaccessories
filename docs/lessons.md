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