import Image from "next/image"
import { Truck, HeadphonesIcon, ShieldCheck } from "lucide-react"

export default function AboutContent() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12 mb-16">
                <div>
                    <h2 className="text-2xl font-light mb-6">OUR STORY</h2>
                    <p className="text-gray-600 mb-8">
                        At Timeless Accessories, we believe that the right accessories can transform not just an outfit, but a
                        moment. Our journey began with a simple vision: to create timeless pieces that celebrate individuality and
                        elevate everyday style.
                    </p>
                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-light mb-4">Our Mission</h3>
                            <p className="text-gray-600">
                                To provide exceptional quality accessories that stand the test of time, while maintaining sustainable
                                and ethical practices.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-light mb-4">Our Vision</h3>
                            <p className="text-gray-600">
                                To become the leading destination for timeless, sustainable accessories that inspire confidence and
                                self-expression.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="relative aspect-square">
                    <Image src="/placeholder.svg?height=600&width=600" alt="Our Story" fill className="object-cover rounded-lg" />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                <div className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                        <Truck size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-light mb-2">FAST AND FREE DELIVERY</h3>
                    <p className="text-gray-600">Free shipping on all orders over $50</p>
                </div>
                <div className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                        <HeadphonesIcon size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-light mb-2">24/7 CUSTOMER SUPPORT</h3>
                    <p className="text-gray-600">Round-the-clock assistance for all your needs</p>
                </div>
                <div className="p-6">
                    <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                        <ShieldCheck size={24} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-light mb-2">MONEY BACK GUARANTEE</h3>
                    <p className="text-gray-600">30-day return policy for your peace of mind</p>
                </div>
            </div>
        </div>
    )
}

