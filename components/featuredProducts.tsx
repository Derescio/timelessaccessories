import { getFeaturedProducts } from "@/lib/actions/product.actions";
import { ProductCard } from "@/components/cards/ProductCard";
import { ProductCardProduct } from "@/types";

export default async function FeaturedProducts() {
    // Fetch featured products
    const products = await getFeaturedProducts(8);
    //console.log(products)

    // Convert to ProductCardProduct type which is what the ProductCard component expects
    const formattedProducts: ProductCardProduct[] = products.map(product => ({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
        discountPercentage: product.discountPercentage || null,
        hasDiscount: product.hasDiscount || false,
        slug: product.slug,
        mainImage: product.mainImage || '/images/placeholder.svg',
        // Transform string array to object array if needed
        images: Array.isArray(product.images)
            ? product.images.map(image => typeof image === 'string'
                ? { url: image }
                : image
            )
            : [],
        category: {
            name: product.category.name,
            slug: product.category.slug,
        },
        // averageRating: product.averageRating || null,
        // reviewCount: product.reviewCount || 0,
        rating: product.averageRating ?? 0,      // <-- map averageRating to rating
        numReviews: product.reviewCount ?? 0,
        inventorySku: null,
        quantity: product.quantity || 0
    }));

    return (
        <section className="py-16 bg-gray-50 border-t border-gray-200 shadow-md">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-extralight text-gray-800 mb-4">Featured Products</h2>
                    <p className="text-gray-600 font-light">Discover our handpicked selection of premium jewelry.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {formattedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}

