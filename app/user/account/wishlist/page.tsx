"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, Loader2 } from "lucide-react"
import { getUserWishlist, removeFromWishlist } from "@/lib/actions/user.actions"
import { toast } from "sonner"
import { formatPrice } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface WishlistItem {
    id: string
    productId: string
    name: string
    slug: string
    category: string
    price: string
    originalPrice: string | null
    image: string
    hasDiscount: boolean
    discountPercentage: number
}

export default function WishlistPage() {
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [removingItem, setRemovingItem] = useState<string | null>(null)

    useEffect(() => {
        async function fetchWishlist() {
            try {
                setIsLoading(true)
                const data = await getUserWishlist()
                setWishlistItems(data)
            } catch (error) {
                console.error("Error fetching wishlist:", error)
                toast.error("Failed to load wishlist")
            } finally {
                setIsLoading(false)
            }
        }

        fetchWishlist()
    }, [])

    const handleRemoveFromWishlist = async (id: string) => {
        try {
            setRemovingItem(id)
            const result = await removeFromWishlist(id)

            if (result.success) {
                setWishlistItems(prev => prev.filter(item => item.id !== id))
                toast.success(result.message)
            } else {
                toast.error(result.message)
            }
        } catch (error) {
            console.error(`Error removing item ${id} from wishlist:`, error)
            toast.error("Failed to remove item from wishlist")
        } finally {
            setRemovingItem(null)
        }
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-light">WISHLIST</h1>

            {isLoading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : wishlistItems.length === 0 ? (
                <div className="bg-muted/30 rounded-lg p-12 text-center">
                    <h3 className="text-lg font-medium mb-2">Your wishlist is empty</h3>
                    <p className="text-gray-500 mb-6">Explore our products and add items to your wishlist.</p>
                    <Button asChild>
                        <Link href="/products">Browse Products</Link>
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {wishlistItems.map((item) => (
                        <div key={item.id} className="group">
                            <Link href={`/products/${item.slug}`} className="block">
                                <div className="relative aspect-[3/4] mb-4 bg-gray-100 rounded-lg overflow-hidden">
                                    <Image
                                        src={item.image || "/placeholder.svg"}
                                        alt={item.name}
                                        fill
                                        className="object-cover transition-transform duration-500 group-hover:scale-110"
                                    />
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault()
                                            handleRemoveFromWishlist(item.id)
                                        }}
                                        className="absolute top-4 right-4 p-2 bg-white rounded-full text-primary hover:bg-red-50 transition-colors"
                                        disabled={removingItem === item.id}
                                    >
                                        {removingItem === item.id ? (
                                            <Loader2 size={16} className="animate-spin" />
                                        ) : (
                                            <Heart size={16} fill="currentColor" />
                                        )}
                                    </button>
                                </div>
                            </Link>
                            <div className="space-y-1">
                                <div className="text-sm text-gray-600">{item.category}</div>
                                <Link href={`/products/${item.slug}`}>
                                    <h3 className="text-lg font-light group-hover:text-primary transition-colors">{item.name}</h3>
                                </Link>
                                <div className="flex items-center gap-2">
                                    <span className="font-normal">{formatPrice(parseFloat(item.price))}</span>
                                    {item.originalPrice && (
                                        <span className="text-sm text-gray-500 line-through">
                                            {formatPrice(parseFloat(item.originalPrice))}
                                        </span>
                                    )}
                                    {item.hasDiscount && item.discountPercentage > 0 && (
                                        <span className="text-sm font-medium text-green-600">
                                            -{item.discountPercentage}%
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

