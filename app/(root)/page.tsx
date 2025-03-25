///import ProductList from "@/components/shared/product/product-list";
//import { getFeaturedProducts, getLatestProducts, } from "@/lib/actions/product.actions";
//import { getAllCategories } from "@/lib/actions/product.actions";
// import { Button } from "@/components/ui/button";
// import Link from "next/link";
import Hero from "@/components/hero";
import CategorySection from "@/components/productCategories";
import FeaturedProducts from "@/components/featuredProducts";
import BlogSection from "@/components/blogs";

//import ProductCarousel from "@/components/shared/product/product-carousel";
//import ViewAllProductsButton from "@/components/all-products-btn";


export const metadata = {
  title: "Home",
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
