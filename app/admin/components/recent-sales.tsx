"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export function RecentSales() {
    return (
        <div className="space-y-8">
            <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src="/avatars/01.png" alt="Avatar" />
                    <AvatarFallback>JD</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">John Doe</p>
                    <p className="text-sm text-muted-foreground">john.doe@example.com</p>
                </div>
                <div className="ml-auto font-medium">+$249.00</div>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src="/avatars/02.png" alt="Avatar" />
                    <AvatarFallback>JM</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Jane Miller</p>
                    <p className="text-sm text-muted-foreground">jane.miller@example.com</p>
                </div>
                <div className="ml-auto font-medium">+$349.00</div>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src="/avatars/03.png" alt="Avatar" />
                    <AvatarFallback>WS</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Will Smith</p>
                    <p className="text-sm text-muted-foreground">will.smith@example.com</p>
                </div>
                <div className="ml-auto font-medium">+$199.00</div>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src="/avatars/04.png" alt="Avatar" />
                    <AvatarFallback>SW</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Sarah Wilson</p>
                    <p className="text-sm text-muted-foreground">sarah.wilson@example.com</p>
                </div>
                <div className="ml-auto font-medium">+$129.00</div>
            </div>
            <div className="flex items-center">
                <Avatar className="h-9 w-9 mr-3">
                    <AvatarImage src="/avatars/05.png" alt="Avatar" />
                    <AvatarFallback>LM</AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">Lisa Martinez</p>
                    <p className="text-sm text-muted-foreground">lisa.martinez@example.com</p>
                </div>
                <div className="ml-auto font-medium">+$89.00</div>
            </div>
        </div>
    );
} 