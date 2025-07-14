'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface ShinyTextProps {
    text: string
    className?: string
    animationDuration?: string
    disabled?: boolean
}

export default function ShinyText({
    text,
    className,
    animationDuration = '2s',
    disabled = false,
}: ShinyTextProps) {
    return (
        <span
            className={cn(
                'inline-block bg-gradient-to-r from-gray-900 via-gray-900 via-yellow-500 via-yellow-400 via-gray-900 to-gray-900 bg-clip-text text-transparent bg-[length:200%_100%] animate-shimmer',
                disabled && 'animate-none bg-gradient-to-r from-gray-900 to-gray-900',
                className
            )}
            style={{
                animationDuration: disabled ? '0s' : animationDuration,
                backgroundPosition: disabled ? '0% 0%' : '-200% 0%',
            }}
        >
            {text}
        </span>
    )
} 