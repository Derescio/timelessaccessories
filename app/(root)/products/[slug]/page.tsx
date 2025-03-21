import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProductBySlug } from '@/lib/actions/product.actions';
import ProductDetails from '@/components/products/product-details';
import ProductGallery from '@/components/products/product-gallery';
import type { Product } from '@/types';

interface PageProps {
    params: Promise<{
        slug: string;
    }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

// export default async function ProductDetailPage({ params }: PageProps) {
//     const { slug } = params;
//     const product = await getProductBySlug(slug) as Product;

//     if (!product) {
//         notFound();
//     }

// if (!product) {
//     return {
//         title: 'Product Not Found',
//         description: 'The requested product could not be found.',
//     };
// }

// return {
//     title: `${product.name} - Timeless Accessories`,
//     description: product.description,
//     openGraph: {
//         title: product.name,
//         description: product.description,
//         images: [product.mainImage || '/images/placeholder.svg'],
//     },
// };


export default async function ProductDetailPage({ params }: PageProps) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;
    const product = (await getProductBySlug(slug)) as unknown as Product;

    if (!product) {
        notFound();
    }

    return (
        <div>
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
                    <div className="flex items-center gap-4">
                        {/* <Link href="#" className="flex items-center gap-2 hover:text-primary">
                            <ChevronLeft size={20} />
                            <span className="hidden sm:inline">PREV</span>
                        </Link>
                        <Link href="#" className="flex items-center gap-2 hover:text-primary">
                            <span className="hidden sm:inline">NEXT</span>
                            <ChevronRight size={20} />
                        </Link> */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <ProductGallery
                        images={product.images}
                        mainImage={product.mainImage || '/images/placeholder.svg'}
                    />
                    <ProductDetails product={product} />
                </div>
            </div>
        </div>
    );
}
