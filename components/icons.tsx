"use client";

// Define proper props type for SVG icons
interface IconProps {
    className?: string;
    width?: number | string;
    height?: number | string;
    // Use a more specific type for SVG attributes
    [key: string]: string | number | undefined;
}

// This is a collection of SVG icons used throughout the application
export const Icons = {
    // PayPal logo SVG 
    paypal: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <path d="M19 5a4 4 0 0 0-4-4h-8a4 4 0 0 0-4 4v10a4 4 0 0 0 4 4h8a4 4 0 0 0 4-4v-10z" />
            <rect x="6" y="9" width="6" height="3" />
            <line x1="6" y1="15" x2="12" y2="15" />
        </svg>
    ),

    // Stripe logo SVG
    stripe: (props: IconProps) => (
        <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            {...props}
        >
            <path
                d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            <path
                d="M6 13H18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    ),

    // Cash payment icon
    cash: (props: IconProps) => (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            {...props}
        >
            <rect x="2" y="6" width="20" height="12" rx="2" />
            <circle cx="12" cy="12" r="2" />
            <path d="M6 12h.01M18 12h.01" />
        </svg>
    ),
}; 