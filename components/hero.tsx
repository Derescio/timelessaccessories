import Image from "next/image";
import Link from "next/link";

const Hero = () => {
    return (

        <section className="relative min-h-[80vh] flex items-center justify-center mt-8">
            {/* Background Image */}
            <div className="absolute inset-0">
                <Image
                    src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/HeroImage-Wl3RWWw6YOnIN9bl2xJRPITHuYRdIw.png"
                    alt="Elegant woman wearing luxury jewelry"
                    fill
                    className="object-cover"
                    priority
                />
                {/* Gradient Overlay */}
                <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/10"></div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-4 text-center text-white">
                <div className="max-w-3xl mx-auto">
                    <div className="flex items-center justify-center mb-4">
                        <div className="w-8 h-px bg-white/70 mr-3"></div>
                        <span className="text-white/90 uppercase tracking-wider text-sm font-light">LUXURY COLLECTION</span>
                        <div className="w-8 h-px bg-white/70 ml-3"></div>
                    </div>
                    <h1 className="text-4xl md:text-6xl lg:text-7xl font-extralight mb-6">Timeless Elegance Redefined</h1>
                    <p className="text-lg md:text-xl text-white/90 mb-8 max-w-xl mx-auto font-light">
                        Discover our exclusive collection of handcrafted jewelry, where luxury meets artistry.
                    </p>
                    <Link
                        href="/shop"
                        className="inline-block bg-white text-gray-900 px-8 py-3 rounded-full text-sm uppercase tracking-wider font-normal hover:bg-gray-100 transition-colors duration-300"
                    >
                        Shop Collection
                    </Link>
                </div>
            </div>
        </section>
    );
};

export default Hero;