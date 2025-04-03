import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/actions/product.actions';
import { ClientProduct } from "@/lib/types/product.types";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductReviews } from "@/components/product/product-reviews";
import { Metadata } from 'next';

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
        title: `${product.name} | Timeless Accessories`,
        description: product.description || "View product details",
    };
}

export default async function ProductPage({
    params
}: ProductPageProps) {
    const resolvedParams = await params;
    const product = await getProductBySlug(resolvedParams.slug);

    if (!product) {
        notFound();
    }

    // Calculate average rating and review count
    const averageRating = product.reviews.length > 0
        ? product.reviews.reduce((acc: number, review: { rating: number }) => acc + review.rating, 0) / product.reviews.length
        : 0;
    const reviewCount = product.reviews.length;

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
            <div className="mt-12">
                <ProductReviews
                    reviews={product.reviews}
                    averageRating={averageRating}
                    reviewCount={reviewCount}
                />
            </div>
        </div>
    );
}
