import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
  searchParams: Record<string, string | string[] | undefined>;
}

export function Pagination({
  currentPage,
  totalPages,
  baseUrl,
  searchParams,
}: PaginationProps) {
  const createPageUrl = (page: number) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams)) {
      if (value && key !== "page") {
        if (Array.isArray(value)) {
          params.set(key, value[0]);
        } else {
          params.set(key, value);
        }
      }
    }
    params.set("page", page.toString());
    return `${baseUrl}?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-2">
      {currentPage > 1 && (
        <Button
          variant="outline"
          size="icon"
          asChild
        >
          <Link href={createPageUrl(currentPage - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Link>
        </Button>
      )}
      <span className="text-sm">
        Page {currentPage} of {totalPages}
      </span>
      {currentPage < totalPages && (
        <Button
          variant="outline"
          size="icon"
          asChild
        >
          <Link href={createPageUrl(currentPage + 1)}>
            <ChevronRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}
