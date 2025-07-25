import Image from "next/image"
import { Truck, HeadphonesIcon, ShieldCheck } from "lucide-react"

export default function AboutContent() {
    return (
        <div className="max-w-7xl mx-auto px-4 py-16">
            <div className="grid md:grid-cols-2 gap-12 mb-16">
                <div>
                    <h2 className="text-2xl font-light mb-6">OUR STORY</h2>
                    <p className="text-gray-600 mb-6">
                        Shop-DW was born from resilience, determination, and the belief that beautiful things
                        can emerge from life's most challenging moments. After a life-changing accident left me severely injured,
                        I found myself facing a new reality and searching for ways to rebuild my future.
                    </p>
                    <p className="text-gray-600 mb-8">
                        What started as a quest to create passive income became something much more meaningful—a passion for
                        curating timeless pieces that make people feel confident and beautiful. Every purchase you make doesn't
                        just support a small business; it supports a journey of recovery, independence, and the dream of turning
                        adversity into opportunity.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xl font-light mb-4">Why Your Support Matters</h3>
                            <p className="text-gray-600">
                                When you choose Shop-DW, you're not just buying jewelry—you're investing in
                                someone's recovery, independence, and dream to rebuild their life one beautiful piece at a time.
                            </p>
                        </div>
                        <div>
                            <h3 className="text-xl font-light mb-4">Our Promise to You</h3>
                            <p className="text-gray-600">
                                Every accessory we offer is carefully selected with love and attention to detail. We believe
                                in quality over quantity, and in creating lasting relationships with our customers.
                            </p>
                        </div>
                    </div>
                </div>
                <div className="relative aspect-square">
                    <Image src="/images/charms_new.jpg" alt="Our Story" fill className="object-cover rounded-lg" />
                </div>
            </div>

            <div className="mt-16 pt-12 border-t border-gray-200">
                <div className="text-center mb-12">
                    <h3 className="text-2xl font-light mb-4">The Impact of Supporting Small Business</h3>
                    <p className="text-gray-600 max-w-3xl mx-auto">
                        When you support TimelessAccessories, you become part of a story of resilience and hope.
                        Your purchase creates a ripple effect that goes far beyond a simple transaction.
                    </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                    <div className="p-6">
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                            <HeadphonesIcon size={24} className="text-primary" />
                        </div>
                        <h4 className="text-lg font-light mb-2">PERSONAL CARE</h4>
                        <p className="text-gray-600">Direct support and personal attention from someone who genuinely cares about your experience</p>
                    </div>
                    <div className="p-6">
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                            <ShieldCheck size={24} className="text-primary" />
                        </div>
                        <h4 className="text-lg font-light mb-2">QUALITY COMMITMENT</h4>
                        <p className="text-gray-600">Every piece is chosen with care because your satisfaction directly impacts my livelihood and recovery</p>
                    </div>
                    <div className="p-6">
                        <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-primary/10 rounded-full">
                            <Truck size={24} className="text-primary" />
                        </div>
                        <h4 className="text-lg font-light mb-2">MEANINGFUL IMPACT</h4>
                        <p className="text-gray-600">Your support directly contributes to independence, recovery, and the dream of rebuilding a life</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

