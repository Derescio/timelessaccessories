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
    const rawProduct = await getProductBySlug(resolvedParams.slug);

    if (!rawProduct) {
        notFound();
    }

    // Calculate average rating and review count
    const averageRating = rawProduct.reviews.reduce((acc, review) => acc + review.rating, 0) / rawProduct.reviews.length;
    const reviewCount = rawProduct.reviews.length;

    // Transform the product data to match the ClientProduct type
    const transformedProduct: ClientProduct = {
        id: rawProduct.id,
        name: rawProduct.name,
        description: rawProduct.description,
        price: rawProduct.inventories[0]?.retailPrice || 0,
        categoryId: rawProduct.categoryId,
        inventory: rawProduct.inventories[0]?.quantity || 0,
        createdAt: rawProduct.createdAt,
        updatedAt: rawProduct.updatedAt,
        compareAtPrice: rawProduct.inventories[0]?.compareAtPrice || null,
        discountPercentage: rawProduct.inventories[0]?.discountPercentage || null,
        hasDiscount: rawProduct.inventories[0]?.discountPercentage ? true : false,
        isActive: rawProduct.isActive,
        isFeatured: rawProduct.metadata && typeof rawProduct.metadata === 'object' && 'isFeatured' in rawProduct.metadata ? rawProduct.metadata.isFeatured as boolean : null,
        metadata: rawProduct.metadata as Record<string, unknown> | null,
        sku: rawProduct.inventories[0]?.sku || "",
        slug: rawProduct.slug,
        category: {
            id: rawProduct.category.id,
            name: rawProduct.category.name,
            slug: rawProduct.category.slug,
            description: rawProduct.category.description || undefined,
            imageUrl: rawProduct.category.imageUrl || undefined,
            parentId: rawProduct.category.parentId || undefined,
        },
        images: rawProduct.inventories[0]?.images.map((url, index) => ({
            id: `${rawProduct.inventories[0]?.id}-image-${index}`,
            url: url.startsWith("http") ? url : `/uploads/${url}`,
            alt: `${rawProduct.name} - Image ${index + 1}`,
            position: index,
        })) || [],
        mainImage: rawProduct.inventories[0]?.images[0] || "/placeholder.svg",
        inventories: rawProduct.inventories.map((inv) => ({
            id: inv.id,
            retailPrice: Number(inv.retailPrice),
            costPrice: Number(inv.costPrice),
            compareAtPrice: inv.compareAtPrice ? Number(inv.compareAtPrice) : null,
            discountPercentage: inv.discountPercentage,
            hasDiscount: inv.hasDiscount || false,
            images: inv.images || [],
            quantity: inv.quantity || 0,
            sku: inv.sku || "",
        })),
        reviews: rawProduct.reviews.map((review) => ({ rating: review.rating })),
    };

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
                    <span className="text-muted-foreground">{transformedProduct.name.toUpperCase()}</span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <ProductGallery
                    images={transformedProduct.images}
                    mainImage={transformedProduct.mainImage}
                />
                <ProductInfo product={transformedProduct} />
            </div>
            <div className="mt-12">
                <ProductReviews
                    reviews={transformedProduct.reviews}
                    averageRating={averageRating}
                    reviewCount={reviewCount}
                />
            </div>
        </div>
    );
}
