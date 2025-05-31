import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { db } from '@/lib/db';
import { PrismaAdapter } from '@auth/prisma-adapter';
import type { NextAuthConfig } from 'next-auth';
import { NextResponse } from 'next/server';
import GoogleProvider from 'next-auth/providers/google';
import { compareSync } from 'bcrypt-ts-edge';
import { cookies } from 'next/headers';



export const config = {
    pages: {
        signIn: '/sign-in',
        error: '/sign-in',
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60,
        // maxAge: 60,
    },
    adapter: PrismaAdapter(db),
   

    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            profile(profile) {
                return {
                    id: profile.sub,
                    name: profile.name,
                    email: profile.email,
                    image: profile.picture,
                    role: "USER" // Set default role for new users
                }
            }
        }),
        CredentialsProvider({
            credentials: {
                email: { type: 'email' },
                password: { type: 'password' },
            },
            async authorize(credentials) {
                if (credentials == null) return null
                // Find user in database
                const user = await db.user.findFirst({
                    where: {
                        email: credentials.email as string,
                    }
                });
                // Check is user exists
                if (user && user.password) {
                    // Check if password is correct
                    const isPasswordCorrect = compareSync(
                        credentials.password as string,
                        user.password
                    );
                    // If password is correct
                    if (isPasswordCorrect) {

                        return {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            role: user.role
                        } as any
                    }
                } else {
                    // If user does not exist or password is incorrect
                    return null
                }
            }
        })],
    callbacks: {
        async session({ session, user, trigger, token }: any) {
            session.user.id = token.sub
            session.user.name = token.name;
            session.user.role = token.role;
            //If there is an update, set the user name
            if (trigger === 'update') {
                session.user.name = user.name
            }
            return session
        },
        async jwt({ token, user, trigger, session }: any) {
            if (user) {
                // Assign user properties to the token
                //token.id = user.id;
                token.role = user.role;
               console.log(user)
                if (trigger === 'signIn' || trigger === 'signUp') {
                    const cookiesObject = await cookies();
                    const sessionCartId = cookiesObject.get('sessionCartId')?.value;

                    console.log('🔄 Cart merging - Session Cart ID:', sessionCartId);
                    console.log('🔄 Cart merging - User ID:', user.id);
                    console.log('🔄 Cart merging - Trigger:', trigger);

                    if (sessionCartId) {
                        try {
                            console.log('🔄 Cart merging - Starting cart merge process');
                            
                            // Look for session cart
                            const sessionCart = await db.cart.findFirst({
                                where: { sessionId: sessionCartId },
                                include: { items: true }
                            });

                            console.log('🔄 Cart merging - Session cart lookup result:', {
                                found: !!sessionCart,
                                cartId: sessionCart?.id,
                                itemCount: sessionCart?.items.length || 0,
                                sessionId: sessionCart?.sessionId
                            });

                            if (sessionCart && sessionCart.items.length > 0) {
                                console.log('🔄 Cart merging - Session cart has items, proceeding with merge');
                                
                                // Check if user already has a cart
                                const existingUserCart = await db.cart.findFirst({
                                    where: { userId: user.id },
                                    include: { items: true }
                                });

                                console.log('🔄 Cart merging - Existing user cart lookup result:', {
                                    found: !!existingUserCart,
                                    cartId: existingUserCart?.id,
                                    itemCount: existingUserCart?.items.length || 0,
                                    userId: existingUserCart?.userId
                                });

                                if (existingUserCart) {
                                    console.log('🔄 Cart merging - Merging session cart items into existing user cart');
                                    
                                    // Merge carts: add session cart items to user cart
                                    for (const sessionItem of sessionCart.items) {
                                        console.log('🔄 Cart merging - Processing session item:', {
                                            itemId: sessionItem.id,
                                            productId: sessionItem.productId,
                                            inventoryId: sessionItem.inventoryId,
                                            quantity: sessionItem.quantity
                                        });
                                        
                                        const existingItem = existingUserCart.items.find(
                                            item => item.inventoryId === sessionItem.inventoryId
                                        );

                                        if (existingItem) {
                                            console.log('🔄 Cart merging - Item exists in user cart, updating quantity');
                                            // Update quantity if item already exists
                                            await db.cartItem.update({
                                                where: { id: existingItem.id },
                                                data: { quantity: existingItem.quantity + sessionItem.quantity }
                                            });
                                            console.log('🔄 Cart merging - Updated existing item quantity from', existingItem.quantity, 'to', existingItem.quantity + sessionItem.quantity);
                                        } else {
                                            console.log('🔄 Cart merging - Item not in user cart, adding new item');
                                            // Add new item to user cart
                                            await db.cartItem.create({
                                                data: {
                                                    cartId: existingUserCart.id,
                                                    productId: sessionItem.productId,
                                                    inventoryId: sessionItem.inventoryId,
                                                    quantity: sessionItem.quantity,
                                                    selectedAttributes: sessionItem.selectedAttributes as any
                                                }
                                            });
                                            console.log('🔄 Cart merging - Added new item to user cart');
                                        }
                                    }

                                    // Delete the session cart
                                    console.log('🔄 Cart merging - Deleting session cart');
                                    await db.cart.delete({
                                        where: { id: sessionCart.id }
                                    });
                                    console.log('🔄 Cart merging - Session cart deleted successfully');
                                } else {
                                    console.log('🔄 Cart merging - No existing user cart, assigning session cart to user');
                                    // No existing user cart, assign session cart to user
                                    await db.cart.update({
                                        where: { id: sessionCart.id },
                                        data: { 
                                            userId: user.id,
                                            sessionId: null 
                                        }
                                    });
                                    console.log('🔄 Cart merging - Session cart assigned to user successfully');
                                }
                                
                                console.log('🔄 Cart merging - Cart merge completed successfully');
                            } else {
                                console.log('🔄 Cart merging - No session cart or empty cart found, nothing to merge');
                            }
                        } catch (error) {
                            console.error('🔄 Cart merging - Error during cart merge:', error);
                            console.error('🔄 Cart merging - Error details:', {
                                message: error instanceof Error ? error.message : 'Unknown error',
                                stack: error instanceof Error ? error.stack : undefined,
                                sessionCartId,
                                userId: user.id
                            });
                        }
                    } else {
                        console.log('🔄 Cart merging - No session cart ID found in cookies');
                    }
                }
            }
            // Handle Session Update
            if (session?.user.name && trigger === 'update') {
                token.name = session.user.name
            }
            return token;
        },

        //     // Assign user fields to token
        //     if (user) {
        //         token.id = user.id;
        //         token.role = user.role;

        //         // If user has no name then use the email
        //         if (user.name === 'NO_NAME') {
        //             token.name = user.email!.split('@')[0];

        //             // Update database to reflect the token name
        //             await prisma.user.update({
        //                 where: { id: user.id },
        //                 data: { name: token.name },
        //             });
        //         }

        //         if (trigger === 'signIn' || trigger === 'signUp') {
        //             const cookiesObject = await cookies();
        //             const sessionCartId = cookiesObject.get('sessionCartId')?.value;

        //             if (sessionCartId) {
        //                 const sessionCart = await prisma.cart.findFirst({
        //                     where: { sessionCartId },
        //                 });

        //                 if (sessionCart) {
        //                     // Delete current user cart
        //                     await prisma.cart.deleteMany({
        //                         where: { userId: user.id },
        //                     });

        //                     // Assign new cart
        //                     await prisma.cart.update({
        //                         where: { id: sessionCart.id },
        //                         data: { userId: user.id },
        //                     });
        //                 }
        //             }
        //         }
        //     }

        //     // Handle session updates
        //     if (session?.user.name && trigger === 'update') {
        //         token.name = session.user.name;
        //     }

        //     return token;
        // },
        authorized({ request, auth }: any) {
            const pathname = request?.nextUrl?.pathname;
            const searchParams = request?.nextUrl?.searchParams;
            
            console.log('🔒 Auth Middleware - Pathname:', pathname);
            console.log('🔒 Auth Middleware - Is authenticated:', !!auth);
            
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
            
            console.log('🔒 Auth Middleware - Is protected path:', isProtectedPath);
            console.log('🔒 Auth Middleware - Is guest allowed path:', isGuestAllowedPath);
            
            // Handle protected paths - require authentication
            if (isProtectedPath && !auth) {
                console.log('🔒 Auth Middleware - Protected path without auth, redirecting to sign-in');
                return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${pathname}`, request.nextUrl.origin));
            }
            
            // Handle guest-allowed paths - allow access regardless of auth status
            if (isGuestAllowedPath) {
                console.log('🔒 Auth Middleware - Guest-allowed path, granting access');
                return true;
            }
            
            // Handle checkout paths with guest parameter
            const isGuestCheckout = searchParams?.get('guest') === 'true';
            const isCheckoutPath = pathname === '/shipping' || pathname === '/payment-method' || pathname === '/place-order';
            
            if (isCheckoutPath && !auth) {
                if (isGuestCheckout) {
                    console.log('🔒 Auth Middleware - Guest checkout allowed');
                    return true;
                } else {
                    console.log('🔒 Auth Middleware - Checkout requires auth or guest flag');
                    return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${pathname}&message=Please sign in to continue with checkout`, request.nextUrl.origin));
                }
            }

            // For all other paths, ensure session cart cookie exists
            if (!request.cookies.get('sessionCartId')) {
                console.log('🔒 Auth Middleware - Generating session cart ID for public access');
                const sessionCartId = crypto.randomUUID();
                const newRequestHeaders = new Headers(request.headers);
                const response = NextResponse.next({
                    request: {
                        headers: newRequestHeaders
                    }
                });
                response.cookies.set('sessionCartId', sessionCartId);
                return response;
            }
            
            console.log('🔒 Auth Middleware - Default: allowing access');
            return true;
        },
        async signIn({ user, account, profile }) {
            return true // Accept all sign-ins
        },
    },
} satisfies NextAuthConfig

export const {
    handlers, auth, signIn, signOut
} = NextAuth(config)