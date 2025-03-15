import Image from "next/image"
import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"

import BlogPostCard from "@/components/blogcard"

export default function BlogPostPage() {
    return (
        <article className="min-h-screen">
            {/* Header */}
            <header className="text-center py-16 container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-light mb-6">5 Tips to Increase Your Online Sales</h1>
                    <div className="flex items-center justify-center gap-3 text-sm text-gray-500">
                        <span>BY ADMIN</span>
                        <span>•</span>
                        <time dateTime="2023-04-05">APRIL 05, 2023</time>
                        <span>•</span>
                        <Link href="/blog?category=TRENDS" className="hover:text-primary">
                            TRENDS
                        </Link>
                    </div>
                </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[21/9] mb-16">
                <Image
                    src="/placeholder.svg?height=900&width=1900&text=Blog+Header+Image"
                    alt="Blog post header image"
                    fill
                    className="object-cover"
                    priority
                />
            </div>

            {/* Content */}
            <div className="container mx-auto px-4 pb-16">
                <div className="max-w-4xl mx-auto">
                    <div className="prose prose-lg">
                        <p className="lead">
                            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Amet sapien dignissim a elementum. Sociis lectus
                            dictum id viverra vivamus feugiat vestibulum velit.
                        </p>

                        <h2>Sed do eiusmod tempor incididunt ut labore</h2>
                        <p>
                            Saw whales fruitful good days image them, midst waters open, saw. Stars lights seasons. Fruit forth rule
                            Evening Creepeth own lesser years shall set seed multiply bring had cattle right multiply him to upon
                            they are void fish. Brought second Made. Be. Under male male, firmament, beast had light after fifth forth
                            darkness thing hath.
                        </p>

                        <h3>Why choose product?</h3>
                        <ul>
                            <li>Created by cotton fibers with soft and smooth</li>
                            <li>Simple, Configurable (eg. size, color, etc.), bundled</li>
                            <li>Downloadable/Digital Products, Virtual Products</li>
                        </ul>

                        <h3>Sample Number List</h3>
                        <ol>
                            <li>Create Store with specific attributes on the fly</li>
                            <li>Simple, Configurable (eg. size, color, etc.), bundled</li>
                            <li>Downloadable/Digital Products, Virtual Products</li>
                        </ol>
                    </div>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mt-8">
                        <Link
                            href="/blog?tag=fashion"
                            className="px-4 py-2 bg-gray-100 text-sm hover:bg-primary hover:text-white transition-colors rounded-full"
                        >
                            Fashion
                        </Link>
                        <Link
                            href="/blog?tag=lifestyle"
                            className="px-4 py-2 bg-gray-100 text-sm hover:bg-primary hover:text-white transition-colors rounded-full"
                        >
                            Lifestyle
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between mt-16 pt-8 border-t">
                        <Link href="/blog/prev-post" className="flex items-center gap-2 text-sm hover:text-primary">
                            <ChevronLeft size={20} />
                            <div>
                                <div className="text-xs text-gray-500">Previous Post</div>
                                <span>Heaven upon heaven moveth every have</span>
                            </div>
                        </Link>
                        <Link href="/blog/next-post" className="flex items-center gap-2 text-sm hover:text-primary text-right">
                            <div>
                                <div className="text-xs text-gray-500">Next Post</div>
                                <span>Woman with good shoes is never be ugly place</span>
                            </div>
                            <ChevronRight size={20} />
                        </Link>
                    </div>
                </div>
            </div>

            {/* Related Posts */}
            <div className="bg-gray-50 py-16">
                <div className="container mx-auto px-4">
                    <h2 className="text-2xl font-light text-center mb-8">Related Posts</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3].map((i) => (
                            <BlogPostCard
                                key={i}
                                slug="sample-post"
                                title="Sample Blog Post Title"
                                excerpt="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
                                image="/placeholder.svg?height=400&width=600&text=Related+Post"
                                author="Admin"
                                date="APRIL 05, 2023"
                            // category="TRENDS"
                            />
                        ))}
                    </div>
                </div>
            </div>
        </article>
    )
}

