/* eslint-disable @typescript-eslint/no-explicit-any */
import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';

export const authConfig = {
    providers: [], // Required by NextAuthConfig type
    callbacks: {
        authorized({ request, auth }: any) {
            const pathname = request?.nextUrl?.pathname;
            const searchParams = request?.nextUrl?.searchParams;
            
            //console.log('🔒 Auth Config - Pathname:', pathname);
            //console.log('🔒 Auth Config - Is authenticated:', !!auth);
            
            // Check if this is an admin route
            const isAdminPath = /^\/admin/.test(pathname);
            
            // Define paths that require authentication
            const protectedPaths = [
                /\/user\/(.*)/,
                /\/admin/,
                /\/profile/,
            ];
            
            // Define paths that explicitly allow guest access
            const guestAllowedPaths = [
                /\/confirmation/,
                /\/order-success/,
                /\/order\/[^\/]+\/stripe-payment-success/,
                /\/order\/[^\/]+\/paypal-payment-success/,
            ];
            
            // Check if path requires authentication
            const isProtectedPath = protectedPaths.some(p => p.test(pathname));
            const isGuestAllowedPath = guestAllowedPaths.some(p => p.test(pathname));
            
           // console.log('🔒 Auth Config - Is protected path:', isProtectedPath);
           // console.log('🔒 Auth Config - Is guest allowed path:', isGuestAllowedPath);
            
            // Handle admin paths - require ADMIN role
            if (isAdminPath) {
                if (!auth) {
                    console.log('🔒 Auth Config - Admin path without auth, redirecting to sign-in');
                    return false;
                }
                
                // Comprehensive logging to debug auth object structure
                console.log('🔒 Auth Config - Full auth object:', JSON.stringify(auth, null, 2));
                console.log('🔒 Auth Config - Auth keys:', Object.keys(auth || {}));
                
                if ((auth as any)?.user) {
                    console.log('🔒 Auth Config - User object:', JSON.stringify((auth as any).user, null, 2));
                    console.log('🔒 Auth Config - User keys:', Object.keys((auth as any).user || {}));
                    console.log('🔒 Auth Config - User role (direct):', (auth as any).user?.role);
                }
                
                if ((auth as any)?.session) {
                    console.log('🔒 Auth Config - Session object:', JSON.stringify((auth as any).session, null, 2));
                    console.log('🔒 Auth Config - Session user role:', (auth as any).session?.user?.role);
                }
                
                if ((auth as any)?.token) {
                    console.log('🔒 Auth Config - Token object:', JSON.stringify((auth as any).token, null, 2));
                    console.log('🔒 Auth Config - Token role:', (auth as any).token?.role);
                }
                
                // In NextAuth v5, the middleware auth object may not include custom fields
                // We need to fetch the user from the database using the email to get the role
                // This is a workaround for NextAuth v5 middleware limitations
                const userEmail = (auth as any)?.user?.email;
                
                // Try to get role from auth object first (in case it's available)
                let userRole = (auth as any)?.user?.role 
                    || (auth as any)?.session?.user?.role 
                    || (auth as any)?.token?.role
                    || (auth as any)?.role;
                
                // If role is not in auth object, we'll need to fetch it from DB
                // But middleware can't be async, so we'll allow through and let server-side check handle it
                // OR we can use a synchronous approach by checking the JWT token directly
                
                // For now, if we have email but no role, allow through to let server-side check handle it
                // This is less secure but necessary due to NextAuth v5 middleware limitations
                if (!userRole && userEmail) {
                    console.log('🔒 Auth Config - Role not in middleware auth object, allowing through for server-side check');
                    // Allow through - the server-side check in app/admin/layout.tsx will verify the role
                    return true;
                }
                
                const finalRole = userRole;
                
                console.log('🔒 Auth Config - Admin path check:', {
                    pathname,
                    hasAuth: !!auth,
                    userRole,
                    finalRole,
                    userEmail,
                    authStructure: auth ? Object.keys(auth) : [],
                    userObject: (auth as any)?.user ? {
                        keys: Object.keys((auth as any).user),
                        id: (auth as any).user?.id,
                        email: (auth as any).user?.email,
                        name: (auth as any).user?.name,
                        role: (auth as any).user?.role,
                        fullUser: JSON.stringify((auth as any).user, null, 2),
                    } : null,
                });
                
                if (finalRole !== 'ADMIN') {
                    console.log('🔒 Auth Config - Admin path accessed by non-admin user (role:', finalRole, '), redirecting');
                    console.log('🔒 Auth Config - Available role paths checked:', {
                        'auth.user.role': (auth as any)?.user?.role,
                        'auth.session.user.role': (auth as any)?.session?.user?.role,
                        'auth.token.role': (auth as any)?.token?.role,
                        'auth.role': (auth as any)?.role,
                    });
                    return false;
                }
                console.log('🔒 Auth Config - Admin access granted');
            }
            
            // Handle protected paths - require authentication
            if (isProtectedPath && !auth) {
                console.log('🔒 Auth Config - Protected path without auth, redirecting to sign-in');
                return false;
            }
            
            // Handle guest-allowed paths - allow access regardless of auth status
            if (isGuestAllowedPath) {
                console.log('🔒 Auth Config - Guest-allowed path, granting access');
                return true;
            }
            
            // Handle checkout paths with guest parameter
            const isGuestCheckout = searchParams?.get('guest') === 'true';
            const isCheckoutPath = pathname === '/shipping' || pathname === '/payment-method' || pathname === '/place-order';
            
            if (isCheckoutPath && !auth) {
                if (isGuestCheckout) {
                    //console.log('🔒 Auth Config - Guest checkout allowed');
                    return true;
                } else {
                   // console.log('🔒 Auth Config - Checkout requires auth or guest flag');
                    return false;
                }
            }

            // For all other paths, ensure session cart cookie exists
            if (!request.cookies.get('sessionCartId')) {
                console.log('🔒 Auth Config - Generating session cart ID for public access');
                const sessionCartId = crypto.randomUUID();
                const response = NextResponse.next({
                    request: {
                        headers: new Headers(request.headers),
                    },
                });
                response.cookies.set('sessionCartId', sessionCartId);
                return response;
            }
            
            //console.log('🔒 Auth Config - Default: allowing access');
            return true;
        },
    },
} satisfies NextAuthConfig;