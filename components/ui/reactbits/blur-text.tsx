'use client'

import React, { useEffect, useRef, useState } from 'react'
import { cn } from '@/lib/utils'

interface BlurTextProps {
    text: string
    className?: string
    delay?: number
    animateOnLoad?: boolean
    trigger?: boolean
}

export default function BlurText({
    text,
    className,
    delay = 200,
    animateOnLoad = true,
    trigger = true,
}: BlurTextProps) {
    const [isVisible, setIsVisible] = useState(false)
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (animateOnLoad) {
            const timer = setTimeout(() => setIsVisible(true), 100)
            return () => clearTimeout(timer)
        }
    }, [animateOnLoad])

    useEffect(() => {
        if (trigger && !animateOnLoad) {
            setIsVisible(true)
        }
    }, [trigger, animateOnLoad])

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !animateOnLoad) {
                    setIsVisible(true)
                }
            },
            { threshold: 0.1 }
        )

        if (ref.current) {
            observer.observe(ref.current)
        }

        return () => observer.disconnect()
    }, [animateOnLoad])

    return (
        <div ref={ref} className={cn('relative inline-block', className)}>
            {text.split('').map((char, index) => (
                <span
                    key={index}
                    className={cn(
                        'inline-block transition-all duration-500 ease-out',
                        isVisible
                            ? 'blur-0 opacity-100'
                            : 'blur-sm opacity-70'
                    )}
                    style={{
                        transitionDelay: isVisible ? `${index * delay}ms` : '0ms',
                    }}
                >
                    {char === ' ' ? '\u00A0' : char}
                </span>
            ))}
        </div>
    )
} 