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

export default function AddToWishlistButton({
    productId,
    withText = false,
    variant = "icon",
    className
}: AddToWishlistButtonProps) {
    const [inWishlist, setInWishlist] = useState(false)
    const [wishlistItemId, setWishlistItemId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isChecking, setIsChecking] = useState(true)
    const router = useRouter()

    useEffect(() => {
        async function checkWishlistStatus() {
            try {
                setIsChecking(true)
                const isInList = await isInWishlist(productId)
                setInWishlist(isInList)

                if (isInList) {
                    // If it's in the wishlist, get the wishlist item ID
                    const wishlistItems = await getUserWishlist()
                    const item = wishlistItems.find(item => item.productId === productId)
                    if (item) {
                        setWishlistItemId(item.id)
                    }
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

            if (inWishlist && wishlistItemId) {
                // Remove item from wishlist
                const result = await removeFromWishlist(wishlistItemId)

                if (result.success) {
                    setInWishlist(false)
                    setWishlistItemId(null)
                    toast.success(result.message)
                } else {
                    toast.error(result.message)
                }
                return
            }

            const result = await addToWishlist(productId)

            if (result.success) {
                setInWishlist(true)
                // Refresh to get the wishlist item ID
                const wishlistItems = await getUserWishlist()
                const item = wishlistItems.find(item => item.productId === productId)
                if (item) {
                    setWishlistItemId(item.id)
                }
                toast.success(result.message)
            } else {
                // Check if the error is due to authentication
                if (result.message === 'You must be logged in to add items to your wishlist.') {
                    // Show toast with action to sign in
                    toast.error("Please sign in to save items to your wishlist", {
                        action: {
                            label: "Sign In",
                            onClick: () => router.push(`/sign-in?callbackUrl=${encodeURIComponent(window.location.pathname)}`)
                        },
                        duration: 5000,
                    })
                } else {
                    toast.error(result.message)
                }
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
                    inWishlist ? "text-red-500" : "text-gray-500 hover:text-red-500",
                    className
                )}
                aria-label={inWishlist ? "Remove from wishlist" : "Add to wishlist"}
            >
                {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                ) : (
                    <Heart size={20} fill={inWishlist ? "currentColor" : "none"} />
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
                inWishlist ? "text-red-500 border-red-200 hover:bg-red-50" : "",
                className
            )}
        >
            {isLoading ? (
                <Loader2 size={16} className="animate-spin mr-2" />
            ) : (
                <Heart size={16} className="mr-2" fill={inWishlist ? "currentColor" : "none"} />
            )}
            {withText && (inWishlist ? "Remove from Wishlist" : "Add to Wishlist")}
        </Button>
    )
} 