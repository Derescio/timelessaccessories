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