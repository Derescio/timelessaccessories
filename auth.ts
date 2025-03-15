import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import {prisma} from '@/lib/db/config';
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
        //Reset to one minute for testing
        // maxAge: 60,
    },
    adapter: PrismaAdapter(prisma),

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
                const user = await prisma.user.findFirst({
                    where: {
                        email: credentials.email as string,
                        // password: credentials.password
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

                        return { id: user.id, email: user.email, name: user.name, role: user.role } as any
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

                if (trigger === 'signIn' || trigger === 'signUp') {
                    const cookiesObject = await cookies();
                    const sessionCartId = cookiesObject.get('sessionCartId')?.value;
                    //console.log(sessionCartId)

                    // if (sessionCartId) {
                    //     const sessionCart = await prisma.cart.findFirst({
                    //         where: { sessionCartId },
                    //     });
                    //     //console.log(sessionCart)
                    //     if (sessionCart) {
                    //         // Overwrite any existing user cart
                    //         await prisma.cart.deleteMany({
                    //             where: { userId: user.id },
                    //         });

                    //         // Assign the guest cart to the logged-in user
                    //         await prisma.cart.update({
                    //             where: { id: sessionCart.id },
                    //             data: { userId: user.id },
                    //         });
                    //     }
                    // }
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
                /\/shipping/,
                /\/payment-method/,
                /\/place-order/,
                /\/profile/,
                /\/user\/(.*)/,
                /\/order\/(.*)/,
                /\/admin/,
            ]
            // Check if the request path matches any of the excluded paths. Req URL OBject
            const pathname = request?.nextUrl?.pathname;
            // console.log(pathname)
            // const { pathname } = request?.nextUrl?.pathname;
            if (!auth && excludedPaths.some((p) => p.test(pathname))) return false;


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