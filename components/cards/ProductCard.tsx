'use client'
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star } from "lucide-react";
import { ProductCardProduct } from "@/types";
import ProductCardButton from "./ProductCardButton";
import { useMemo } from "react";

interface ProductCardProps {
    product: ProductCardProduct;
}

export function ProductCard({ product }: ProductCardProps) {
    const {
        id,
        name,
        price,
        compareAtPrice,
        hasDiscount,
        discountPercentage,
        mainImage,
        slug,
        category,
        averageRating,
        reviewCount,
        inventorySku,
        quantity
    } = product;

    // Check if the product is out of stock
    const isOutOfStock = typeof quantity === 'number' && quantity <= 0;

    // Extract inventoryId from product if available
    const inventoryId = product.inventorySku || product.id;

    if (!inventorySku) {
        console.warn(`Product ${id} (${name}) is using product ID as inventory ID. This should be fixed in the product transformation.`);
    }

    // Calculate display price based on discount if available
    const displayPrice = useMemo(() => {
        // If there's a valid discount, calculate the discounted price
        if (hasDiscount && discountPercentage && compareAtPrice) {
            const discountAmount = (Number(compareAtPrice) * Number(discountPercentage)) / 100;
            const discountedPrice = Number(compareAtPrice) - discountAmount;

            // Log price calculation for debugging
            // console.log(`ProductCard price calculation for ${name}:`, {
            //     hasDiscount,
            //     discountPercentage,
            //     originalCompareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
            //     originalPrice: price ? Number(price) : null,
            //     calculatedDiscountedPrice: discountedPrice
            // });

            return discountedPrice;
        }

        // If no discount, use the original price
        return Number(price);
    }, [hasDiscount, discountPercentage, compareAtPrice, price, name]);

    // Determine what price to display as the original price (for strikethrough)
    const originalPrice = useMemo(() => {
        if (hasDiscount && compareAtPrice) {
            return Number(compareAtPrice);
        }
        return null;
    }, [hasDiscount, compareAtPrice]);

    return (
        <Card className="overflow-hidden group">
            <Link href={`/products/${slug}`} className="block">
                <div className="aspect-square relative overflow-hidden">
                    <Image
                        src={mainImage}
                        alt={name}
                        width={500}
                        height={500}
                        className="object-cover transition-transform group-hover:scale-105"
                    />
                    {hasDiscount && discountPercentage && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                            {discountPercentage}% OFF
                        </span>
                    )}
                </div>
                <CardContent className="p-4">
                    <div className="text-sm text-muted-foreground mb-2">
                        {category.name}
                    </div>
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {name}
                    </h3>
                    <div className="mt-2 space-x-2">
                        {originalPrice ? (
                            <div className="flex flex-col items-end">
                                <span className="text-sm font-medium">${displayPrice.toFixed(2)}</span>
                                <span className="text-sm text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                            </div>
                        ) : (
                            <span className="font-bold">${displayPrice.toFixed(2)}</span>
                        )}
                    </div>
                    {averageRating !== null && (
                        <div className="mt-2 flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{averageRating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">({reviewCount})</span>
                        </div>
                    )}
                </CardContent>
            </Link>
            <CardFooter className="p-4 pt-0">
                {isOutOfStock ? (
                    <div className="w-full py-2 text-center bg-gray-100 text-muted-foreground rounded-md text-sm font-medium">
                        Out of Stock
                    </div>
                ) : (
                    <ProductCardButton
                        productId={id}
                        inventoryId={inventoryId}
                    />
                )}
            </CardFooter>
        </Card>
    );
} 