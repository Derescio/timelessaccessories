"use client"

import { useState } from "react"
import BlogPostCard from "@/components/blogcard"

const categories = ["ALL", "COMPANY", "FASHION", "STYLE", "TRENDS", "BEAUTY"]

const blogPosts = [
    {
        slug: "5-tips-to-increase-your-online-sales",
        title: "5 Tips to Increase Your Online Sales",
        excerpt:
            "Midst one brought greater also morning green saying had good. Open stars day let over gathered, grass face one every light of under.",
        image: "/images/Blog_Image_1.jpg",
        author: "Admin",
        date: "APRIL 05, 2023",
        category: "COMPANY",
    },
    {
        slug: "woman-with-good-shoes",
        title: "Woman with good shoes is never be ugly place",
        excerpt:
            "Midst one brought greater also morning green saying had good. Open stars day let over gathered, grass face one every light of under.",
        image: "/images/Blog_Image.jpg",
        author: "Admin",
        date: "APRIL 05, 2023",
        category: "FASHION",
    },
    {
        slug: "heaven-upon-heaven",
        title: "Heaven upon heaven moveth every have",
        excerpt:
            "Midst one brought greater also morning green saying had good. Open stars day let over gathered, grass face one every light of under.",
        image: "/images/Blog_Image_1.jpg",
        author: "Admin",
        date: "APRIL 05, 2023",
        category: "STYLE",
    },
]

export default function BlogPage() {
    const [activeCategory, setActiveCategory] = useState("ALL")

    const filteredPosts =
        activeCategory === "ALL" ? blogPosts : blogPosts.filter((post) => post.category === activeCategory)

    return (
        <div>
            {/* Hero Section */}
            <div className="relative bg-cover bg-center py-16 md:py-24" style={{ backgroundImage: "url('/images/Ringimage.jpg')" }}>
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative container mx-auto px-4 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-light mb-8">SHOP-DW BLOG</h1>
                    <nav className="flex flex-wrap justify-center gap-6">
                        {categories.map((category) => (
                            <button
                                key={category}
                                onClick={() => setActiveCategory(category)}
                                className={`text-sm hover:text-primary transition-colors ${activeCategory === category ? "text-primary underline underline-offset-8" : "text-gray-300"
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </nav>
                </div>
            </div>

            {/* Blog Posts Grid */}
            <div className="container mx-auto px-4 py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {filteredPosts.map((post) => (
                        <BlogPostCard key={post.slug} {...post} />
                    ))}
                </div>
            </div>
        </div>
    )
}