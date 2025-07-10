'use client'

import { useState, useMemo } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Search, Filter } from 'lucide-react'
import BlogCard from './BlogCard'
import { type Post, type Category } from '@/lib/sanity'

interface BlogListClientProps {
    posts: Post[]
    featuredPosts: Post[]
    categories: Category[]
}

export default function BlogListClient({ posts, featuredPosts, categories }: BlogListClientProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const filteredPosts = useMemo(() => {
        return posts.filter(post => {
            const matchesSearch = searchTerm === '' ||
                post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                post.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

            const matchesCategory = selectedCategory === null ||
                post.categories?.some(cat => cat._id === selectedCategory)

            return matchesSearch && matchesCategory
        })
    }, [posts, searchTerm, selectedCategory])

    const handleCategoryFilter = (categoryId: string | null) => {
        setSelectedCategory(categoryId)
    }

    return (
        <div className="container mx-auto px-4 py-16">
            {/* Featured Posts Section */}
            {featuredPosts.length > 0 && (
                <div className="mb-16">
                    <h2 className="text-3xl font-bold mb-8 text-center">Featured Posts</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {featuredPosts.slice(0, 2).map((post) => (
                            <BlogCard key={post._id} post={post} featured={true} />
                        ))}
                    </div>
                </div>
            )}

            {/* Search and Filter Section */}
            <div className="mb-8">
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="text"
                            placeholder="Search posts..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    <Button
                        variant="outline"
                        onClick={() => setShowFilters(!showFilters)}
                        className="flex items-center gap-2"
                    >
                        <Filter className="h-4 w-4" />
                        Filters
                    </Button>
                </div>

                {/* Category Filters */}
                {showFilters && (
                    <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                        <h3 className="text-sm font-medium mb-3">Filter by Category</h3>
                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => handleCategoryFilter(null)}
                                className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                            >
                                <Badge
                                    variant={selectedCategory === null ? "default" : "outline"}
                                    className="cursor-pointer hover:bg-opacity-80 transition-colors"
                                >
                                    All Categories
                                </Badge>
                            </button>
                            {categories.map((category) => (
                                <button
                                    key={category._id}
                                    type="button"
                                    onClick={() => handleCategoryFilter(category._id)}
                                    className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
                                >
                                    <Badge
                                        variant={selectedCategory === category._id ? "default" : "outline"}
                                        className="cursor-pointer hover:bg-opacity-80 transition-colors"
                                    >
                                        {category.title}
                                    </Badge>
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Results Count */}
            <div className="mb-6">
                <p className="text-gray-600">
                    {filteredPosts.length === 0 ? 'No posts found' :
                        `${filteredPosts.length} post${filteredPosts.length === 1 ? '' : 's'} found`}
                </p>
            </div>

            {/* Blog Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredPosts.map((post) => (
                    <BlogCard key={post._id} post={post} />
                ))}
            </div>

            {/* Empty State */}
            {filteredPosts.length === 0 && (
                <div className="text-center py-12">
                    <p className="text-gray-500 text-lg mb-4">No posts found matching your criteria</p>
                    <Button
                        variant="outline"
                        onClick={() => {
                            setSearchTerm('')
                            setSelectedCategory(null)
                        }}
                    >
                        Clear Filters
                    </Button>
                </div>
            )}
        </div>
    )
} 