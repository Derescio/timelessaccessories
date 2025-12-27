import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Clock, User, ArrowLeft, Share2 } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import PortableText from '@/components/blog/PortableText'
import BlogCard from '@/components/blog/BlogCard'
import { getPostBySlug, getAllPosts, urlFor } from '@/lib/sanity'
import ArticleJsonLd from '@/components/seo/ArticleJsonLd'
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd'
import { getCanonicalUrl } from '@/lib/utils/seo'

interface BlogPostPageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const resolvedParams = await params
    const post = await getPostBySlug(resolvedParams.slug)

    if (!post) {
        return {
            title: 'Post Not Found',
        }
    }

    const seoTitle = post.seo?.metaTitle || post.title
    const seoDescription = post.seo?.metaDescription || post.excerpt
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : undefined
    const canonicalUrl = getCanonicalUrl(`/blog/${post.slug.current}`)
    const publishedDate = post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString()

    return {
        title: `${seoTitle} | Timeless Accessories Blog`,
        description: seoDescription,
        keywords: post.seo?.keywords?.join(', ') || post.tags?.join(', '),
        authors: [{ name: post.author.name }],
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: seoTitle,
            description: seoDescription,
            type: 'article',
            siteName: 'Shop-DW',
            authors: [post.author.name],
            images: imageUrl ? [imageUrl] : undefined,
            url: canonicalUrl,
            publishedTime: publishedDate,
            modifiedTime: publishedDate, // Update if you have modified date
            section: post.categories?.[0]?.title,
            tags: post.tags,
        },
        twitter: {
            card: 'summary_large_image',
            title: seoTitle,
            description: seoDescription,
            images: imageUrl ? [imageUrl] : undefined,
        },
    }
}

export async function generateStaticParams() {
    const posts = await getAllPosts()
    return posts.map((post) => ({
        slug: post.slug.current,
    }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
    const resolvedParams = await params
    const post = await getPostBySlug(resolvedParams.slug)

    if (!post) {
        notFound()
    }

    // Get related posts (same category, excluding current post)
    const allPosts = await getAllPosts()
    const relatedPosts = allPosts
        .filter(p => p._id !== post._id)
        .filter(p => p.categories?.some(cat =>
            post.categories?.some(postCat => postCat._id === cat._id)
        ))
        .slice(0, 3)

    const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${resolvedParams.slug}`
    const canonicalUrl = getCanonicalUrl(`/blog/${post.slug.current}`)
    const imageUrl = post.mainImage ? urlFor(post.mainImage).width(1200).height(630).url() : undefined
    const publishedDate = post.publishedAt ? new Date(post.publishedAt).toISOString() : new Date().toISOString()

    // Breadcrumb items
    const breadcrumbItems = [
        { name: 'Home', url: getCanonicalUrl('/') },
        { name: 'Blog', url: getCanonicalUrl('/blog') },
        ...(post.categories && post.categories.length > 0
            ? [{ name: post.categories[0].title, url: getCanonicalUrl(`/blog/category/${post.categories[0].slug.current}`) }]
            : []),
        { name: post.title, url: canonicalUrl },
    ]

    return (
        <>
            {/* JSON-LD Structured Data */}
            <ArticleJsonLd
                headline={post.title}
                description={post.excerpt}
                image={imageUrl}
                datePublished={publishedDate}
                dateModified={publishedDate}
                author={{
                    name: post.author.name,
                    url: post.author.slug ? getCanonicalUrl(`/blog/author/${post.author.slug.current}`) : undefined,
                }}
                publisher={{
                    name: 'Shop-DW',
                    logo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com'}/logo.png`,
                }}
                url={canonicalUrl}
                mainEntityOfPage={canonicalUrl}
            />
            <BreadcrumbJsonLd items={breadcrumbItems} />

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

                {/* Article Header */}
                <article className="container mx-auto px-4 max-w-4xl">
                    <header className="mb-8">
                        {/* Categories */}
                        <div className="flex flex-wrap gap-2 mb-4">
                            {post.categories?.map((category) => (
                                <Badge key={category._id} variant="secondary">
                                    {category.title}
                                </Badge>
                            ))}
                        </div>

                        {/* Title */}
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                            {post.title}
                        </h1>

                        {/* Meta Information */}
                        <div className="flex flex-wrap items-center gap-6 text-gray-600 mb-6">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5" />
                                <Link
                                    href={`/blog/author/${post.author.slug.current}`}
                                    className="hover:text-blue-600 font-medium transition-colors"
                                >
                                    {post.author.name}
                                </Link>
                            </div>

                            <div className="flex items-center gap-2">
                                <Calendar className="h-5 w-5" />
                                <time dateTime={post.publishedAt}>
                                    {format(new Date(post.publishedAt), 'MMMM d, yyyy')}
                                </time>
                            </div>

                            {post.readingTime && (
                                <div className="flex items-center gap-2">
                                    <Clock className="h-5 w-5" />
                                    <span>{post.readingTime} min read</span>
                                </div>
                            )}
                        </div>

                        {/* Share Button - Note: This needs to be moved to a client component for onClick functionality */}
                        <div className="flex items-center gap-4 mb-8">
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                            >
                                <Share2 className="h-4 w-4 mr-2" />
                                Share
                            </Button>
                        </div>

                        {/* Featured Image */}
                        {post.mainImage && (
                            <div className="mb-8 rounded-lg overflow-hidden">
                                <Image
                                    src={urlFor(post.mainImage).width(800).height(600).url()}
                                    alt={post.mainImage.alt || post.title}
                                    width={800}
                                    height={600}
                                    className="w-full h-auto"
                                    priority
                                />
                            </div>
                        )}
                    </header>

                    {/* Article Content */}
                    <div className="mb-12">
                        <PortableText value={post.body} className="prose prose-lg max-w-none" />
                    </div>

                    {/* Tags */}
                    {post.tags && post.tags.length > 0 && (
                        <div className="mb-8">
                            <h3 className="text-lg font-semibold mb-4">Tags</h3>
                            <div className="flex flex-wrap gap-2">
                                {post.tags.map((tag, index) => (
                                    <Badge key={index} variant="outline">
                                        #{tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <Separator className="my-8" />

                    {/* Author Bio */}
                    <div className="mb-12">
                        <Card>
                            <CardHeader>
                                <div className="flex items-center gap-4">
                                    {post.author.image && (
                                        <Image
                                            src={urlFor(post.author.image).width(80).height(80).url()}
                                            alt={post.author.name}
                                            width={80}
                                            height={80}
                                            className="rounded-full"
                                        />
                                    )}
                                    <div>
                                        <h3 className="text-xl font-semibold">{post.author.name}</h3>
                                        <Link
                                            href={`/blog/author/${post.author.slug.current}`}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                        >
                                            View all posts by {post.author.name}
                                        </Link>
                                    </div>
                                </div>
                            </CardHeader>
                            {post.author.bio && (
                                <CardContent>
                                    <PortableText value={post.author.bio} className="text-gray-600" />
                                </CardContent>
                            )}
                        </Card>
                    </div>

                    {/* Related Posts */}
                    {relatedPosts.length > 0 && (
                        <div className="mb-12">
                            <h2 className="text-2xl font-bold mb-6">Related Posts</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {relatedPosts.map((relatedPost) => (
                                    <BlogCard key={relatedPost._id} post={relatedPost} />
                                ))}
                            </div>
                        </div>
                    )}
                </article>
            </div>
        </>
    )
}

