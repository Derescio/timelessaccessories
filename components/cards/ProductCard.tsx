import Link from "next/link";
import Image from "next/image";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
    id: string;
    name: string;
    price: number;
    compareAtPrice?: number | null;
    imageUrl: string;
    slug: string;
}

export function ProductCard({ name, price, compareAtPrice, imageUrl, slug }: ProductCardProps) {
    const discount = compareAtPrice ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) : 0;

    return (
        <Card className="overflow-hidden group">
            <Link href={`/products/${slug}`} className="block">
                <div className="aspect-square relative overflow-hidden">
                    <Image
                        src={imageUrl}
                        alt={name}
                        fill
                        className="object-cover transition-transform group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    {discount > 0 && (
                        <span className="absolute top-2 right-2 bg-red-600 text-white px-2 py-1 text-xs font-semibold rounded">
                            {discount}% OFF
                        </span>
                    )}
                </div>
                <CardContent className="p-4">
                    <h3 className="font-medium line-clamp-2 group-hover:text-primary transition-colors">
                        {name}
                    </h3>
                    <div className="mt-2 space-x-2">
                        <span className="font-bold">${price.toFixed(2)}</span>
                        {compareAtPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                                ${compareAtPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                </CardContent>
            </Link>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full" size="sm">
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Add to Cart
                </Button>
            </CardFooter>
        </Card>
    );
} 