import { Suspense } from 'react'
import { Metadata } from 'next'
import BlogListClient from '@/components/blog/BlogListClient'
import { getAllPosts, getFeaturedPosts, getAllCategories } from '@/lib/sanity'
import { Skeleton } from '@/components/ui/skeleton'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com';

export const metadata: Metadata = {
    title: 'Blog | Timeless Accessories',
    description: 'Discover the latest trends, style tips, and insights about timeless accessories. From jewelry care to fashion guides, find everything you need to elevate your style.',
    keywords: ['fashion blog', 'accessory trends', 'jewelry care', 'style tips', 'fashion accessories', 'timeless style'],
    alternates: {
        canonical: `${BASE_URL}/blog`,
    },
    openGraph: {
        title: 'Blog | Timeless Accessories',
        description: 'Discover the latest trends, style tips, and insights about timeless accessories.',
        type: 'website',
        siteName: 'Shop-DW',
        url: `${BASE_URL}/blog`,
        images: [{
            url: `${BASE_URL}/og/diamond_1.png`,
            width: 1200,
            height: 630,
            alt: 'Shop-DW Blog - Timeless Accessories',
        }],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Blog | Timeless Accessories',
        description: 'Discover the latest trends, style tips, and insights about timeless accessories.',
        images: [`${BASE_URL}/og/diamond_1.png`],
    },
}

function BlogSkeleton() {
    return (
        <div className="container mx-auto px-4 py-16">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="space-y-4">
                        <Skeleton className="h-48 w-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-20 w-full" />
                    </div>
                ))}
            </div>
        </div>
    )
}

export default async function BlogPage() {
    const [posts, featuredPosts, categories] = await Promise.all([
        getAllPosts(),
        getFeaturedPosts(),
        getAllCategories(),
    ])

    return (
        <div>
            {/* Hero Section */}
            <div className="relative bg-cover bg-center py-16 md:py-24" style={{ backgroundImage: "url('/images/Ringimage.jpg')" }}>
                <div className="absolute inset-0 bg-black opacity-50"></div>
                <div className="relative container mx-auto px-4 text-center text-white">
                    <h1 className="text-4xl md:text-5xl font-light mb-4">TIMELESS BLOG</h1>
                    <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                        Discover the latest trends, style tips, and insights about timeless accessories
                    </p>
                </div>
            </div>

            {/* Blog Content */}
            <Suspense fallback={<BlogSkeleton />}>
                <BlogListClient
                    posts={posts}
                    featuredPosts={featuredPosts}
                    categories={categories}
                />
            </Suspense>
        </div>
    )
}