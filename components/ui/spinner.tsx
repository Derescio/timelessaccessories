import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
    size?: "sm" | "md" | "lg";
}

export function Spinner({
    className,
    size = "md",
    ...props
}: SpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-6 w-6",
        lg: "h-8 w-8"
    };

    return (
        <div
            className={cn("flex items-center justify-center", className)}
            {...props}
        >
            <Loader2
                className={cn(
                    "animate-spin text-primary",
                    sizeClasses[size]
                )}
            />
        </div>
    );
} 