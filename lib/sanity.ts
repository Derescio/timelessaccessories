import { createClient } from '@sanity/client'
import imageUrlBuilder from '@sanity/image-url'

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2023-05-03',
  useCdn: false, // Set to false for fresh data
})

const builder = imageUrlBuilder(client)

export function urlFor(source: any) {
  return builder.image(source)
}

// Type definitions for Sanity documents
export interface Author {
  _id: string
  name: string
  slug: {
    current: string
  }
  image?: {
    alt?: string
  }
  bio?: any[]
  socialLinks?: {
    twitter?: string
    instagram?: string
    linkedin?: string
  }
}

export interface Category {
  _id: string
  title: string
  slug: {
    current: string
  }
  description?: string
  color?: string
}

export interface Post {
  _id: string
  title: string
  slug: {
    current: string
  }
  author: Author
  mainImage?: {
    alt?: string
  }
  categories?: Category[]
  publishedAt: string
  excerpt: string
  body: any[]
  featured?: boolean
  readingTime?: number
  tags?: string[]
  seo?: {
    metaTitle?: string
    metaDescription?: string
    keywords?: string[]
  }
  relatedProducts?: string[]
}

// GROQ queries for fetching blog data
export const queries = {
  // Get all published posts
  allPosts: `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    author->{
      _id,
      name,
      slug,
      image,
      bio
    },
    mainImage,
    categories[]->{
      _id,
      title,
      slug,
      color
    },
    publishedAt,
    excerpt,
    featured,
    readingTime,
    tags,
    seo
  }`,

  // Get featured posts
  featuredPosts: `*[_type == "post" && featured == true && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    author->{
      _id,
      name,
      slug,
      image
    },
    mainImage,
    categories[]->{
      _id,
      title,
      slug,
      color
    },
    publishedAt,
    excerpt,
    readingTime,
    tags
  }`,

  // Get post by slug
  postBySlug: `*[_type == "post" && slug.current == $slug][0] {
    _id,
    title,
    slug,
    author->{
      _id,
      name,
      slug,
      image,
      bio,
      socialLinks
    },
    mainImage,
    categories[]->{
      _id,
      title,
      slug,
      color
    },
    publishedAt,
    excerpt,
    body,
    featured,
    readingTime,
    tags,
    seo,
    relatedProducts
  }`,

  // Get posts by category
  postsByCategory: `*[_type == "post" && $categoryId in categories[]._ref && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    author->{
      _id,
      name,
      slug,
      image
    },
    mainImage,
    categories[]->{
      _id,
      title,
      slug,
      color
    },
    publishedAt,
    excerpt,
    readingTime,
    tags
  }`,

  // Get all categories
  allCategories: `*[_type == "category"] | order(title asc) {
    _id,
    title,
    slug,
    description,
    color
  }`,

  // Get all authors
  allAuthors: `*[_type == "author"] | order(name asc) {
    _id,
    name,
    slug,
    image,
    bio,
    socialLinks
  }`,

  // Get posts by author
  postsByAuthor: `*[_type == "post" && author._ref == $authorId && defined(publishedAt)] | order(publishedAt desc) {
    _id,
    title,
    slug,
    author->{
      _id,
      name,
      slug,
      image
    },
    mainImage,
    categories[]->{
      _id,
      title,
      slug,
      color
    },
    publishedAt,
    excerpt,
    readingTime,
    tags
  }`,

  // Get recent posts (for sidebar)
  recentPosts: `*[_type == "post" && defined(publishedAt)] | order(publishedAt desc)[0...5] {
    _id,
    title,
    slug,
    publishedAt,
    mainImage
  }`,
}

// Helper functions for fetching data
export async function getAllPosts(): Promise<Post[]> {
  return await client.fetch(queries.allPosts)
}

export async function getFeaturedPosts(): Promise<Post[]> {
  return await client.fetch(queries.featuredPosts)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  return await client.fetch(queries.postBySlug, { slug })
}

export async function getPostsByCategory(categoryId: string): Promise<Post[]> {
  return await client.fetch(queries.postsByCategory, { categoryId })
}

export async function getAllCategories(): Promise<Category[]> {
  return await client.fetch(queries.allCategories)
}

export async function getAllAuthors(): Promise<Author[]> {
  return await client.fetch(queries.allAuthors)
}

export async function getPostsByAuthor(authorId: string): Promise<Post[]> {
  return await client.fetch(queries.postsByAuthor, { authorId })
}

export async function getRecentPosts(): Promise<Post[]> {
  return await client.fetch(queries.recentPosts)
} 