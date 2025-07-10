import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import BlogCard from '@/components/blog/BlogCard'
import PortableText from '@/components/blog/PortableText'
import { getAllAuthors, getPostsByAuthor, urlFor } from '@/lib/sanity'

interface AuthorPageProps {
    params: Promise<{
        slug: string
    }>
}

export async function generateMetadata({ params }: AuthorPageProps): Promise<Metadata> {
    const resolvedParams = await params
    const authors = await getAllAuthors()
    const author = authors.find(a => a.slug.current === resolvedParams.slug)

    if (!author) {
        return {
            title: 'Author Not Found',
        }
    }

    return {
        title: `${author.name} | Timeless Accessories Blog`,
        description: `Read all posts by ${author.name} on Timeless Accessories Blog. Discover insights and tips about fashion accessories and timeless style.`,
        openGraph: {
            title: `${author.name} | Timeless Accessories Blog`,
            description: `Read all posts by ${author.name} on Timeless Accessories Blog.`,
            type: 'profile',
            url: `/blog/author/${author.slug.current}`,
            images: author.image ? [urlFor(author.image).width(800).height(600).url()] : undefined,
        },
    }
}

export async function generateStaticParams() {
    const authors = await getAllAuthors()
    return authors.map((author) => ({
        slug: author.slug.current,
    }))
}

export default async function AuthorPage({ params }: AuthorPageProps) {
    const resolvedParams = await params
    const authors = await getAllAuthors()
    const author = authors.find(a => a.slug.current === resolvedParams.slug)

    if (!author) {
        notFound()
    }

    const posts = await getPostsByAuthor(author._id)

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

            {/* Author Header */}
            <div className="container mx-auto px-4 max-w-4xl mb-12">
                <Card>
                    <CardHeader>
                        <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                            {author.image && (
                                <div className="flex-shrink-0">
                                    <Image
                                        src={urlFor(author.image).width(150).height(150).url()}
                                        alt={author.name}
                                        width={150}
                                        height={150}
                                        className="rounded-full"
                                    />
                                </div>
                            )}
                            <div className="flex-1 text-center md:text-left">
                                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                                    {author.name}
                                </h1>
                                <p className="text-lg text-gray-600 mb-4">
                                    {posts.length} published {posts.length === 1 ? 'post' : 'posts'}
                                </p>
                                {author.socialLinks && (
                                    <div className="flex gap-4 justify-center md:justify-start">
                                        {author.socialLinks.twitter && (
                                            <Link
                                                href={author.socialLinks.twitter}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-500 hover:text-blue-600 transition-colors"
                                            >
                                                Twitter
                                            </Link>
                                        )}
                                        {author.socialLinks.instagram && (
                                            <Link
                                                href={author.socialLinks.instagram}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-pink-500 hover:text-pink-600 transition-colors"
                                            >
                                                Instagram
                                            </Link>
                                        )}
                                        {author.socialLinks.linkedin && (
                                            <Link
                                                href={author.socialLinks.linkedin}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-blue-700 hover:text-blue-800 transition-colors"
                                            >
                                                LinkedIn
                                            </Link>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardHeader>
                    {author.bio && (
                        <CardContent>
                            <PortableText value={author.bio} className="text-gray-700" />
                        </CardContent>
                    )}
                </Card>
            </div>

            {/* Author's Posts */}
            <div className="container mx-auto px-4 max-w-6xl">
                <h2 className="text-2xl font-bold mb-8">Posts by {author.name}</h2>

                {posts.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-gray-500 text-lg">No posts published yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {posts.map((post) => (
                            <BlogCard key={post._id} post={post} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
} 