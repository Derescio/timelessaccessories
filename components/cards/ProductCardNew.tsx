import Image from "next/image";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Star } from "lucide-react";
import { Product } from "@/types";
import Link from "next/link";
import ProductCardButton from "./ProductCardButton";

interface ProductCardProps {
    product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
    const {
        id,
        name,
        description,
        slug,
        inventories,
        mainImage,
        averageRating,
        reviewCount,
        price,
        compareAtPrice,
        hasDiscount,
        discountPercentage
    } = product;

    const inventory = inventories[0];
    const isOutOfStock = !inventory?.quantity || inventory.quantity <= 0;

    // Ensure we have a valid inventory SKU
    if (inventory && !inventory.sku) {
        console.error(`Product ${id} (${name}) has inventory but missing SKU`);
    }

    // Calculate the display price
    const displayPrice = hasDiscount && compareAtPrice && discountPercentage
        ? (Number(compareAtPrice) - (Number(compareAtPrice) * Number(discountPercentage) / 100))
        : price;

    // Calculate the discount properly
    if (hasDiscount && discountPercentage && compareAtPrice) {
        // Log the discount calculation details but don't modify displayPrice directly
        console.log(`ProductCardNew price calculation for ${name}:`, {
            hasDiscount,
            discountPercentage,
            originalCompareAtPrice: compareAtPrice ? Number(compareAtPrice) : null,
            originalPrice: price ? Number(price) : null,
            // Calculate what the display price would be if we could modify it
            calculatedDisplayPrice: Number(compareAtPrice) - (Number(compareAtPrice) * Number(discountPercentage) / 100)
        });
    } else {
        console.log(`ProductCardNew price calculation for ${name} (no discount):`, {
            hasDiscount,
            originalPrice: price ? Number(price) : null
        });
    }

    // Determine what price to display as the original price (for strikethrough)
    let originalPrice = null;
    if (hasDiscount && compareAtPrice) {
        originalPrice = Number(compareAtPrice);
    }

    return (
        <Card key={id} className="p-0 flex flex-col justify-between">
            <Link href={`/products/${slug}`} className="block">
                <CardHeader className="p-0 relative">
                    <Image
                        src={inventory?.images?.[0] || mainImage || "/path/to/default/image.jpg"}
                        alt={name}
                        width={300}
                        height={500}
                        className="w-full h-full object-cover rounded-t-lg"
                    />
                    {hasDiscount && discountPercentage && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                            {discountPercentage}% OFF
                        </span>
                    )}
                </CardHeader>
                <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-2">
                        {description}
                    </p>

                    <div className="mt-2 space-x-2">
                        <span className="font-bold">${Number(displayPrice).toFixed(2)}</span>
                        {originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                ${Number(originalPrice).toFixed(2)}
                            </span>
                        )}
                    </div>
                    {averageRating !== null && (
                        <div className="mt-2 flex items-center gap-1">
                            <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            <span className="text-sm font-medium">{averageRating?.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">({reviewCount || 0}) Reviews</span>
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
                        inventoryId={inventory?.sku || ''}
                    />
                )}
            </CardFooter>
        </Card>
    );
}