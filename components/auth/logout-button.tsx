'use client'
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export function LogoutButton() {
    return (
        <Button
            variant="link"
            className="p-0 h-auto text-primary hover:underline"
            onClick={() => signOut({ callbackUrl: '/' })}
        >
            Log out
        </Button>
    );
}