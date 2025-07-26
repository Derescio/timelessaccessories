import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getRandomProducts } from '@/lib/actions/product.actions';
import ReviewList from './review-list';
// import { ClientProduct } from "@/lib/types/product.types";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
// import { ProductReviews } from "@/components/product/product-reviews";
import { ProductCard } from "@/components/cards/ProductCard";
import { Metadata } from 'next';
import { auth } from '@/auth';

type ProductPageProps = {
    params: Promise<{
        slug: string;
    }>;
};

export async function generateMetadata({
    params
}: ProductPageProps): Promise<Metadata> {
    const resolvedParams = await params;
    const product = await getProductBySlug(resolvedParams.slug);

    if (!product) {
        return {
            title: "Product Not Found",
            description: "The requested product could not be found",
        };
    }

    return {
        title: `${product.name} | Shop-DW Accessories`,
        description: product.description || "View product details",
    };
}

export default async function ProductPage({
    params
}: ProductPageProps) {
    const resolvedParams = await params;
    const product = await getProductBySlug(resolvedParams.slug);
    const session = await auth();
    const userId = session?.user?.id;

    if (!product) {
        notFound();
    }

    // Fetch random products for recommendations
    const recommendedProducts = await getRandomProducts(product.id, 4);

    // Calculate average rating and review count
    // const averageRating = product.reviews.length > 0
    //     ? product.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / product.reviews.length
    //     : 0;
    // const reviewCount = product.reviews.length;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2 text-sm">
                    <Link href="/" className="hover:text-primary">
                        HOME
                    </Link>
                    <span>/</span>
                    <Link href="/products" className="hover:text-primary">
                        PRODUCTS
                    </Link>
                    <span>/</span>
                    <span className="text-muted-foreground">{product.name.toUpperCase()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProductGallery
                    images={product.images}
                    mainImage={product.mainImage}
                />
                <ProductInfo product={product} />

            </div>
            {/* Recommendations Section */}
            {recommendedProducts.length > 0 && (
                <div className="mt-16">
                    <div className="text-center mb-8">
                        <h2 className="text-2xl font-light mb-2">May we also recommend</h2>
                        <div className="w-16 h-px bg-gray-300 mx-auto"></div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {recommendedProducts.map((recommendedProduct) => (
                            <ProductCard
                                key={recommendedProduct.id}
                                product={recommendedProduct}
                            />
                        ))}
                    </div>
                </div>
            )}
            <div className="mt-12">
                {/* <ProductReviews
                    reviews={product.reviews}
                    averageRating={averageRating}
                    reviewCount={reviewCount}
                /> */}
                <ReviewList userId={userId ?? ''} productId={product.id} productSlug={product.slug} />
            </div>


        </div>
    );
}