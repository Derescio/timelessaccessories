"use client"

import { useState } from "react"
import Image from "next/image"
import { ChevronLeft, ChevronRight, Expand } from "lucide-react"

interface ProductImage {
    id: string;
    url: string;
    alt: string | null;
    position: number;
}

interface ProductGalleryProps {
    images: ProductImage[];
    mainImage: string;
}

export default function ProductGallery({ images, mainImage }: ProductGalleryProps) {
    const [currentImage, setCurrentImage] = useState(0);

    // Combine main image with other images and sort by position
    const allImages = [
        { id: 'main', url: mainImage, alt: 'Main product image', position: -1 },
        ...images.sort((a, b) => a.position - b.position)
    ];

    return (
        <div className="flex flex-col md:flex-row gap-4">
            {/* Thumbnails - vertical on desktop, horizontal on mobile */}
            <div className="flex md:flex-col order-2 md:order-1 gap-2 md:gap-4 overflow-x-auto md:overflow-hidden">
                {allImages.map((image, index) => (
                    <button
                        key={image.id}
                        className={`flex-shrink-0 w-16 h-16 md:w-20 md:h-20 relative border-2 rounded-md overflow-hidden
                            ${currentImage === index ? "border-primary" : "border-transparent"}`}
                        onClick={() => setCurrentImage(index)}
                    >
                        <Image
                            src={image.url || "/images/placeholder.svg"}
                            alt={image.alt || "Product image"}
                            fill
                            className="object-cover"
                        />
                    </button>
                ))}
            </div>

            {/* Main Image */}
            <div className="relative w-full aspect-square bg-gray-100 rounded-lg order-1 md:order-2">
                <Image
                    src={allImages[currentImage].url || "/images/placeholder.svg"}
                    alt={allImages[currentImage].alt || "Product image"}
                    fill
                    className="object-contain"
                    priority
                />
                <div className="absolute inset-0 flex items-center justify-between p-4">
                    <button
                        onClick={() => setCurrentImage((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                        className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <button
                        onClick={() => setCurrentImage((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                        className="p-2 rounded-full bg-white/80 hover:bg-white text-gray-800"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
                <button className="absolute bottom-4 right-4 p-2 rounded-full bg-white/80 hover:bg-white text-gray-800">
                    <Expand size={20} />
                </button>
            </div>
        </div>
    )
}

