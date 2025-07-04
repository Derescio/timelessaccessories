import Image from "next/image"
import Link from "next/link"

export default function BlogSection() {
    const blogPosts = [
        {
            title: "How to Choose the Perfect Diamond",
            excerpt: "Learn about the 4Cs of diamonds and how to select the perfect stone for your jewelry.",
            image: "/images/Rings_Fingers.jpg",
            author: "Emma Johnson",
            date: "March 2, 2025",
        },
        {
            title: "Spring Jewelry Trends",
            excerpt: "Discover the hottest jewelry trends for the upcoming spring season.",
            image: "/images/Rings_Fingers.jpg",
            author: "Michael Chen",
            date: "February 28, 2025",
        },
        {
            title: "Caring for Your Fine Jewelry",
            excerpt: "Tips and tricks to keep your precious jewelry looking brilliant for years to come.",
            image: "/images/Rings_Fingers.jpg",
            author: "Sophia Williams",
            date: "February 25, 2025",
        },
        {
            title: "The History of Engagement Rings",
            excerpt: "Explore the fascinating history and evolution of engagement rings through the centuries.",
            image: "/images/Rings_Fingers.jpg",
            author: "James Rodriguez",
            date: "February 20, 2025",
        },
    ]

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extralight text-gray-800 mb-4">Latest From Our Blog</h2>
                    <p className="text-gray-600 font-light">Discover jewelry trends, styling tips, and our latest collections.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {blogPosts.map((post, index) => (
                        <div
                            key={index}
                            className="group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-[4/3] overflow-hidden">
                                <Image
                                    src={post.image || "/images/placeholder.svg"}
                                    alt={post.title}
                                    width={400}
                                    height={250}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-light mb-2 group-hover:text-amber-700 transition-colors">{post.title}</h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-light">{post.excerpt}</p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                            <span className="text-xs font-normal">
                                                {post.author
                                                    .split(" ")
                                                    .map((n) => n[0])
                                                    .join("")}
                                            </span>
                                        </div>
                                        <div>
                                            <p className="text-xs font-normal">{post.author}</p>
                                            <p className="text-xs text-gray-500 font-light">{post.date}</p>
                                        </div>
                                    </div>
                                    <Link href="#" className="text-xs font-normal text-amber-700 hover:underline">
                                        Read More
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}

