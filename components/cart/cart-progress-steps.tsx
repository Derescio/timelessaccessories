"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ProgressStepsProps {
    currentStep: number
    totalSteps?: number
}

export default function ProgressSteps({ currentStep, totalSteps = 3 }: ProgressStepsProps) {
    // Define steps based on totalSteps
    const steps = totalSteps === 2
        ? [
            { id: 1, name: "Cart" },
            { id: 2, name: "Shipping & Payment" }
        ]
        : [
            { id: 1, name: "Cart" },
            { id: 2, name: "Shipping" },
            { id: 3, name: "Confirmation" }
        ]

    return (
        <div className="w-full">
            <div className="lg:block hidden">
                <nav aria-label="Progress">
                    <ol role="list" className="flex items-center">
                        {steps.map((step, stepIdx) => (
                            <li key={step.id} className={cn(
                                stepIdx !== steps.length - 1 ? "pr-8 sm:pr-20" : "",
                                "relative flex-1"
                            )}>
                                {step.id < currentStep ? (
                                    <div className="group flex items-start">
                                        <span className="flex-shrink-0 h-5 w-5 relative flex items-center justify-center">
                                            <Check className="h-4 w-4 text-primary" />
                                        </span>
                                        <span className="ml-2 text-sm font-medium text-primary">
                                            {step.name}
                                        </span>
                                    </div>
                                ) : step.id === currentStep ? (
                                    <div className="flex items-start" aria-current="step">
                                        <span className="flex-shrink-0 h-5 w-5 relative flex items-center justify-center">
                                            <span className="absolute h-4 w-4 rounded-full bg-primary-foreground" />
                                            <span className="relative block h-2 w-2 rounded-full bg-primary" />
                                        </span>
                                        <span className="ml-2 text-sm font-medium text-primary">
                                            {step.name}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="group flex items-start">
                                        <span className="flex-shrink-0 h-5 w-5 relative flex items-center justify-center">
                                            <span className="h-2 w-2 rounded-full bg-gray-300 group-hover:bg-gray-400" />
                                        </span>
                                        <span className="ml-2 text-sm font-medium text-gray-500 group-hover:text-gray-700">
                                            {step.name}
                                        </span>
                                    </div>
                                )}

                                {stepIdx !== steps.length - 1 ? (
                                    <div className="absolute top-2.5 left-5 hidden h-0.5 w-full lg:block">
                                        <div
                                            className={cn(
                                                step.id < currentStep ? "bg-primary" : "bg-gray-200",
                                                "h-0.5 w-full"
                                            )}
                                        />
                                    </div>
                                ) : null}
                            </li>
                        ))}
                    </ol>
                </nav>
            </div>

            {/* Mobile view */}
            <div className="lg:hidden flex items-center justify-between">
                {steps.map((step) => (
                    <div key={step.id} className="flex flex-col items-center">
                        <div className={cn(
                            "rounded-full flex items-center justify-center w-8 h-8 text-xs font-semibold",
                            step.id < currentStep
                                ? "bg-primary text-white"
                                : step.id === currentStep
                                    ? "border-2 border-primary text-primary"
                                    : "border border-gray-300 text-gray-500"
                        )}>
                            {step.id < currentStep ? <Check className="h-4 w-4" /> : step.id}
                        </div>
                        <span className={cn(
                            "text-xs mt-1",
                            step.id <= currentStep ? "text-primary" : "text-gray-500"
                        )}>
                            {step.name}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    )
}

