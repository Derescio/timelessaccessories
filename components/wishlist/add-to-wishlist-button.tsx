"use client"

import { useState, useEffect } from "react"
import { Heart, Loader2 } from "lucide-react"
import { addToWishlist, removeFromWishlist, isInWishlist, getUserWishlist } from "@/lib/actions/user.actions"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"

interface AddToWishlistButtonProps {
    productId: string
    withText?: boolean
    variant?: "icon" | "button"
    className?: string
}

interface WishlistItem {
    id: string;
    productId: string;
    userId: string;
}

export default function AddToWishlistButton({
    productId,
    withText = false,
    variant = "icon",
    className
}: AddToWishlistButtonProps) {
    const [isInWishlist, setIsInWishlist] = useState(false)
    const [wishlistItemId, setWishlistItemId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isChecking, setIsChecking] = useState(true)
    const router = useRouter()

    useEffect(() => {
        const checkWishlistStatus = async () => {
            try {
                setIsChecking(true)
                // If it's in the wishlist, get the wishlist item ID
                const wishlistItems = await getUserWishlist()
                const foundItem = wishlistItems.find((item: WishlistItem) => item.productId === productId)
                if (foundItem) {
                    setWishlistItemId(foundItem.id)
                    setIsInWishlist(true)
                }
            } catch (error) {
                console.error("Error checking wishlist status:", error)
            } finally {
                setIsChecking(false)
            }
        }

        if (productId) {
            checkWishlistStatus()
        }
    }, [productId])

    const handleToggleWishlist = async () => {
        try {
            setIsLoading(true)

            if (isInWishlist && wishlistItemId) {
                // Remove from wishlist
                await removeFromWishlist(wishlistItemId)
                setIsInWishlist(false)
                setWishlistItemId(null)
                toast.success("Item removed from wishlist")
            } else {
                // Add to wishlist
                await addToWishlist(productId)
                // Refresh to get the wishlist item ID
                const wishlistItems = await getUserWishlist()
                const foundItem = wishlistItems.find((item: WishlistItem) => item.productId === productId)
                if (foundItem) {
                    setWishlistItemId(foundItem.id)
                    setIsInWishlist(true)
                }
                toast.success("Item added to wishlist")
            }
        } catch (error) {
            console.error("Error toggling wishlist:", error)
            toast.error("Failed to update wishlist")
        } finally {
            setIsLoading(false)
        }
    }

    if (isChecking) {
        return variant === "icon" ? (
            <div className={cn("p-2 rounded-full", className)}>
                <Loader2 size={20} className="animate-spin text-gray-400" />
            </div>
        ) : (
            <Button
                variant="outline"
                size="sm"
                disabled
                className={className}
            >
                <Loader2 size={16} className="animate-spin mr-2" />
                {withText && "Checking..."}
            </Button>
        )
    }

    if (variant === "icon") {
        return (
            <button
                type="button"
                onClick={handleToggleWishlist}
                disabled={isLoading}
                className={cn(
                    "p-2 bg-white rounded-full transition-colors",
                    isInWishlist ? "text-red-500" : "text-gray-500 hover:text-red-500",
                    className
                )}
                aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
                {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
                )}
            </button>
        )
    }

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={handleToggleWishlist}
            disabled={isLoading}
            className={cn(
                isInWishlist ? "text-red-500 border-red-200 hover:bg-red-50" : "",
                className
            )}
        >
            {isLoading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
                <Heart size={16} className="mr-2" fill={isInWishlist ? "currentColor" : "none"} />
            )}
            {withText && (isInWishlist ? "Remove from Wishlist" : "Add to Wishlist")}
        </Button>
    )
} 