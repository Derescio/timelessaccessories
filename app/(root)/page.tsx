///import ProductList from "@/components/shared/product/product-list";
//import { getFeaturedProducts, getLatestProducts, } from "@/lib/actions/product.actions";
//import { getAllCategories } from "@/lib/actions/product.actions";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
import Hero from "@/components/hero";
import CategorySection from "@/components/productCategories";
import FeaturedProducts from "@/components/featuredProducts";
import AmazonMerch from "@/components/amazon-merch";
import BlogSection from "@/components/blogs";
import { Metadata } from "next";
import { getCanonicalUrl } from "@/lib/utils/seo";

//import ProductCarousel from "@/components/shared/product/product-carousel";
//import ViewAllProductsButton from "@/components/all-products-btn";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com';

export const metadata: Metadata = {
  title: "Shop-DW | Everyday Accessories for Modern Living",
  description: "Discover timeless accessories for modern living. Shop-DW offers a curated selection of jewelry, watches, bags, and fashion accessories. Quality products for everyday style.",
  keywords: ['accessories', 'jewelry', 'watches', 'bags', 'fashion accessories', 'timeless style', 'everyday accessories', 'modern living'],
  alternates: {
    canonical: getCanonicalUrl('/'),
  },
  openGraph: {
    title: "Shop-DW | Everyday Accessories for Modern Living",
    description: "Discover timeless accessories for modern living. Shop-DW offers a curated selection of jewelry, watches, bags, and fashion accessories.",
    url: BASE_URL,
    siteName: 'Shop-DW',
    type: 'website',
    images: [
      {
        url: `${BASE_URL}/og/Gold_Earrings.png`,
        width: 1200,
        height: 630,
        alt: 'Shop-DW - Everyday Accessories for Modern Living',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Shop-DW | Everyday Accessories for Modern Living",
    description: "Discover timeless accessories for modern living. Shop-DW offers a curated selection of jewelry, watches, bags, and fashion accessories.",
    images: [`${BASE_URL}/og/Gold_Earrings.png`],
  },
};


const HomePage = async () => {
  // const { products, totalCount } = await getLatestProducts();
  // const categories = await getAllCategories();
  // const featuredProducts = await getFeaturedProducts();


  return (
    <>
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <AmazonMerch />
      <BlogSection />

      {/* <div className="flex  items-center justify-center mb-6">
        {categories.map((x) => (
          <Button key={x.category} variant='ghost' className='max-w-sm' asChild>
            <Link href={`/search?category=${x.category}`}>
              {x.category}
            </Link>
          </Button>
        ))}
      </div>
      {featuredProducts.length > 0 && (
        <ProductCarousel
          data={featuredProducts.map((product) => ({
            ...product,
            costPrice: Number(product.costPrice),  // Ensure number type
            rating: Number(product.rating),  // Ensure number type
            price: Number(product.price),  // If price is also stored as a string
            discountRate: Number(product.discountRate),
            isDiscounted: Boolean(product.isDiscounted),
          }))}
        />
      )}
      <ProductList
        data={products.map((product) => ({
          ...product,
          price: Number(product.price),
          costPrice: Number(product.costPrice),
          rating: Number(product.rating),
          discountRate: Number(product.discountRate),
          isDiscounted: Boolean(product.isDiscounted),
        }))}
        title="Newest Arrivals"
        searchParams={{ q: "" }}
        totalCount={totalCount}
      />
      <ViewAllProductsButton /> */}
    </>
  );
};

export default HomePage;
