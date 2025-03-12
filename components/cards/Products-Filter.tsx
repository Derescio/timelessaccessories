"use client";

//import { parseAsInteger, useQueryState } from 'nuqs'

import { useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { useEffect, useState } from "react";
import { useDebounce } from "../../hooks/use-debounce";

interface ProductsFilterProps {
    onSearch: (value: string) => void;
    onPerPageChange: (value: number) => void;
    onSortChange: (value: string) => void;
}

export default function ProductsFilter({
    onSearch,
    onPerPageChange,
    onSortChange,
}: ProductsFilterProps) {

    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") || "");
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        onSearch(debouncedSearch);
    }, [debouncedSearch, onSearch]);

    const handlePerPageChange = (value: string) => {
        onPerPageChange(Number(value));
    };

    return (
        <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[200px]">
                <Input
                    placeholder="Search products..."
                    className="w-full"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            <div className="flex gap-2">
                <Select
                    defaultValue="name_asc"
                    onValueChange={onSortChange}
                >
                    <SelectTrigger className="w-[160px]">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                        <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                        <SelectItem value="price_asc">Price (Low-High)</SelectItem>
                        <SelectItem value="price_desc">Price (High-Low)</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    defaultValue="10"
                    onValueChange={handlePerPageChange}
                >
                    <SelectTrigger className="w-[100px]">
                        <SelectValue placeholder="Per Page" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="10">10</SelectItem>
                        <SelectItem value="15">15</SelectItem>
                        <SelectItem value="20">20</SelectItem>
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}