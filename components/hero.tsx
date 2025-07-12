'use client'
import Image from "next/image";
import Link from "next/link";
import useEmblaCarousel from 'embla-carousel-react';
import { useEffect } from "react";

const heroImages = [
    'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiROYYzSOqZLgabNo2fAHZI63EtDwVQdKWSX0uJ',
    'https://utfs.io/f/wfxchweshiC1cLKofk35Ska3Zos40UOhv6q8fbKenMVgryxN',
    'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRvrqPc5LOV4fyCpK1mnsagwZY9Nkc5MzQxGUA',
    // 'https://6qve25pmkn.ufs.sh/f/kHBAST0eCUiRt8XbhJjUHP9u7v1CQnfGKjwTmWOI40pLJr2i'
];

const Hero = () => {
    const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    // const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
    useEffect(() => {
        if (!emblaApi) return;
        const interval = setInterval(() => {
            if (emblaApi.canScrollNext()) {
                emblaApi.scrollNext();
            } else {
                emblaApi.scrollTo(0); // Go back to first slide if at end
            }
        }, 3500); // Change slide every 3.5 seconds

        return () => clearInterval(interval);
    }, [emblaApi]);


    return (
        <section className="relative h-[50vh] md:h-[65vh] lg:h-[80vh] flex items-center justify-center mt-0.5 ">
            {/* Embla Carousel */}
            <div className="absolute inset-0 overflow-hidden opacity-90 ">
                <div ref={emblaRef} className="embla h-full ">
                    <div className="embla__container h-full flex">
                        {heroImages.map((img, idx) => (
                            <div className="embla__slide relative min-w-full h-full" key={idx}>
                                <Image
                                    src={img}
                                    alt={`Hero image ${idx + 1}`}
                                    fill
                                    className="object-cover object-center"
                                    priority={idx === 0}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/10"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 flex items-center h-full">
                <div className="max-w-3xl text-left text-white">
                    <div className="flex items-center mb-4">
                        <div className="w-8 h-px bg-white/70 mr-3"></div>
                        <span className="text-white/90 uppercase tracking-wider text-sm font-light">PREMIUM FASHION ACCESSORIES</span>
                        <div className="w-8 h-px bg-white/70 ml-3"></div>
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight mb-6">Accessories For A Modern World</h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl font-normal">
                        Shop luxury jewelry, quality chains, and elegant bracelets. Handcrafted quality accessories that elevate your style.
                    </p>
                    <Link
                        href="/products"
                        className="inline-block bg-transparent text-white border-2 border-white/70 px-8 py-3 rounded-full text-sm uppercase tracking-wider font-normal hover:bg-white hover:text-gray-900 transition-all duration-300"
                    >
                        Shop All Accessories
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;