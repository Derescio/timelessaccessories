"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { ClientProduct } from "@/lib/types/product.types";

interface ProductGalleryProps {
    images: ClientProduct["images"];
    mainImage?: string;
}

export function ProductGallery({ images, mainImage }: ProductGalleryProps) {
    const defaultImage = images[0]?.url || "/images/placeholder.svg";
    const [selectedImage, setSelectedImage] = useState(mainImage || defaultImage);

    return (
        <div className="flex flex-col gap-4">
            <div className="relative aspect-square w-full overflow-hidden rounded-lg">
                <Image
                    src={selectedImage}
                    alt="Product image"
                    fill
                    className="object-cover"
                    priority
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
            </div>
            {images.length > 0 && (
                <div className="grid grid-cols-4 gap-4">
                    {images.map((image) => (
                        <button
                            key={image.id}
                            onClick={() => setSelectedImage(image.url)}
                            className={cn(
                                "relative aspect-square w-full overflow-hidden rounded-lg",
                                selectedImage === image.url && "ring-2 ring-primary"
                            )}
                        >
                            <Image
                                src={image.url}
                                alt={image.alt || "Product image"}
                                fill
                                className="object-cover"
                                sizes="(max-width: 768px) 25vw, (max-width: 1200px) 12.5vw, 8.33vw"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
} 