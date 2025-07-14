'use client'

import React, { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface TypingTextProps {
    text: string | string[]
    className?: string
    speed?: number
    deleteSpeed?: number
    delayBetween?: number
    repeat?: boolean
    showCursor?: boolean
    cursorChar?: string
    onComplete?: () => void
}

export default function TypingText({
    text,
    className,
    speed = 100,
    deleteSpeed = 50,
    delayBetween = 2000,
    repeat = false,
    showCursor = true,
    cursorChar = '|',
    onComplete,
}: TypingTextProps) {
    const [displayText, setDisplayText] = useState('')
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isDeleting, setIsDeleting] = useState(false)
    const [textArrayIndex, setTextArrayIndex] = useState(0)
    const [showCursorBlink, setShowCursorBlink] = useState(true)

    const textArray = Array.isArray(text) ? text : [text]
    const currentText = textArray[textArrayIndex]

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (!isDeleting) {
                // Typing
                if (currentIndex < currentText.length) {
                    setDisplayText(currentText.slice(0, currentIndex + 1))
                    setCurrentIndex(currentIndex + 1)
                } else {
                    // Finished typing current text
                    if (textArray.length > 1) {
                        setTimeout(() => setIsDeleting(true), delayBetween)
                    } else if (onComplete) {
                        onComplete()
                    }
                }
            } else {
                // Deleting
                if (currentIndex > 0) {
                    setDisplayText(currentText.slice(0, currentIndex - 1))
                    setCurrentIndex(currentIndex - 1)
                } else {
                    // Finished deleting
                    setIsDeleting(false)
                    setTextArrayIndex((textArrayIndex + 1) % textArray.length)

                    if (!repeat && textArrayIndex === textArray.length - 1) {
                        return
                    }
                }
            }
        }, isDeleting ? deleteSpeed : speed)

        return () => clearTimeout(timeout)
    }, [currentIndex, isDeleting, currentText, textArray, textArrayIndex, speed, deleteSpeed, delayBetween, repeat, onComplete])

    useEffect(() => {
        const cursorInterval = setInterval(() => {
            setShowCursorBlink(prev => !prev)
        }, 500)

        return () => clearInterval(cursorInterval)
    }, [])

    return (
        <span className={cn('inline-block', className)}>
            {displayText}
            {showCursor && (
                <span
                    className={cn(
                        'inline-block ml-1 transition-opacity duration-100',
                        showCursorBlink ? 'opacity-100' : 'opacity-0'
                    )}
                >
                    {cursorChar}
                </span>
            )}
        </span>
    )
} 