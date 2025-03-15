'use server';

import { auth, signIn, signOut } from '@/auth';
// import { auth, signIn, signOut } from '@/auth';
import {  signInFormSchema, signUpFormSchema, updateUserSchema , changePasswordSchema} from '@/lib/validators';
// import { shippingAddressSchema, signInFormSchema, signUpFormSchema, paymentMethodSchema } from '@/lib/validators';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { prisma } from '@/lib/db/config';
import { formatError } from '@/lib/utils';
import { compareSync, hashSync } from 'bcrypt-ts-edge';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
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
        revalidatePath('/', 'layout');
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


export async function getUserProfile() {
    try {
        const session = await auth();
        if (!session?.user?.id) return null;

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                role: true,
                emailVerified: true,
            },
        });

        return user;
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
}

// export async function updateProfile(data: z.infer<typeof updateUserSchema>) {
//     try {
//         const session = await auth();
//         if (!session?.user?.id) {
//             return { success: false, message: 'Not authenticated' };
//         }

//         const validatedData = updateUserSchema.parse(data);

//         await prisma.user.update({
//             where: { id: session.user.id },
//             data: {
//                 name: validatedData.name,
//                 // Only update email if it's different and implement email verification
//                 // email: validatedData.email, 
//             },
//         });

//         revalidatePath('/user/account');
//         revalidatePath('/user/account/acct-details');

//         return { success: true, message: 'Profile updated successfully' };
//     } catch (error) {
//         if (error instanceof z.ZodError) {
//             return { success: false, message: 'Invalid data provided' };
//         }
//         console.error('Error updating profile:', error);
//         return { success: false, message: 'Failed to update profile' };
//     }
// }



export async function updateProfile(data: z.infer<typeof updateUserSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated' };
        }
        const currentUser = await prisma.user.findUnique({
            where: { id: session?.user?.id },
            // select: {
            //     name: true,
            //     email: true,
            // },
        });
        if (!currentUser) {
            return { success: false, message: 'User not found' };
        }

        console.log('data', data)
        const validatedData = updateUserSchema.parse(data);
        console.log('validatedData', validatedData)

        await prisma.user.update({
            where: { id:currentUser.id },
            data: {
                name: validatedData.name,
                // Only update email if it's different and implement email verification
                // email: validatedData.email, 
            },
        });

        revalidatePath('/user/account');
        revalidatePath('/user/account/acct-details');

        return { success: true, message: 'Profile updated successfully' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid data provided' };
        }
        console.error('Error updating profile:', error);
        return { success: false, message: 'Failed to update profile' };
    }
}

export async function changePassword(data: z.infer<typeof changePasswordSchema>) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated' };
        }

        const validatedData = changePasswordSchema.parse(data);
        
        // Get current user with password
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { password: true }
        });
        
        if (!user?.password) {
            return { success: false, message: 'Cannot change password for OAuth accounts' };
        }
        
        // Verify current password
        const isPasswordValid = compareSync(validatedData.currentPassword, user.password);
        if (!isPasswordValid) {
            return { success: false, message: 'Current password is incorrect' };
        }
        
        // Hash new password and update
        const hashedPassword = hashSync(validatedData?.newPassword || '', 10);
        await prisma.user.update({
            where: { id: session.user.id },
            data: { password: hashedPassword }
        });
        
        // Sign out all sessions for security
        //await signOut({ redirect: false });
        revalidatePath('/user/account');
        revalidatePath('/user/account/acct-details');
        
        return { success: true, message: 'Password changed successfully. Please sign in again.' };
    } catch (error) {
        if (error instanceof z.ZodError) {
            return { success: false, message: 'Invalid data provided' };
        }
        console.error('Error changing password:', error);
        return { success: false, message: 'Failed to change password' };
    }
}

export async function getUserAddresses() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const addresses = await prisma.address.findMany({
            where: { userId: session.user.id },
        });

        return addresses;
    } catch (error) {
        console.error('Error fetching addresses:', error);
        return [];
    }
}


export async function getUserOrders() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const orders = await prisma.order.findMany({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: true,
                        inventory: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        return orders;
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}