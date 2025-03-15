"use client"

import type React from "react"

import { forwardRef } from "react"
import { Input as ShadcnInput } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string
}

const Input = forwardRef<HTMLInputElement, InputProps>(({ className, error, ...props }, ref) => {
    return (
        <div className="space-y-1">
            <ShadcnInput
                className={cn(error && "border-red-500 focus-visible:ring-red-500", className)}
                ref={ref}
                {...props}
            />
            {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
    )
})
Input.displayName = "Input"

export { Input }

