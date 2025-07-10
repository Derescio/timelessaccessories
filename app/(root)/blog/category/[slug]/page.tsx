import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import BlogCard from '@/components/blog/BlogCard'
import { getAllCategories, getPostsByCategory } from '@/lib/sanity'

interface CategoryPageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
    const resolvedParams = await params
    const categories = await getAllCategories()
    const category = categories.find(c => c.slug.current === resolvedParams.slug)

    if (!category) {
        return {
            title: 'Category Not Found',
        }
    }

    return {
        title: `${category.title} | Timeless Accessories Blog`,
        description: category.description || `Explore all posts in the ${category.title} category. Discover insights and tips about fashion accessories and timeless style.`,
        openGraph: {
            title: `${category.title} | Timeless Accessories Blog`,
            description: category.description || `Explore all posts in the ${category.title} category.`,
            type: 'website',
            url: `/blog/category/${category.slug.current}`,
        },
    }
}

export async function generateStaticParams() {
    const categories = await getAllCategories()
    return categories.map((category) => ({
        slug: category.slug.current,
    }))
}

export default async function CategoryPage({ params }: CategoryPageProps) {
    const resolvedParams = await params
    const categories = await getAllCategories()
    const category = categories.find(c => c.slug.current === resolvedParams.slug)

    if (!category) {
        notFound()
    }

    const posts = await getPostsByCategory(category._id)

    return (
        <div className="min-h-screen">
            {/* Navigation */}
            <div className="container mx-auto px-4 py-4">
                <Link href="/blog" className="inline-block">
                    <Button variant="ghost" className="mb-4">
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Blog
                    </Button>
                </Link>
            </div>

            {/* Category Header */}
            <div className="container mx-auto px-4 max-w-4xl mb-12">
                <div className="text-center">
                    <Badge
                        variant="secondary"
                        className={`mb-4 text-lg px-4 py-2 ${category.color ? `bg-${category.color}-100 text-${category.color}-800` : ''
                            }`}
                    >
                        {category.title}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                        {category.title}
                    </h1>
                    {category.description && (
                        <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
                            {category.description}
                        </p>
                    )}
                    <p className="text-gray-500">
                        {posts.length} {posts.length === 1 ? 'post' : 'posts'} in this category
                    </p>
                </div>
            </div>

            {/* Category Posts */}
            <div className="container mx-auto px-4 max-w-6xl">
                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No posts found in this category.</p>
                        <Link href="/blog" className="inline-block">
                            <Button variant="outline" className="mt-4">
                                Explore All Posts
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <BlogCard key={post._id} post={post} />
                        ))}
                    </div>
                )}
            </div>

            {/* Related Categories */}
            <div className="container mx-auto px-4 max-w-6xl mt-16 mb-12">
                <h2 className="text-2xl font-bold mb-6">Explore Other Categories</h2>
                <div className="flex flex-wrap gap-3">
                    {categories
                        .filter(c => c._id !== category._id)
                        .map((cat) => (
                            <Link key={cat._id} href={`/blog/category/${cat.slug.current}`} className="inline-block">
                                <Badge
                                    variant="outline"
                                    className={`cursor-pointer hover:bg-gray-100 transition-colors ${cat.color ? `hover:bg-${cat.color}-50` : ''
                                        }`}
                                >
                                    {cat.title}
                                </Badge>
                            </Link>
                        ))}
                </div>
            </div>
        </div>
    )
} 