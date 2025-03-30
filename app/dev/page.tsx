// Root page for development routes
export default function DevPage() {
    return (
        <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Development & Testing Routes</h1>
            <div className="space-y-4">
                <section>
                    <h2 className="text-xl font-semibold mb-2">Admin Tests</h2>
                    <ul className="list-disc pl-4">
                        <li><a href="/dev/admin/upload-test" className="text-blue-500 hover:underline">Upload Test</a></li>
                        <li><a href="/dev/admin/upload-simple" className="text-blue-500 hover:underline">Upload Simple</a></li>
                        <li><a href="/dev/admin/upload-basic" className="text-blue-500 hover:underline">Upload Basic</a></li>
                        <li><a href="/dev/admin/test" className="text-blue-500 hover:underline">General Test</a></li>
                    </ul>
                </section>
                <section>
                    <h2 className="text-xl font-semibold mb-2">Category Tests</h2>
                    <ul className="list-disc pl-4">
                        <li><a href="/dev/categories/upload-test" className="text-blue-500 hover:underline">Category Upload Test</a></li>
                        <li><a href="/dev/categories/seed" className="text-blue-500 hover:underline">Category Seeding</a></li>
                    </ul>
                </section>
            </div>
        </div>
    );
} 