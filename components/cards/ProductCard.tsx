'use client'
import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Star, ArrowRight, Heart } from "lucide-react";
import { ProductCardProduct } from "@/types";
import { Button } from "@/components/ui/button";
import { useMemo, useState, useEffect } from "react";
import { toggleWishlist, getWishlistStatus } from "@/lib/actions/wishlist.actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface ProductCardProps {
    product: ProductCardProduct;
}

export function ProductCard({ product }: ProductCardProps) {
    const router = useRouter();
    const [isInWishlist, setIsInWishlist] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

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
    } = product;

    useEffect(() => {
        const checkWishlistStatus = async () => {
            const result = await getWishlistStatus(id);
            setIsInWishlist(result?.isInWishlist ?? false);
        };
        checkWishlistStatus();
    }, [id]);

    const handleWishlistToggle = async (e: React.MouseEvent) => {
        e.preventDefault(); // Prevent card click
        setIsLoading(true);
        try {
            const result = await toggleWishlist(id);
            if (result.success) {
                setIsInWishlist(result.isInWishlist);
                toast.success(result.isInWishlist ? "Added to wishlist" : "Removed from wishlist");
            } else if (result.requiresAuth) {
                toast.error(result.error);
                router.push("/auth/login");
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("Failed to update wishlist");
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate the current price, handling discounts
    const currentPrice = useMemo(() => {
        if (hasDiscount && discountPercentage && discountPercentage > 0) {
            return Number(price) - (Number(price) * (discountPercentage / 100));
        }
        return Number(price);
    }, [hasDiscount, discountPercentage, price]);

    // Determine what price to display as the original price
    const originalPrice = useMemo(() => {
        if (hasDiscount && compareAtPrice) {
            return Number(compareAtPrice);
        }
        return null;
    }, [hasDiscount, compareAtPrice]);

    return (
        <Card className="group overflow-hidden transition-all duration-300 hover:shadow-lg">
            <div className="relative">
                <Link href={`/products/${slug}`} className="block">
                    <div className="aspect-square relative overflow-hidden">
                        <Image
                            src={mainImage}
                            alt={name}
                            width={500}
                            height={500}
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                        <button
                            onClick={handleWishlistToggle}
                            disabled={isLoading}
                            className="absolute top-2 left-2 p-2 rounded-full bg-white/90 hover:bg-white transition-colors duration-200 shadow-sm"
                        >
                            <Heart
                                className={`w-5 h-5 transition-colors duration-200 ${isInWishlist ? "fill-red-500 text-red-500" : "text-gray-600"
                                    }`}
                            />
                        </button>
                        {hasDiscount && discountPercentage && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                                {discountPercentage}% OFF
                            </span>
                        )}
                    </div>
                    <CardContent className="p-4">
                        <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors mb-2">
                            {name}
                        </h3>
                        <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                                {originalPrice ? (
                                    <>
                                        <span className="text-sm font-medium">${currentPrice.toFixed(2)}</span>
                                        <span className="text-sm text-muted-foreground line-through">${originalPrice.toFixed(2)}</span>
                                    </>
                                ) : (
                                    <span className="font-medium">${currentPrice.toFixed(2)}</span>
                                )}
                                {hasDiscount && discountPercentage && (
                                    <span className="text-sm font-medium text-green-600">
                                        -{discountPercentage}%
                                    </span>
                                )}
                            </div>
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
                <div className="px-4 pb-4">
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full group-hover:border-primary group-hover:text-primary transition-colors"
                        asChild
                    >
                        <Link href={`/products/${slug}`}>
                            View More
                            <ArrowRight className="w-4 h-4 ml-1 transition-transform group-hover:translate-x-1" />
                        </Link>
                    </Button>
                </div>
            </div>
        </Card>
    );
} 