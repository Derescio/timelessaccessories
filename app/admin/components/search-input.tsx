"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SearchInputProps {
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function SearchInput({
    placeholder = "Search...",
    value,
    onChange,
    className
}: SearchInputProps) {
    return (
        <div className={cn("relative", className)}>
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
                placeholder={placeholder}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="pl-8 w-full md:w-[300px]"
            />
        </div>
    );
} 