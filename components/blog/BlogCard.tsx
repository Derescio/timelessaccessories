import Image from 'next/image'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Calendar, Clock, User } from 'lucide-react'
import { format } from 'date-fns'
import { urlFor, type Post } from '@/lib/sanity'

interface BlogCardProps {
    post: Post
    featured?: boolean
}

export default function BlogCard({ post, featured = false }: BlogCardProps) {
    const imageUrl = post.mainImage
        ? urlFor(post.mainImage).width(600).height(400).url()
        : '/images/Blog_Image.jpg'

    return (
        <Card className={`overflow-hidden transition-all duration-300 hover:shadow-lg ${featured ? 'md:flex md:flex-row' : ''
            }`}>
            <div className={`relative ${featured ? 'md:w-1/2' : ''}`}>
                <Link href={`/blog/${post.slug.current}`} className="block">
                    <Image
                        src={imageUrl}
                        alt={post.mainImage?.alt || post.title}
                        width={600}
                        height={400}
                        className={`w-full object-cover transition-transform duration-300 hover:scale-105 ${featured ? 'h-64 md:h-full' : 'h-48'
                            }`}
                    />
                </Link>
                {post.featured && (
                    <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                        Featured
                    </Badge>
                )}
            </div>

            <div className={`flex flex-col ${featured ? 'md:w-1/2' : ''}`}>
                <CardHeader className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                        {post.categories?.map((category) => (
                            <Badge
                                key={category._id}
                                variant="secondary"
                                className={`text-xs ${category.color ? `bg-${category.color}-100 text-${category.color}-800` : ''
                                    }`}
                            >
                                {category.title}
                            </Badge>
                        ))}
                    </div>

                    <Link href={`/blog/${post.slug.current}`} className="block">
                        <h3 className={`font-bold text-gray-900 hover:text-blue-600 transition-colors ${featured ? 'text-2xl' : 'text-xl'
                            }`}>
                            {post.title}
                        </h3>
                    </Link>

                    <p className={`text-gray-600 ${featured ? 'text-base' : 'text-sm'}`}>
                        {post.excerpt}
                    </p>
                </CardHeader>

                <CardContent className="flex-1">
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            <Link
                                href={`/blog/author/${post.author.slug.current}`}
                                className="hover:text-blue-600 transition-colors"
                            >
                                {post.author.name}
                            </Link>
                        </div>

                        <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <time dateTime={post.publishedAt}>
                                {format(new Date(post.publishedAt), 'MMM d, yyyy')}
                            </time>
                        </div>

                        {post.readingTime && (
                            <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{post.readingTime} min read</span>
                            </div>
                        )}
                    </div>
                </CardContent>

                <CardFooter className="pt-0">
                    <div className="flex flex-wrap gap-2">
                        {post.tags?.slice(0, 3).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                            </Badge>
                        ))}
                        {post.tags && post.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                                +{post.tags.length - 3} more
                            </Badge>
                        )}
                    </div>
                </CardFooter>
            </div>
        </Card>
    )
} 