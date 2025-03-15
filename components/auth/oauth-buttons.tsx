'use client';

import { Button } from "@/components/ui/button";
import { signIn } from "next-auth/react";
import { FcGoogle } from "react-icons/fc";

export function OAuthButtons() {
    return (
        <div className="space-y-3">
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">
                        Or continue with
                    </span>
                </div>
            </div>
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => signIn('google', { callbackUrl: '/' })}
            >
                <FcGoogle />
                Continue with Google
            </Button>
        </div>
    );
}