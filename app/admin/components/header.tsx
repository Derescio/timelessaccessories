"use client";

import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface HeaderProps {
    className?: string;
    onMenuClick?: () => void;
}

export function Header({ className, onMenuClick }: HeaderProps) {
    return (
        <header className={cn("border-b", className)}>
            <div className="flex h-16 items-center px-4">
                <Sheet>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenuClick}>
                            <Menu className="h-5 w-5" />
                            <span className="sr-only">Open navigation menu</span>
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                        <SheetHeader>
                            <SheetTitle>Navigation Menu</SheetTitle>
                        </SheetHeader>
                        <nav className="flex flex-col gap-4 mt-4">
                            {/* Add your mobile navigation items here */}
                        </nav>
                    </SheetContent>
                </Sheet>
                <div className="flex-1">
                    <h1 className="text-lg font-semibold">Admin Dashboard</h1>
                </div>
            </div>
        </header>
    );
} 