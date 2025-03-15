"use client"

import Image from "next/image"
import Link from "next/link"
import { Heart } from "lucide-react"

interface WishlistItem {
    id: string
    name: string
    category: string
    price: number
    originalPrice?: number
    image: string
}

const wishlistItems: WishlistItem[] = [
    {
        id: "1",
        name: "Colorful Jacket",
        category: "Dresses",
        price: 29,
        image: "/placeholder.svg?height=400&width=300&text=Colorful+Jacket",
    },
    {
        id: "2",
        name: "Shirt in Botanical Cheetah Print",
        category: "Dresses",
        price: 62,
        image: "/placeholder.svg?height=400&width=300&text=Botanical+Shirt",
    },
    {
        id: "3",
        name: "Cotton Jersey T-Shirt",
        category: "Dresses",
        price: 17,
        image: "/placeholder.svg?height=400&width=300&text=Cotton+TShirt",
    },
    {
        id: "4",
        name: "Zessi Dresses",
        category: "Dresses",
        price: 99,
        originalPrice: 129,
        image: "/placeholder.svg?height=400&width=300&text=Zessi+Dresses",
    },
]

export default function WishlistPage() {
    const removeFromWishlist = (id: string) => {
        // Handle remove from wishlist
        console.log(`Remove item ${id} from wishlist`)
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-light">WISHLIST</h1>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {wishlistItems.map((item) => (
                    <div key={item.id} className="group">
                        <Link href={`/product/${item.id}`} className="block">
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
                                        removeFromWishlist(item.id)
                                    }}
                                    className="absolute top-4 right-4 p-2 bg-white rounded-full hover:text-primary transition-colors"
                                >
                                    <Heart size={16} />
                                </button>
                            </div>
                        </Link>
                        <div className="space-y-1">
                            <div className="text-sm text-gray-600">{item.category}</div>
                            <Link href={`/product/${item.id}`}>
                                <h3 className="text-lg font-light group-hover:text-primary transition-colors">{item.name}</h3>
                            </Link>
                            <div className="flex items-center gap-2">
                                <span className="font-normal">${item.price}</span>
                                {item.originalPrice && (
                                    <span className="text-sm text-gray-500 line-through">${item.originalPrice}</span>
                                )}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

