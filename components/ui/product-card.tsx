import { Product } from "@/types";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

interface ProductCardProps {
    product: Product;
    className?: string;
}

export function ProductCard({ product, className }: ProductCardProps) {
    const displayPrice = product.inventories[0]?.hasDiscount && product.inventories[0]?.discountPercentage
        ? Number(product.inventories[0].retailPrice) * (1 - product.inventories[0].discountPercentage / 100)
        : Number(product.inventories[0]?.retailPrice || 0);

    return (
        <Card className={cn("overflow-hidden", className)}>
            <CardHeader className="p-0">
                <Link href={`/products/${product.slug}`}>
                    <div className="aspect-square relative">
                        <Image
                            src={product.mainImage || "/images/placeholder.svg"}
                            alt={product.name}
                            fill
                            className="object-cover"
                        />
                    </div>
                </Link>
            </CardHeader>
            <CardContent className="grid gap-2 p-4">
                <Link href={`/products/${product.slug}`} className="text-lg font-semibold line-clamp-1">
                    {product.name}
                </Link>
                <div className="flex items-center gap-2">
                    {product.inventories[0]?.hasDiscount && (
                        <>
                            <Badge variant="secondary" className="text-sm">
                                {product.inventories[0].discountPercentage}% OFF
                            </Badge>
                            <span className="text-sm text-muted-foreground line-through">
                                ${Number(product.inventories[0].retailPrice).toFixed(2)}
                            </span>
                        </>
                    )}
                    <span className="font-semibold">
                        ${displayPrice.toFixed(2)}
                    </span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <p className="text-sm text-muted-foreground line-clamp-2">
                    {product.description}
                </p>
            </CardFooter>
        </Card>
    );
} 