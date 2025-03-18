import { Skeleton } from "@/components/ui/skeleton";

export default function CartPageSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col md:flex-row gap-8">
                {/* Cart items skeleton */}
                <div className="w-full md:w-2/3 space-y-4">
                    {Array.from({ length: 3 }).map((_, index) => (
                        <div key={index} className="flex gap-4 p-4 border rounded-md">
                            <Skeleton className="h-24 w-24 rounded-md" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-6 w-48" />
                                <Skeleton className="h-4 w-24" />
                                <div className="flex justify-between mt-4">
                                    <Skeleton className="h-8 w-24" />
                                    <Skeleton className="h-5 w-16" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Order summary skeleton */}
                <div className="w-full md:w-1/3">
                    <div className="border rounded-md p-4 space-y-4">
                        <Skeleton className="h-6 w-32" />
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-20" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                            <div className="flex justify-between">
                                <Skeleton className="h-4 w-16" />
                                <Skeleton className="h-4 w-16" />
                            </div>
                        </div>
                        <div className="pt-4 border-t">
                            <div className="flex justify-between font-semibold">
                                <Skeleton className="h-5 w-20" />
                                <Skeleton className="h-5 w-20" />
                            </div>
                        </div>
                        <Skeleton className="h-10 w-full mt-4" />
                    </div>
                </div>
            </div>
        </div>
    );
} 