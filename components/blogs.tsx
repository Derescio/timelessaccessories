import Image from "next/image"
import Link from "next/link"
import { format } from 'date-fns'
import { Calendar, User } from 'lucide-react'
import { getAllPosts, urlFor } from '@/lib/sanity'

// Function to shuffle array and get random items
function getRandomItems<T>(array: T[], count: number): T[] {
    const shuffled = [...array].sort(() => Math.random() - 0.5)
    return shuffled.slice(0, count)
}

export default async function BlogSection() {
    // Fetch all blog posts from Sanity
    const allPosts = await getAllPosts()

    // Get 4 random blog posts (or all if less than 4)
    const blogPosts = getRandomItems(allPosts, 4)

    // If no posts, show a placeholder message
    if (blogPosts.length === 0) {
        return (
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl md:text-4xl font-extralight text-gray-800 mb-4">Latest From Our Blog</h2>
                        <p className="text-gray-600 font-light">Discover jewelry trends, styling tips, and our latest collections.</p>
                    </div>
                    <div className="text-center py-8">
                        <p className="text-gray-500">No blog posts available yet. Check back soon!</p>
                    </div>
                </div>
            </section>
        )
    }

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extralight text-gray-800 mb-4">Latest From Our Blog</h2>
                    <p className="text-gray-600 font-light">Discover jewelry trends, styling tips, and our latest collections.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {blogPosts.map((post) => (
                        <div
                            key={post._id}
                            className="group bg-white border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="aspect-[4/3] overflow-hidden">
                                <Image
                                    src={post.mainImage ? urlFor(post.mainImage).width(400).height(300).url() : "/images/placeholder.svg"}
                                    alt={post.mainImage?.alt || post.title}
                                    width={400}
                                    height={300}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                            </div>
                            <div className="p-5">
                                <h3 className="text-lg font-light mb-2 group-hover:text-amber-700 transition-colors line-clamp-2">
                                    {post.title}
                                </h3>
                                <p className="text-gray-600 text-sm mb-4 line-clamp-2 font-light">
                                    {post.excerpt}
                                </p>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center mr-2">
                                            {post.author?.image ? (
                                                <Image
                                                    src={urlFor(post.author.image).width(32).height(32).url()}
                                                    alt={post.author.name}
                                                    width={32}
                                                    height={32}
                                                    className="w-full h-full object-cover rounded-full"
                                                />
                                            ) : (
                                                <span className="text-xs font-normal">
                                                    {post.author?.name
                                                        ?.split(" ")
                                                        .map((n) => n[0])
                                                        .join("")}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-xs font-normal">{post.author?.name}</p>
                                            <p className="text-xs text-gray-500 font-light">
                                                {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                                            </p>
                                        </div>
                                    </div>
                                    <Link
                                        href={`/blog/${post.slug.current}`}
                                        className="text-xs font-normal text-amber-700 hover:underline"
                                    >
                                        Read More
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* View All Blog Posts Button */}
                <div className="text-center mt-12">
                    <Link href="/blog">
                        <button className="bg-amber-700 text-white px-8 py-3 rounded-lg hover:bg-amber-800 transition-colors font-light">
                            View All Blog Posts
                        </button>
                    </Link>
                </div>
            </div>
        </section>
    )
}

