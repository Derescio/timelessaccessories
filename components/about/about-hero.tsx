import Image from "next/image"

export default function AboutHero() {
    return (
        <div className="relative h-[400px] md:h-[600px]">

            <Image
                src="/images/Blog_Image.jpg"
                alt="About Timeless Accessories"
                fill
                className="object-cover"
                priority
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                <h1 className="text-4xl md:text-6xl text-white font-light">ABOUT TIMELESS</h1>
            </div>
        </div>
    )
}

