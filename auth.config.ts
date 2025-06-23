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