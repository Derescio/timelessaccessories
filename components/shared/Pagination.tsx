"use client";

import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

interface PaginationProps {
    currentPage: number;
    totalPages: number;
}

export function Pagination({ currentPage, totalPages }: PaginationProps) {
    const router = useRouter();
    const searchParams = useSearchParams();

    const handlePageChange = (pageNum: number) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set("page", String(pageNum));
        router.push(`/products?${params.toString()}`);
    };

    if (totalPages <= 1) return null;

    return (
        <div className="flex justify-center gap-2 mt-8">
            {currentPage > 1 && (
                <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                >
                    Previous
                </Button>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <Button
                    key={pageNum}
                    variant={pageNum === currentPage ? "default" : "outline"}
                    onClick={() => handlePageChange(pageNum)}
                >
                    {pageNum}
                </Button>
            ))}
            {currentPage < totalPages && (
                <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                >
                    Next
                </Button>
            )}
        </div>
    );
} 