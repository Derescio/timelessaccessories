'use server'

import { db } from "@/lib/db"
import { insertReviewSchema } from "@/lib/validators"
import { z } from "zod"
import { formatError } from "@/lib/utils"
import { auth } from "@/auth"
import { revalidatePath } from "next/cache"

//Create and Update Review

export async function createUpdateReview(data: z.infer<typeof insertReviewSchema>) {

    const session = await auth()
    const user = session?.user?.id



    try {
        if (!user) {
            return { success: false, message: 'You are not Authorized' }
        }
        //Validate Fields
        const validatedFields = insertReviewSchema.safeParse({ ...data, userId: user })
        if (!validatedFields.success) {
            return { error: "Invalid fields" }
        }

        //Check Product
        const product = await db.product.findUnique({
            where: { id: validatedFields.data.productId }
        })
        if (!product) throw new Error('Product not found')

        //check if user has already reviewed the product
        const reviewExists = await db.review.findFirst({
            where: {
                productId: validatedFields.data.productId,
                userId: user
            }
        })
        //Update or Create Review
        await db.$transaction(async (tx) => {
            if (reviewExists) {
                await tx.review.update({
                    where: { id: reviewExists.id },
                    data: {
                        title: validatedFields.data.title,
                        content: validatedFields.data.description,
                        rating: validatedFields.data.rating
                    }
                })
                // return {success: true , message: 'Review updated successfully'}
            } else {
                const { description, ...rest } = validatedFields.data;
                await tx.review.create({
                    data: {
                        ...rest,
                        content: description
                    }
                })
            }
            //Get Average Rating
            const averageRating = await tx.review.aggregate({
                _avg: {
                    rating: true
                },
                where: {
                    productId: validatedFields.data.productId
                }
            })
            //Get Number of Reviews
            const numberOfReviews = await tx.review.count({
                where: {
                    productId: validatedFields.data.productId
                }
            })

            //Update Rating and NumReviews in Product Table
            await tx.product.update({
                where: { id: validatedFields.data.productId },
                data: {
                    rating: averageRating._avg.rating || 0,
                    numReviews: numberOfReviews
                }
            })
        })
        revalidatePath(`/products/${product.slug}`)
        return { success: true, message: 'Review updated successfully' }
    } catch (error) {
        return { success: false, message: formatError(error) }
    }

}


//Get All Reviews for a Product
export async function getAllReviews({ productId }: { productId: string }) {
    const reviews = await db.review.findMany({
        where: { productId },
        include: {
            user: {
                select: {
                    name: true
                }
            }
        },
        orderBy: {
            createdAt: 'desc'
        }
    })
    return reviews
}

//Get All Reviews for a User
export async function getAllReviewsForUser({ productId, }: { productId: string }) {
    const session = await auth();
    if (!session) throw new Error('User is not authenticated');

    return await db.review.findFirst({
        where: { productId, userId: session?.user.id },
    });
};

//Get only Reviews for a verifed purchase
// export async function getVerifiedReviews({ productId }: { productId: string }) {
//     const session = await auth();
//     if (!session) return false

//     const hasPurchased = await db.orderItem.findFirst({
//         where: {
//             productId,
//             order: {
//                 userId: session?.user.id,
//                 //Either shipped, processing or delivered
//                 status: {
//                     in: ['SHIPPED', 'PROCESSING', 'DELIVERED']
//                 }
//             },
//         },
//     })
//     return !!hasPurchased
// }

export async function getVerifiedReviews({ productId, userId, userEmail }: {
    productId: string,
    userId?: string,
    userEmail?: string
}) {
    try {
        if (!userId && !userEmail) {
            return false;
        }

        // Check for purchases by both userId and email
        const order = await db.order.findFirst({
            where: {
                AND: [
                    {
                        OR: [
                            // Authenticated user orders
                            { userId: userId },
                            // Guest orders with matching email
                            {
                                AND: [
                                    { guestEmail: userEmail },
                                    { userId: null } // Ensure it's a guest order
                                ]
                            }
                        ]
                    },
                    {
                        items: {
                            some: {
                                productId: productId
                            }
                        }
                    },
                    // Only count completed orders
                    {
                        status: {
                            in: ['PROCESSING', 'SHIPPED', 'DELIVERED']
                        }
                    }
                ]
            },
            select: { id: true }
        });

        return !!order;
    } catch (error) {
        console.error('Error checking verified purchase:', error);
        return false;
    }
}

