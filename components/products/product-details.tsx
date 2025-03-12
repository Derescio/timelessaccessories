"use client"

import { useState } from "react"
import { Heart, Share2, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Product } from "@/types"

interface ProductDetailsProps {
    product: Product;
}

export default function ProductDetails({ product }: ProductDetailsProps) {
    const [quantity, setQuantity] = useState(1);
    const displayPrice = product.inventories[0]?.hasDiscount && product.inventories[0]?.discountPercentage
        ? Number(product.inventories[0].retailPrice) * (1 - product.inventories[0].discountPercentage / 100)
        : Number(product.inventories[0]?.retailPrice || 0);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                    <h1 className="text-2xl md:text-3xl font-light mb-2">{product.name}</h1>
                    <div className="flex items-center gap-2">
                        <div className="flex">
                            {[...Array(5)].map((_, i) => (
                                <Star
                                    key={i}
                                    size={16}
                                    className={i < (product.reviews?.length || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}
                                />
                            ))}
                        </div>
                        <span className="text-sm text-gray-500">{product.reviews?.length || 0} reviews</span>
                    </div>
                </div>
                <div className="text-xl md:text-2xl font-light">
                    {product.inventories[0]?.hasDiscount && (
                        <span className="text-sm text-muted-foreground line-through mr-2">
                            ${Number(product.inventories[0].retailPrice).toFixed(2)}
                        </span>
                    )}
                    ${displayPrice.toFixed(2)}
                </div>
            </div>

            <p className="text-gray-600">{product.description}</p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="flex items-center border rounded-md">
                    <button
                        className="px-3 py-2 hover:bg-gray-50"
                        onClick={() => setQuantity(Math.max(1, quantity - 1))}
                        disabled={quantity <= 1}
                    >
                        -
                    </button>
                    <span className="w-12 text-center">{quantity}</span>
                    <button
                        className="px-3 py-2 hover:bg-gray-50"
                        onClick={() => setQuantity(quantity + 1)}
                        disabled={quantity >= (product.inventories[0]?.quantity || 1)}
                    >
                        +
                    </button>
                </div>

                <Button
                    className="w-full sm:w-auto sm:flex-1 bg-primary text-primary-foreground hover:bg-primary/90"
                    disabled={!product.inventories[0]?.quantity}
                >
                    {product.inventories[0]?.quantity ? 'ADD TO CART' : 'OUT OF STOCK'}
                </Button>
            </div>

            <div className="flex flex-wrap items-center gap-4">
                <button className="flex items-center gap-2 text-sm hover:text-primary">
                    <Heart size={20} />
                    <span className="whitespace-nowrap">ADD TO WISHLIST</span>
                </button>
                <button className="flex items-center gap-2 text-sm hover:text-primary">
                    <Share2 size={20} />
                    <span>SHARE</span>
                </button>
            </div>

            <div className="border-t pt-6 space-y-4">
                <div>
                    <span className="text-gray-500">SKU:</span> {product.sku || 'N/A'}
                </div>
                <div>
                    <span className="text-gray-500">Category:</span> {product.category.name}
                </div>
                {product.metadata && (
                    <>
                        {product.metadata.style && (
                            <div>
                                <span className="text-gray-500">Style:</span> {product.metadata.style}
                            </div>
                        )}
                        {product.metadata.materials && (
                            <div>
                                <span className="text-gray-500">Materials:</span> {product.metadata.materials.join(", ")}
                            </div>
                        )}
                        {product.metadata.collection && (
                            <div>
                                <span className="text-gray-500">Collection:</span> {product.metadata.collection}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}