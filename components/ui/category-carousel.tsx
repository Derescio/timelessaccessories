import * as React from "react";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import { Card, CardContent } from "@/components/ui/card";
import { Category } from "@prisma/client";
import Link from "next/link";
import Image from "next/image";

interface CategoryCarouselProps {
    categories: (Category & { productCount: number })[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
    return (
        <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            className="w-full max-w-6xl mx-auto px-4"
        >
            <CarouselContent>
                {categories.map((category) => (
                    <CarouselItem key={category.id} className="md:basis-1/2 lg:basis-1/3">
                        <Link href={`/products?category=${category.id}`}>
                            <Card className="overflow-hidden group">
                                <div className="aspect-square relative bg-muted">
                                    <Image
                                        src={category.imageUrl || `/images/placeholder.svg`}
                                        alt={category.name}
                                        fill
                                        className="object-cover transition-transform group-hover:scale-105"
                                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-muted-foreground/5" />
                                </div>
                                <CardContent className="flex flex-col items-center justify-center p-6">
                                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                                        {category.name}
                                    </h3>
                                    <p className="text-sm text-muted-foreground">
                                        {category.productCount} Products
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    </CarouselItem>
                ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    );
} 