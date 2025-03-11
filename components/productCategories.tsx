import { getAllCategories } from "@/lib/actions/product.actions";
import { CategoryCarousel } from "@/components/ui/category-carousel";

export default async function CategorySection() {
    const categories = await getAllCategories();
    // console.log(categories)

    return (
        <section className="py-16 bg-white">
            <div className="container mx-auto px-4 text-center">
                <h2 className="text-3xl md:text-4xl font-extralight text-gray-800 mb-4">Shop By Category</h2>
                <p className="text-gray-600 mb-12 font-light">The World&apos;s Premium Brands in One Destination.</p>
                <CategoryCarousel categories={categories} />
            </div>
        </section>
    )
}
