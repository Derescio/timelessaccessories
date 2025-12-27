import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug, getRandomProducts } from '@/lib/actions/product.actions';
import { getAllReviews } from '@/lib/actions/review.actions';
import ReviewList from './review-list';
// import { ClientProduct } from "@/lib/types/product.types";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
// import { ProductReviews } from "@/components/product/product-reviews";
import { ProductCard } from "@/components/cards/ProductCard";
import { Metadata } from 'next';
import { auth } from '@/auth';
import ProductJsonLd from '@/components/seo/ProductJsonLd';
import BreadcrumbJsonLd from '@/components/seo/BreadcrumbJsonLd';
import { getCanonicalUrl, getAbsoluteImageUrl } from '@/lib/utils/seo';

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

    const canonicalUrl = getCanonicalUrl(`/products/${product.slug}`);
    const productImage = product.mainImage
        ? getAbsoluteImageUrl(product.mainImage)
        : `${process.env.NEXT_PUBLIC_SITE_URL || 'https://www.shop-dw.com'}/images/placeholder.svg`;
    const availability = product.inventory > 0 ? 'in stock' : 'out of stock';
    const price = product.hasDiscount && product.compareAtPrice
        ? product.compareAtPrice * (1 - (product.discountPercentage || 0) / 100)
        : product.price;

    return {
        title: `${product.name} | Shop-DW Accessories`,
        description: product.description || "View product details",
        alternates: {
            canonical: canonicalUrl,
        },
        openGraph: {
            title: product.name,
            description: product.description || "View product details",
            url: canonicalUrl,
            siteName: 'Shop-DW',
            type: 'website',
            images: [
                {
                    url: productImage,
                    width: 1200,
                    height: 630,
                    alt: product.name,
                },
                ...product.images.slice(0, 3).map(img => ({
                    url: getAbsoluteImageUrl(img.url),
                    alt: img.alt || product.name,
                })),
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: product.name,
            description: product.description || "View product details",
            images: [productImage],
        },
        other: {
            'product:price:amount': price.toFixed(2),
            'product:price:currency': 'CAD',
            'product:availability': availability,
            'product:condition': 'new',
            'product:retailer': 'Shop-DW',
        },
    };
}

// ISR: Revalidate every hour
export const revalidate = 3600;

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

    // Fetch reviews for JSON-LD
    const reviews = await getAllReviews({ productId: product.id });

    // Prepare product data for JSON-LD
    const canonicalUrl = getCanonicalUrl(`/products/${product.slug}`);
    const productImages = product.images.length > 0
        ? product.images.map(img => getAbsoluteImageUrl(img.url))
        : product.mainImage
            ? [getAbsoluteImageUrl(product.mainImage)]
            : [];

    // Prepare offers for JSON-LD (support multiple inventory variants)
    const offers = product.inventories.map(inv => ({
        price: inv.hasDiscount && inv.compareAtPrice
            ? inv.compareAtPrice * (1 - (inv.discountPercentage || 0) / 100)
            : inv.retailPrice,
        priceCurrency: 'CAD',
        availability: inv.quantity > 0
            ? 'https://schema.org/InStock'
            : 'https://schema.org/OutOfStock',
        url: canonicalUrl,
        sku: inv.sku,
        itemCondition: 'https://schema.org/NewCondition',
    }));

    // Prepare aggregate rating
    const aggregateRating = product.numReviews > 0 && product.rating
        ? {
            ratingValue: product.rating,
            reviewCount: product.numReviews,
            bestRating: 5,
            worstRating: 1,
        }
        : undefined;

    // Prepare individual reviews for JSON-LD (limit to 5 most recent)
    const productReviews = reviews.slice(0, 5).map(review => ({
        author: review.user?.name || 'Anonymous',
        datePublished: review.createdAt.toISOString(),
        reviewBody: review.content || '',
        reviewRating: {
            ratingValue: review.rating,
            bestRating: 5,
        },
    }));

    // Breadcrumb items
    const breadcrumbItems = [
        { name: 'Home', url: getCanonicalUrl('/') },
        { name: 'Products', url: getCanonicalUrl('/products') },
        { name: product.category.name, url: getCanonicalUrl(`/products?category=${product.categoryId}`) },
        { name: product.name, url: canonicalUrl },
    ];

    return (
        <>
            {/* JSON-LD Structured Data */}
            <ProductJsonLd
                name={product.name}
                description={product.description}
                image={productImages}
                url={canonicalUrl}
                sku={product.sku}
                brand="Shop-DW"
                category={product.category.name}
                offers={offers}
                aggregateRating={aggregateRating}
                reviews={productReviews}
            />
            <BreadcrumbJsonLd items={breadcrumbItems} />

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
        </>
    );
}