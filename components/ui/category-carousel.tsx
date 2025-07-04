'use client';
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
import Autoplay from "embla-carousel-autoplay";

interface CategoryWithDetails extends Category {
    productCount: number;
    firstInventoryImage: string | null;
}

interface CategoryCarouselProps {
    categories: CategoryWithDetails[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
    const plugin = React.useRef(
        Autoplay({ delay: 3000, stopOnInteraction: true })
    );

    // Log the categories and their image sources
    React.useEffect(() => {
        // console.log('Category Carousel Images:', categories.map(category => ({
        //     name: category.name,
        //     firstInventoryImage: category.firstInventoryImage,
        //     categoryImageUrl: category.imageUrl,
        //     finalImageUsed: category.firstInventoryImage || category.imageUrl || `/images/placeholder.svg`
        // })));
    }, [categories]);

    return (
        <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full max-w-6xl mx-auto px-4"
        >
            <CarouselContent>
                {categories.map((category) => {
                    const imageSrc = category.imageUrl || category.firstInventoryImage || `/images/placeholder.svg`;
                    // console.log(`Rendering category: ${category.name}`, {
                    //     imageSrc,
                    //     hasInventoryImage: !!category.firstInventoryImage,
                    //     hasCategoryImage: !!category.imageUrl
                    // });

                    return (
                        <CarouselItem key={category.id} className="sm:basis-1/2 lg:basis-1/3">
                            <Link href={`/products?category=${category.id}`}>
                                <Card className="overflow-hidden group border-0">
                                    <div className="aspect-[4/3] relative bg-muted">
                                        <Image
                                            src={imageSrc}
                                            alt={category.name}
                                            fill
                                            className="object-cover transition-transform group-hover:scale-105"
                                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                                            quality={85}
                                        />
                                    </div>
                                    <CardContent className="flex flex-col items-center justify-center p-4 border-t">
                                        <h3 className="text-lg font-semibold mb-1 group-hover:text-primary transition-colors">
                                            {category.name}
                                        </h3>
                                        <p className="text-sm text-muted-foreground">
                                            {category.productCount} Products
                                        </p>
                                    </CardContent>
                                </Card>
                            </Link>
                        </CarouselItem>
                    );
                })}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
        </Carousel>
    );
} 