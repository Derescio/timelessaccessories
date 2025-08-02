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
import { Search } from "lucide-react";

interface ProductsFilterProps {
    onSearch: (value: string) => void;
    onPerPageChange: (value: number) => void;
    onSortChange: (value: string) => void;
    onGenderChange?: (value: string) => void;
}

export default function ProductsFilter({
    onSearch,
    onPerPageChange,
    onSortChange,
    onGenderChange,
}: ProductsFilterProps) {

    const searchParams = useSearchParams();

    const [search, setSearch] = useState(searchParams.get("search") || "");
    const [gender, setGender] = useState(searchParams.get("gender") || "all");
    const debouncedSearch = useDebounce(search, 300);

    useEffect(() => {
        onSearch(debouncedSearch);
    }, [debouncedSearch, onSearch]);

    const handlePerPageChange = (value: string) => {
        onPerPageChange(Number(value));
    };

    const handleGenderChange = (value: string) => {
        setGender(value);
        onGenderChange?.(value);
    };

    return (
        <div className="bg-gray-50 p-4 rounded-lg border">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
                {/* Search Input */}
                <div className="flex-1 min-w-[250px] w-full lg:w-auto">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search products..."
                            className="pl-10 bg-white border border-gray-300 text-black placeholder:text-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Filter Controls - Stack on mobile, row on larger screens */}
                <div className="flex flex-col sm:flex-row gap-2 w-full">
                    {/* Gender Filter */}
                    {onGenderChange && (
                        <div className="w-full sm:flex-1 sm:max-w-[140px]">
                            <Select
                                value={gender}
                                onValueChange={handleGenderChange}
                            >
                                <SelectTrigger className="h-10 w-full">
                                    <SelectValue placeholder="Gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Genders</SelectItem>
                                    <SelectItem value="Men">Men</SelectItem>
                                    <SelectItem value="Women">Women</SelectItem>
                                    <SelectItem value="Children">Children</SelectItem>
                                    <SelectItem value="Unisex">Unisex</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    )}

                    {/* Sort Dropdown */}
                    <div className="w-full sm:flex-1 sm:max-w-[160px]">
                        <Select
                            defaultValue="name_asc"
                            onValueChange={onSortChange}
                        >
                            <SelectTrigger className="h-10 w-full">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="name_asc">Name (A-Z)</SelectItem>
                                <SelectItem value="name_desc">Name (Z-A)</SelectItem>
                                <SelectItem value="price_asc">Price (Low-High)</SelectItem>
                                <SelectItem value="price_desc">Price (High-Low)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Items Per Page Dropdown */}
                    <div className="w-full sm:flex-1 sm:max-w-[140px]">
                        <Select
                            defaultValue="8"
                            onValueChange={handlePerPageChange}
                        >
                            <SelectTrigger className="h-10 w-full">
                                <SelectValue placeholder="Items per page" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="8">8 items</SelectItem>
                                <SelectItem value="12">12 items</SelectItem>
                                <SelectItem value="16">16 items</SelectItem>
                                <SelectItem value="20">20 items</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>
        </div>
    );
}