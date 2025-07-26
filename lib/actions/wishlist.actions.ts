"use server";

import { db } from "@/lib/db";
import { auth } from "@/auth";

export async function toggleWishlist(productId: string) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return { 
                success: false, 
                error: "You need to be logged in to add items to your wishlist.",
                requiresAuth: true,
                isInWishlist: false 
            };
        }

        // Check if item is already in wishlist
        const existingWishlistItem = await db.productWishlist.findFirst({
            where: {
                userId: session.user.id,
                productId: productId,
            },
        });

        if (existingWishlistItem) {
            // Remove from wishlist
            await db.productWishlist.delete({
                where: {
                    id: existingWishlistItem.id,
                },
            });
            return { success: true, isInWishlist: false };
        } else {
            // Add to wishlist
            await db.productWishlist.create({
                data: {
                    userId: session.user.id,
                    productId: productId,
                },
            });
            return { success: true, isInWishlist: true };
        }
    } catch (error) {
        console.error("Error toggling wishlist:", error);
        return { 
            success: false, 
            error: "Failed to update wishlist",
            isInWishlist: false 
        };
    }
}

export async function getWishlistStatus(productId: string) {
    try {
        const session = await auth();
        
        if (!session?.user?.id) {
            return { isInWishlist: false };
        }

        const wishlistItem = await db.productWishlist.findFirst({
            where: {
                userId: session.user.id,
                productId: productId,
            },
        });

        return { isInWishlist: !!wishlistItem };
    } catch (error) {
        console.error("Error checking wishlist status:", error);
        return { isInWishlist: false };
    }
} 