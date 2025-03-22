"use client";

/**
 * LascoPayButton Component
 * 
 * Known Changes:
 * 1. Props Simplification (2024-03-XX)
 *    - Removed unused totalAmount prop
 *    - Simplified interface to only include onClick and disabled props
 *    - Improved type safety by removing unnecessary props
 * 2. Image Source Update (2024-05-XX)
 *    - Changed remote image URL to local image path to avoid Next.js image domain restrictions
 */

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface LascoPayButtonProps {
    onClick?: () => void;
    disabled?: boolean;
}

export default function LascoPayButton({
    onClick,
    disabled = false,
}: LascoPayButtonProps) {
    return (
        <Button
            onClick={onClick}
            disabled={disabled}
            className="w-full text-white bg-[#40e0d0] hover:bg-[#3cc0b0] border-0"
            style={{
                fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
                borderRadius: "12px",
                overflow: "hidden",
                padding: 0,
                display: "flex",
                alignItems: "stretch",
                justifyContent: "space-between",
                minHeight: "44px",
            }}
        >

            {disabled ? (
                <div className="flex items-center justify-center w-full py-2">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Processing...</span>
                </div>
            ) : (
                <>
                    <div
                        style={{
                            background: "#fff",
                            minWidth: "55px",
                            padding: "1%",
                            textAlign: "center",
                            borderRadius: "12px 0px 0px 12px",
                        }}
                    >
                        <div className="relative w-[90%] h-[30px] mx-auto my-[8px]">
                            <Image
                                src="/images/lasco-favicon.png"
                                fill
                                style={{ objectFit: "contain" }}
                                alt="Lasco Pay"
                            />
                        </div>
                    </div>
                    <div
                        style={{
                            background: "#40e0d0",
                            color: "#fff",
                            padding: "7.5px 15px",
                            flex: 1,
                            textAlign: "center",
                            display: "flex",
                            justifyContent: "center",
                            alignItems: "center",
                            fontWeight: "bold",
                        }}
                    >
                        Pay with LascoPay
                    </div>
                </>
            )}
        </Button>
    );
} 