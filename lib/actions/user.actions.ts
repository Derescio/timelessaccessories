'use server';

import { auth, signIn, signOut } from '@/auth';
import { signInFormSchema, signUpFormSchema, updateUserSchema, changePasswordSchema } from '@/lib/validators';
// import { shippingAddressSchema , paymentMethodSchema } from '@/lib/validators';
import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { prisma } from '@/lib/prisma';
import { formatError } from '@/lib/utils';
import { compareSync, hashSync } from 'bcrypt-ts-edge';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { getCart } from './cart.actions';
// import { db } from "@/lib/db"
// import type { ShippingAddress } from '@/types';
// import { updateUserProfileSchema } from '@/lib/validators';

// import { z } from 'zod';
// import { PAGE_SIZE } from '@/lib/constants';
// import { revalidatePath } from 'next/cache';
// import { Prisma } from '@prisma/client';
//import { getMyCart } from './cart.actions';


export async function signInWithCredentials(prevState: unknown, formData: FormData) {
    try {
        const user = signInFormSchema.parse({
            email: formData.get('email'),
            password: formData.get('password'),
        });

        // Get the callbackUrl from form data
        const callbackUrl = formData.get('callbackUrl')?.toString() || '/';

        // Pass the callbackUrl to signIn function
        await signIn('credentials', {
            ...user,
            redirectTo: callbackUrl
        });

        revalidatePath('/');
        return { success: true, message: 'Signed in successfully' };
    } catch (error) {
        if (isRedirectError(error)) {
            throw error;
        }

        return { success: false, message: 'Invalid email or password' };
    }
}

export async function signOutUser() {
    try {
        const currentCart = await getCart();
        console.log(currentCart?.id);
        if (currentCart?.id) {
            await prisma.cart.delete({ where: { id: currentCart.id } });
            console.log('Cart deleted successfully during sign out');
        } else {
            console.warn('No cart found for deletion during sign out.');
        }
        await signOut();
        console.log('User signed out successfully');
    } catch (error) {
        console.error('Error during sign out:', error);
        // Still try to sign out even if cart deletion fails
        await signOut();
    }
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

//get user address
export async function getUserAddress() {
    const session = await auth();
    const currentUser = session?.user.id;
    const address = await prisma.address.findFirst({
        where: {
            userId: currentUser,
        },
    });
    return address;
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
    // console.log(data)
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

        //console.log('data', data)
        const validatedData = updateUserSchema.parse(data);
        // console.log('validatedData', validatedData)

        await prisma.user.update({
            where: { id: currentUser.id },
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

// Get all user addresses (only user-managed ones)
export async function getUserAddresses() {
    try {
        const session = await auth();

        if (!session?.user) {
            console.log("No user session found");
            return [];
        }

        const userId = session.user.id;

        // Only get addresses that were explicitly created in the address management UI
        // or have been specifically marked as user-managed
        const addresses = await prisma.address.findMany({
            where: {
                userId,
                isUserManaged: true // Only get addresses explicitly managed by the user
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log("Retrieved user-managed addresses:", addresses.length);

        return addresses;
    } catch (error) {
        console.error("Error fetching user addresses:", error);
        return [];
    }
}


export async function getUserOrders() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id,
                payment: {
                    status: 'COMPLETED'
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                            }
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                                retailPrice: true,
                                compareAtPrice: true,
                                hasDiscount: true,
                                discountPercentage: true,
                                images: true,
                            }
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        provider: true,
                        amount: true,
                        lastUpdated: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Serialize each order individually with deep property conversion
        return orders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: order.subtotal.toString(),
            tax: order.tax.toString(),
            shipping: order.shipping.toString(),
            total: order.total.toString(),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            addressId: order.addressId,
            // Convert JSON to string if exists, otherwise null
            billingAddress: order.billingAddress ? JSON.stringify(order.billingAddress) : null,
            shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
            paymentIntent: order.paymentIntent,
            notes: order.notes,
            cartId: order.cartId,
            // Map over items with deep serialization
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price.toString(),
                name: item.name,
                image: item.image,
                // Serialize the product to only include basic properties
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    description: item.product.description,
                },
                // Serialize the inventory to only include necessary properties
                inventory: {
                    id: item.inventory.id,
                    sku: item.inventory.sku,
                    retailPrice: item.inventory.retailPrice.toString(),
                    compareAtPrice: item.inventory.compareAtPrice ? item.inventory.compareAtPrice.toString() : null,
                    hasDiscount: item.inventory.hasDiscount,
                    discountPercentage: item.inventory.discountPercentage,
                    images: item.inventory.images,
                }
            })),
            // Handle payment serialization
            payment: order.payment ? {
                id: order.payment.id,
                status: order.payment.status,
                provider: order.payment.provider,
                amount: order.payment.amount.toString(),
                lastUpdated: order.payment.lastUpdated.toISOString(),
            } : null
        }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}
export async function getLascoUserOrders() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        const orders = await prisma.order.findMany({
            where: {
                userId: session.user.id,
                payment: {
                    provider: 'LascoPay'
                }
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                            }
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                                retailPrice: true,
                                compareAtPrice: true,
                                hasDiscount: true,
                                discountPercentage: true,
                                images: true,
                            }
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        provider: true,
                        amount: true,
                        lastUpdated: true,
                    }
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Serialize each order individually with deep property conversion
        return orders.map(order => ({
            id: order.id,
            status: order.status,
            subtotal: order.subtotal.toString(),
            tax: order.tax.toString(),
            shipping: order.shipping.toString(),
            total: order.total.toString(),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            addressId: order.addressId,
            // Convert JSON to string if exists, otherwise null
            billingAddress: order.billingAddress ? JSON.stringify(order.billingAddress) : null,
            shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
            paymentIntent: order.paymentIntent,
            notes: order.notes,
            cartId: order.cartId,
            // Map over items with deep serialization
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price.toString(),
                name: item.name,
                image: item.image,
                // Serialize the product to only include basic properties
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    description: item.product.description,
                },
                // Serialize the inventory to only include necessary properties
                inventory: {
                    id: item.inventory.id,
                    sku: item.inventory.sku,
                    retailPrice: item.inventory.retailPrice.toString(),
                    compareAtPrice: item.inventory.compareAtPrice ? item.inventory.compareAtPrice.toString() : null,
                    hasDiscount: item.inventory.hasDiscount,
                    discountPercentage: item.inventory.discountPercentage,
                    images: item.inventory.images,
                }
            })),
            // Handle payment serialization
            payment: order.payment ? {
                id: order.payment.id,
                status: order.payment.status,
                provider: order.payment.provider,
                amount: order.payment.amount.toString(),
                lastUpdated: order.payment.lastUpdated.toISOString(),
            } : null
        }));
    } catch (error) {
        console.error('Error fetching orders:', error);
        return [];
    }
}

export async function getOrderById(orderId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'Not authenticated', data: null };
        }

        const order = await prisma.order.findUnique({
            where: {
                id: orderId,
                userId: session.user.id // Ensure order belongs to current user
            },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                description: true,
                            }
                        },
                        inventory: {
                            select: {
                                id: true,
                                sku: true,
                                retailPrice: true,
                                compareAtPrice: true,
                                hasDiscount: true,
                                discountPercentage: true,
                                images: true,
                            }
                        },
                    },
                },
                payment: {
                    select: {
                        id: true,
                        status: true,
                        provider: true,
                        amount: true,
                        lastUpdated: true,
                    }
                },
                address: {
                    select: {
                        id: true,
                        street: true,
                        city: true,
                        state: true,
                        postalCode: true,
                        country: true,
                    }
                },
            },
        });

        if (!order) {
            return { success: false, message: 'Order not found', data: null };
        }

        // Make the response serializable with carefully controlled properties
        const serializedOrder = {
            id: order.id,
            status: order.status,
            subtotal: order.subtotal.toString(),
            tax: order.tax.toString(),
            shipping: order.shipping.toString(),
            total: order.total.toString(),
            createdAt: order.createdAt.toISOString(),
            updatedAt: order.updatedAt.toISOString(),
            addressId: order.addressId,
            // Convert JSON to string if exists, otherwise null
            billingAddress: order.billingAddress ? JSON.stringify(order.billingAddress) : null,
            shippingAddress: order.shippingAddress ? JSON.stringify(order.shippingAddress) : null,
            paymentIntent: order.paymentIntent,
            notes: order.notes,
            cartId: order.cartId,
            // Map over items with deep serialization
            items: order.items.map(item => ({
                id: item.id,
                quantity: item.quantity,
                price: item.price.toString(),
                name: item.name,
                image: item.image,
                // Only include necessary product properties
                product: {
                    id: item.product.id,
                    name: item.product.name,
                    slug: item.product.slug,
                    description: item.product.description,
                },
                // Only include necessary inventory properties
                inventory: {
                    id: item.inventory.id,
                    sku: item.inventory.sku,
                    retailPrice: item.inventory.retailPrice.toString(),
                    compareAtPrice: item.inventory.compareAtPrice ? item.inventory.compareAtPrice.toString() : null,
                    hasDiscount: item.inventory.hasDiscount,
                    discountPercentage: item.inventory.discountPercentage,
                    images: item.inventory.images,
                }
            })),
            // Handle payment serialization
            payment: order.payment ? {
                id: order.payment.id,
                status: order.payment.status,
                provider: order.payment.provider,
                amount: order.payment.amount.toString(),
                lastUpdated: order.payment.lastUpdated.toISOString(),
            } : null,
            // Include address data if available
            address: order.address ? {
                id: order.address.id,
                street: order.address.street,
                city: order.address.city,
                state: order.address.state,
                postalCode: order.address.postalCode,
                country: order.address.country,
            } : null,
        };

        return { success: true, message: 'Order retrieved successfully', data: serializedOrder };
    } catch (error) {
        console.error('Error fetching order details:', error);
        return { success: false, message: 'Failed to retrieve order', data: null };
    }
}

export async function getOrderStatusActions(status: string, paymentStatus: string | null) {
    switch (status) {
        case 'PENDING':
            return {
                message: 'Your order has been received and is being processed.',
                action: 'Check back later for updates on your order.',
                cta: paymentStatus === 'PENDING' ? 'Complete Payment' : null,
                ctaLink: paymentStatus === 'PENDING' ? '/checkout/payment' : null,
            };
        case 'PROCESSING':
            return {
                message: 'Your order is being processed and prepared for shipment.',
                action: 'We\'ll notify you once your order ships.',
                cta: null,
                ctaLink: null,
            };
        case 'SHIPPED':
            return {
                message: 'Your order has been shipped!',
                action: 'Track your package to see when it will arrive.',
                cta: 'Track Order',
                ctaLink: '/tracking',
            };
        case 'DELIVERED':
            return {
                message: 'Your order has been delivered.',
                action: 'If you\'re satisfied with your purchase, please consider leaving a review.',
                cta: 'Leave a Review',
                ctaLink: '/reviews/new',
            };
        case 'CANCELLED':
            return {
                message: 'Your order has been cancelled.',
                action: 'If you have any questions, please contact customer support.',
                cta: 'Contact Support',
                ctaLink: '/support',
            };
        default:
            return {
                message: 'Order status updated.',
                action: 'Check back for more updates.',
                cta: null,
                ctaLink: null,
            };
    }
}

export async function createOrUpdateUserAddress(addressData: {
    fullName?: string;
    street: string;
    city: string;
    state: string;
    postalCode?: string | null;
    country: string;
    isUserManaged?: boolean; // Add optional parameter to control if address is user-managed
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            console.error("User not authenticated");
            return { success: false, message: "You must be logged in to save an address" };
        }

        const userId = session.user.id;

        console.log("Creating/updating address for user:", userId, "with data:", addressData);

        // Check if user already has an address with same data to avoid duplicates
        const existingAddresses = await prisma.address.findMany({
            where: {
                userId,
                street: addressData.street,
                city: addressData.city,
                country: addressData.country
            },
        });

        let address;

        // Default to false for checkout-created addresses
        const isUserManaged = addressData.isUserManaged ?? false;

        if (existingAddresses.length > 0) {
            // Update the first matching address
            address = await prisma.address.update({
                where: { id: existingAddresses[0].id },
                data: {
                    street: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    postalCode: addressData.postalCode || "",
                    country: addressData.country,
                    // Only update isUserManaged to true if explicitly requested,
                    // don't override existing user-managed addresses
                    ...(isUserManaged ? { isUserManaged: true } : {}),
                    updatedAt: new Date()
                }
            });
            console.log("Updated existing address:", address.id);
        } else {
            // Create a new address
            address = await prisma.address.create({
                data: {
                    userId,
                    street: addressData.street,
                    city: addressData.city,
                    state: addressData.state,
                    postalCode: addressData.postalCode || "",
                    country: addressData.country,
                    isUserManaged// Set explicitly for new addresses
                }
            });
            console.log("Created new address:", address.id);
        }

        return {
            success: true,
            message: "Address saved successfully",
            data: address
        };
    } catch (error) {
        console.error("Error saving address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Function to get the first address for a user (or null if none exists)
export async function getUserPrimaryAddress() {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            console.log("No user session found");
            return null;
        }

        const userId = session.user.id;

        const address = await prisma.address.findFirst({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });

        return address;
    } catch (error) {
        console.error("Error fetching user's primary address:", error);
        return null;
    }
}

// Add this new function to create a new address
export async function addUserAddress(addressData: {
    street: string;
    city: string;
    state: string;
    postalCode?: string | null;
    country: string;
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to add an address" };
        }

        const userId = session.user.id;

        const address = await prisma.address.create({
            data: {
                userId,
                street: addressData.street,
                city: addressData.city,
                state: addressData.state,
                postalCode: addressData.postalCode || "",
                country: addressData.country,
                isUserManaged: true // Mark as explicitly managed by the user
            }
        });

        return {
            success: true,
            message: "Address added successfully",
            data: address
        };
    } catch (error) {
        console.error("Error adding address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Update existing address
export async function updateUserAddress(addressId: string, addressData: {
    street: string;
    city: string;
    state: string;
    postalCode?: string | null;
    country: string;
}) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to update an address" };
        }

        // Check if address belongs to user
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return { success: false, message: "Address not found or does not belong to you" };
        }

        const address = await prisma.address.update({
            where: { id: addressId },
            data: {
                street: addressData.street,
                city: addressData.city,
                state: addressData.state,
                postalCode: addressData.postalCode || "",
                country: addressData.country,
                isUserManaged: true, // Ensure it's marked as user-managed
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            message: "Address updated successfully",
            data: address
        };
    } catch (error) {
        console.error("Error updating address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Delete an address
export async function deleteUserAddress(addressId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to delete an address" };
        }

        const userId = session.user.id;

        // Verify the address belongs to the user
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId
            }
        });

        if (!existingAddress) {
            return { success: false, message: "Address not found" };
        }

        await prisma.address.delete({
            where: { id: addressId }
        });

        return {
            success: true,
            message: "Address deleted successfully"
        };
    } catch (error) {
        console.error("Error deleting address:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}

// Get user's wishlist items
export async function getUserWishlist() {
    try {
        const session = await auth();
        if (!session?.user?.id) return [];

        // First get or create the user's wishlist
        let wishlist = await prisma.wishlist.findUnique({
            where: { userId: session.user.id },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                id: true,
                                name: true,
                                slug: true,
                                categoryId: true,
                                inventories: {
                                    where: { isDefault: true },
                                    select: {
                                        id: true,
                                        retailPrice: true,
                                        compareAtPrice: true,
                                        hasDiscount: true,
                                        discountPercentage: true,
                                        images: true,
                                    },
                                    take: 1
                                },
                                category: {
                                    select: {
                                        name: true
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        if (!wishlist) {
            // Create a new wishlist for the user if it doesn't exist
            wishlist = await prisma.wishlist.create({
                data: {
                    userId: session.user.id,
                },
                include: {
                    items: {
                        include: {
                            product: {
                                select: {
                                    id: true,
                                    name: true,
                                    slug: true,
                                    categoryId: true,
                                    inventories: {
                                        where: { isDefault: true },
                                        select: {
                                            id: true,
                                            retailPrice: true,
                                            compareAtPrice: true,
                                            hasDiscount: true,
                                            discountPercentage: true,
                                            images: true,
                                        },
                                        take: 1
                                    },
                                    category: {
                                        select: {
                                            name: true
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            });
        }

        // Format the wishlist items for the frontend
        return wishlist.items.map(item => {
            const inventory = item.product.inventories[0]; // Default inventory
            const price = inventory?.retailPrice;
            const compareAtPrice = inventory?.hasDiscount ? inventory.compareAtPrice : null;

            return {
                id: item.id,
                productId: item.product.id,
                name: item.product.name,
                slug: item.product.slug,
                category: item.product.category?.name || "Uncategorized",
                price: price ? price.toString() : "0",
                originalPrice: compareAtPrice ? compareAtPrice.toString() : null,
                image: inventory?.images?.[0] || "/placeholder.svg",
                hasDiscount: inventory?.hasDiscount || false,
                discountPercentage: inventory?.discountPercentage || 0
            };
        });
    } catch (error) {
        console.error('Error fetching wishlist:', error);
        return [];
    }
}

// Add an item to the wishlist
export async function addToWishlist(productId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'You must be logged in to add items to your wishlist.' };
        }

        // Check if product exists
        const product = await prisma.product.findUnique({
            where: { id: productId }
        });

        if (!product) {
            return { success: false, message: 'Product not found.' };
        }

        // Get or create wishlist
        let wishlist = await prisma.wishlist.findUnique({
            where: { userId: session.user.id }
        });

        if (!wishlist) {
            wishlist = await prisma.wishlist.create({
                data: {
                    userId: session.user.id
                }
            });
        }

        // Check if item is already in wishlist
        const existingItem = await prisma.wishlistItem.findFirst({
            where: {
                wishlistId: wishlist.id,
                productId
            }
        });

        if (existingItem) {
            return { success: true, message: 'Item is already in your wishlist.' };
        }

        // Add item to wishlist
        await prisma.wishlistItem.create({
            data: {
                wishlistId: wishlist.id,
                productId
            }
        });

        return { success: true, message: 'Item added to wishlist successfully.' };
    } catch (error) {
        console.error('Error adding to wishlist:', error);
        return { success: false, message: formatError(error) };
    }
}

// Remove an item from the wishlist
export async function removeFromWishlist(wishlistItemId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return { success: false, message: 'You must be logged in to remove items from your wishlist.' };
        }

        // Verify the item belongs to the user's wishlist
        const item = await prisma.wishlistItem.findUnique({
            where: { id: wishlistItemId },
            include: {
                wishlist: true
            }
        });

        if (!item) {
            return { success: false, message: 'Wishlist item not found.' };
        }

        if (item.wishlist.userId !== session.user.id) {
            return { success: false, message: 'You do not have permission to remove this item.' };
        }

        // Remove the item
        await prisma.wishlistItem.delete({
            where: { id: wishlistItemId }
        });

        return { success: true, message: 'Item removed from wishlist successfully.' };
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        return { success: false, message: formatError(error) };
    }
}

// Check if a product is in the user's wishlist
export async function isInWishlist(productId: string) {
    try {
        const session = await auth();
        if (!session?.user?.id) return false;

        const wishlist = await prisma.wishlist.findUnique({
            where: { userId: session.user.id }
        });

        if (!wishlist) return false;

        const item = await prisma.wishlistItem.findFirst({
            where: {
                wishlistId: wishlist.id,
                productId
            }
        });

        return !!item;
    } catch (error) {
        console.error('Error checking wishlist:', error);
        return false;
    }
}

// Add this new function to mark an address as user-managed
export async function markAddressAsUserManaged(addressId: string) {
    try {
        const session = await auth();

        if (!session?.user?.id) {
            return { success: false, message: "You must be logged in to manage addresses" };
        }

        // Check if address belongs to user
        const existingAddress = await prisma.address.findFirst({
            where: {
                id: addressId,
                userId: session.user.id
            }
        });

        if (!existingAddress) {
            return { success: false, message: "Address not found or does not belong to you" };
        }

        // Update address to mark as user-managed
        const address = await prisma.address.update({
            where: { id: addressId },
            data: {
                isUserManaged: true,
                updatedAt: new Date()
            }
        });

        return {
            success: true,
            message: "Address marked as user-managed successfully",
            data: address
        };
    } catch (error) {
        console.error("Error marking address as user-managed:", error);
        return {
            success: false,
            message: formatError(error)
        };
    }
}