import { MetadataRoute } from 'next';
import { getProducts } from '@/lib/actions/product.actions';
import { getAllPosts, getAllCategories, getAllAuthors } from '@/lib/sanity';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Get all products
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const productsResponse = await getProducts();
    const products = productsResponse.data || [];
    
    productPages = products
      .filter(product => product.isActive && product.slug)
      .map(product => ({
        url: `${BASE_URL}/products/${product.slug}`,
        lastModified: product.updatedAt || new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }));
  } catch (error) {
    console.error('Error fetching products for sitemap:', error);
  }

  // Get all blog posts
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const posts = await getAllPosts();
    
    blogPages = posts.map(post => ({
      url: `${BASE_URL}/blog/${post.slug.current}`,
      lastModified: post.publishedAt ? new Date(post.publishedAt) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }));
  } catch (error) {
    console.error('Error fetching blog posts for sitemap:', error);
  }

  // Get all blog categories
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getAllCategories();
    
    categoryPages = categories.map(category => ({
      url: `${BASE_URL}/blog/category/${category.slug.current}`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    }));
  } catch (error) {
    console.error('Error fetching categories for sitemap:', error);
  }

  // Get all blog authors
  let authorPages: MetadataRoute.Sitemap = [];
  try {
    const authors = await getAllAuthors();
    
    authorPages = authors.map(author => ({
      url: `${BASE_URL}/blog/author/${author.slug.current}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }));
  } catch (error) {
    console.error('Error fetching authors for sitemap:', error);
  }

  return [
    ...staticPages,
    ...productPages,
    ...blogPages,
    ...categoryPages,
    ...authorPages,
  ];
}

