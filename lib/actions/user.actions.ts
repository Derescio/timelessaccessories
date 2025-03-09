'use server';

import { signIn, signOut } from '@/auth';
// import { auth, signIn, signOut } from '@/auth';
import {  signInFormSchema, signUpFormSchema } from '@/lib/validators';
// import { shippingAddressSchema, signInFormSchema, signUpFormSchema, paymentMethodSchema } from '@/lib/validators';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { prisma } from '@/lib/db/config';
import { formatError } from '@/lib/utils';
import { hashSync } from 'bcrypt-ts-edge';
// import type { ShippingAddress } from '@/types';
// import { updateUserProfileSchema } from '@/lib/validators';

// import { z } from 'zod';
// import { PAGE_SIZE } from '@/lib/constants';
// import { revalidatePath } from 'next/cache';
// import { Prisma } from '@prisma/client';
//import { getMyCart } from './cart.actions';


export async function signInWithCredentials(formData: FormData) {
    try {
        const user = signInFormSchema.parse({
            email: formData.get('email'),
            password: formData.get('password'),
        });

        await signIn('credentials', user);
        return { success: true, message: 'Signed in successfully' };
    } catch (error) {
        if (isRedirectError(error)) {
            //const error = getRedirectError('/sign-in', RedirectType.replace, RedirectStatusCode.TemporaryRedirect);
            throw error;
            //redirect('/sign-in');
        }

        return { success: false, message: 'Invalid email or password' };
    }
}

export async function signOutUser() {
    // const currentCart = await getMyCart();
    // if (currentCart?.id) {
    //     await prisma.cart.delete({ where: { id: currentCart.id } });
    // } else {
    //     console.warn('No cart found for deletion.');
    // }
    await signOut();
}


//Sign up user
export async function signUp(prevState: unknown, formData: FormData) {
    try {
        const user = signUpFormSchema.parse({
            name: formData.get('name'),
            email: formData.get('email'),
            confirmPassword: formData.get('confirmPassword'),
            password: formData.get('password'),
        });

        const plainPassword = user.password;

        // user.password = hashSync(user.password, 10);
        user.password = hashSync(user.password, 10);
        await prisma.user.create({
            data: {
                name: user.name,
                email: user.email,
                password: user.password,
            },
        });

        await signIn('credentials', {
            email: user.email,
            password: plainPassword,
        });

        return { success: true, message: 'User created successfully' };
    } catch (error) {
        // console.log('Errors', error)
        // console.log('Error Name', error.name);
        // console.log('Error Code', error.code);
        // console.log('Error Errors', error.errors);
        // console.log('Error Meta ', error.meta?.target)
        if (isRedirectError(error)) {
            throw error;
        }

        return {
            success: false,
            message: formatError(error),
        };
    }
}


// Get user by id
export async function getUserById(userId: string) {
    const user = prisma.user.findUnique({
        where: {
            id: userId,
        },
    });
    if (!user) throw new Error('User not found');
    return user;
}

// Update user Address  
// export async function updateUserAddress(data: ShippingAddress) {
//     try {
//         const session = await auth();
//         const currentUser = await prisma.user.findFirst({
//             where: {
//                 id: session?.user?.id,
//             },
//         });
//         if (!currentUser) throw new Error('User not found');
//         const address = shippingAddressSchema.parse(data);
//         await prisma.user.update({
//             where: {
//                 id: currentUser.id,
//             },
//             data: {
//                 address: address,
//             },
//         });
//         return {
//             success: true,
//             message: 'Address updated successfully',
//         };
//     } catch (error) {
//         return {
//             success: false,
//             message: formatError(error),
//         };
//     }
// }

// Update user's payment method
// export async function updateUserPaymentMethod(
//     data: z.infer<typeof paymentMethodSchema>
// ) {
//     try {
//         const session = await auth();
//         const currentUser = await prisma.user.findFirst({
//             where: { id: session?.user?.id },
//         });
//         if (!currentUser) throw new Error('User not found');

//         const paymentMethod = paymentMethodSchema.parse(data);

//         await prisma.user.update({
//             where: { id: currentUser.id },
//             data: { paymentMethod: paymentMethod.type },
//         });

//         return {
//             success: true,
//             message: 'User updated successfully',
//         };
//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }

// Update user profile
// export async function updateUserProfile(user: {
//     name: string;
//     email: string;
// }) {
//     try {
//         const session = await auth();
//         const currentUser = await prisma.user.findFirst({
//             where: { id: session?.user?.id },
//         });
//         if (!currentUser) throw new Error('User not found');
//         //const user = updateUserSchema.parse(data)
//         await prisma.user.update({
//             where: { id: currentUser.id },
//             data: {
//                 name: user.name,
//                 // email: user.email,
//             },
//         })
//         return {
//             success: true,
//             message: 'User updated successfully',
//         }

//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }

// Get All Users
// export async function getAllUsers({
//     limit = PAGE_SIZE,
//     page,
//     query,
// }: {
//     limit?: number;
//     page: number;
//     query?: string;
// }) {
//     const queryFilter: Prisma.UserWhereInput = query && query !== 'all' ? { name: { contains: query, mode: 'insensitive' } as Prisma.StringFilter } : {}

//     const data = await prisma.user.findMany({
//         where: { ...queryFilter },
//         orderBy: { createdAt: 'desc' },
//         take: limit,
//         skip: (page - 1) * limit,
//     });

//     const dataCount = await prisma.user.count();

//     return {
//         data,
//         totalPages: Math.ceil(dataCount / limit),
//     };
// }
// Delete User
// export async function deleteUser(id: string) {
//     try {
//         await prisma.user.delete({ where: { id } });

//         revalidatePath('/admin/users');

//         return {
//             success: true,
//             message: 'User deleted successfully',
//         };
//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }


// export async function updateUser(user: z.infer<typeof updateUserProfileSchema>) {
//     try {
//         await prisma.user.update({
//             where: { id: user.id },
//             data: {
//                 name: user.name,
//                 role: user.role,
//             },
//         });

//         revalidatePath('/admin/users');

//         return {
//             success: true,
//             message: 'User updated successfully',
//         };
//     } catch (error) {
//         return { success: false, message: formatError(error) };
//     }
// }




// export async function revalidatePlaceOrder() {
//     revalidatePath("/place-order");
// }