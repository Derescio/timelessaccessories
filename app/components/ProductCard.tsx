import Image from "next/image";

interface Product {
    id: string;
    name: string;
    price: number;
    description: string;
    images: string[];
    category: {
        name: string;
        id: string;
    };
}

interface ProductCardProps {
    product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
    return (
        <div className="group relative">
            <div className="aspect-h-1 aspect-w-1 w-full overflow-hidden rounded-md bg-gray-200 lg:aspect-none group-hover:opacity-75 lg:h-80">
                <Image
                    src={product.images[0] || '/placeholder.jpg'}
                    alt={product.name}
                    className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                    width={300}
                    height={300}
                />
            </div>
            <div className="mt-4 flex justify-between">
                <div>
                    <h3 className="text-sm text-gray-700">{product.name}</h3>
                    <p className="mt-1 text-sm text-gray-500">{product.category.name}</p>
                </div>
                <p className="text-sm font-medium text-gray-900">${product.price}</p>
            </div>
        </div>
    );
} 