import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/config';
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

                    if (sessionCartId) {
                        try {
                            const sessionCart = await prisma.cart.findFirst({
                                where: { sessionId: sessionCartId },
                                include: { items: true }
                            });

                            if (sessionCart && sessionCart.items.length > 0) {
                                // Check if user already has a cart
                                const existingUserCart = await prisma.cart.findFirst({
                                    where: { userId: user.id },
                                    include: { items: true }
                                });

                                if (existingUserCart) {
                                    // Merge carts: add session cart items to user cart
                                    for (const sessionItem of sessionCart.items) {
                                        const existingItem = existingUserCart.items.find(
                                            item => item.inventoryId === sessionItem.inventoryId
                                        );

                                        if (existingItem) {
                                            // Update quantity if item already exists
                                            await prisma.cartItem.update({
                                                where: { id: existingItem.id },
                                                data: { quantity: existingItem.quantity + sessionItem.quantity }
                                            });
                                        } else {
                                            // Add new item to user cart
                                            await prisma.cartItem.create({
                                                data: {
                                                    cartId: existingUserCart.id,
                                                    productId: sessionItem.productId,
                                                    inventoryId: sessionItem.inventoryId,
                                                    quantity: sessionItem.quantity,
                                                    selectedAttributes: sessionItem.selectedAttributes as any
                                                }
                                            });
                                        }
                                    }

                                    // Delete the session cart
                                    await prisma.cart.delete({
                                        where: { id: sessionCart.id }
                                    });
                                } else {
                                    // No existing user cart, assign session cart to user
                                    await prisma.cart.update({
                                        where: { id: sessionCart.id },
                                        data: { 
                                            userId: user.id,
                                            sessionId: null 
                                        }
                                    });
                                }
                            }
                        } catch (error) {
                            console.error('Error merging carts:', error);
                        }
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
            // If the user is not authenticated, redirect to the sign-in page. Array of regex patterns to exclude from the redirect
            const excludedPaths = [
                /\/confirmation/,
                /\/order-sucess/,
                /\/order\/.*\/stripe-payment-success/, // Allow guest access to payment success pages
                /\/order\/.*\/paypal-payment-success/, // Allow guest access to PayPal success pages
                /\/profile/,
                /\/user\/(.*)/,
                /\/order\/(.*)/,
                /\/admin/,
            ]
            
            // Check if the request path matches any of the excluded paths. Req URL OBject
            const pathname = request?.nextUrl?.pathname;
            const searchParams = request?.nextUrl?.searchParams;
            
            // Allow guest checkout for shipping and payment pages
            const isGuestCheckout = searchParams?.get('guest') === 'true';
            const isCheckoutPath = pathname === '/shipping' || pathname === '/payment-method' || pathname === '/place-order';
            
            if (!auth && excludedPaths.some((p) => p.test(pathname))) {
                return false;
            }
            
            // Handle checkout paths specifically
            if (!auth && isCheckoutPath) {
                if (isGuestCheckout) {
                    // Allow guest checkout
                    return true;
                } else {
                    // Redirect to sign-in for non-guest checkout
                    return NextResponse.redirect(new URL(`/sign-in?callbackUrl=${pathname}&message=Please sign in to continue with checkout`, request.nextUrl.origin));
                }
            }

            // Check for session cart cookie
            if (!request.cookies.get('sessionCartId')) {
                //Generate a new session cart id cookie
                const sessionCartId = crypto.randomUUID();
                // Clone the request headers and then create a NextResponse object and append the heders
                const newRequestHeaders = new Headers(request.headers);
                const response = NextResponse.next({
                    request: {
                        headers: newRequestHeaders
                    }
                })
                response.cookies.set('sessionCartId', sessionCartId);

                // Return the response with the sessionCartId set
                return response;
            } else { return true }

        },
        async signIn({ user, account, profile }) {
            return true // Accept all sign-ins
        },
    },
} satisfies NextAuthConfig

export const {
    handlers, auth, signIn, signOut
} = NextAuth(config)