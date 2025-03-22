// /* eslint-disable */
// "use client";

// import { useEffect, useRef } from "react";
// import Script from "next/script";

// // Declare PayPal on window
// declare global {
//     interface Window {
//         paypal?: PayPalNamespace;
//     }
// }

// // Define PayPal namespace interface
// interface PayPalNamespace {
//     Buttons: (config: PayPalButtonsConfig) => { render: (element: HTMLElement) => void };
// }

// // Define PayPal Buttons config
// interface PayPalButtonsConfig {
//     createOrder: (data: unknown, actions: PayPalActions) => Promise<string>;
//     onApprove: (data: PayPalApproveData, actions: PayPalActions) => Promise<void>;
//     onError: (err: Error) => void;
// }

// // Define PayPal actions
// interface PayPalActions {
//     order: {
//         create: (orderData: PayPalOrderData) => Promise<string>;
//         capture: () => Promise<PayPalCaptureDetails>;
//     };
// }

// // Define PayPal order data
// interface PayPalOrderData {
//     intent: "CAPTURE";
//     purchase_units: {
//         amount: {
//             currency_code: string;
//             value: string;
//         };
//     }[];
// }

// // Define PayPal approve data
// interface PayPalApproveData {
//     orderID: string;
//     payerID?: string;
//     [key: string]: unknown;
// }

// // Define PayPal capture details
// interface PayPalCaptureDetails {
//     id: string;
//     status: string;
//     payer?: {
//         email_address?: string;
//         payer_id?: string;
//         name?: {
//             given_name?: string;
//             surname?: string;
//         };
//     };
//     [key: string]: unknown;
// }

// interface BasicPayPalButtonsProps {
//     amount: number;
//     onSuccess?: (details: PayPalCaptureDetails) => void;
//     onError?: (error: Error) => void;
// }

// export default function BasicPayPalButtons({ amount, onSuccess, onError }: BasicPayPalButtonsProps) {
//     const paypalButtonsRef = useRef<HTMLDivElement>(null);
//     const hasRenderedRef = useRef(false);

//     useEffect(() => {
//         // Define the function to render PayPal buttons
//         const renderPayPalButtons = () => {
//             if (!paypalButtonsRef.current || hasRenderedRef.current) return;

//             // Check if the PayPal JavaScript SDK has been loaded
//             if (!window.paypal) {
//                 console.error("PayPal SDK not loaded yet");
//                 return;
//             }

//             console.log("Rendering PayPal buttons with PayPal SDK");
//             hasRenderedRef.current = true;

//             // Clear the container first
//             paypalButtonsRef.current.innerHTML = "";

//             // @ts-expect-error - PayPal global is loaded by script and types might not match perfectly
//             window.paypal.Buttons({
//                 // Set up the transaction
//                 createOrder: function (data: unknown, actions: PayPalActions) {
//                     console.log("Creating order for amount:", amount);
//                     return actions.order.create({
//                         intent: "CAPTURE",
//                         purchase_units: [{
//                             amount: {
//                                 currency_code: "USD",
//                                 value: amount.toString()
//                             }
//                         }]
//                     });
//                 },

//                 // Finalize the transaction
//                 onApprove: function (data: PayPalApproveData, actions: PayPalActions) {
//                     console.log("Order approved:", data);
//                     return actions.order.capture().then(function (details: PayPalCaptureDetails) {
//                         console.log("Transaction completed:", details);
//                         if (onSuccess) {
//                             onSuccess(details);
//                         }
//                     });
//                 },

//                 // Handle errors
//                 onError: function (err: Error) {
//                     console.error("PayPal error:", err);
//                     if (onError) {
//                         onError(err);
//                     }
//                 }
//             }).render(paypalButtonsRef.current);
//         };

//         // If the SDK is already loaded, render buttons immediately
//         if (window.paypal) {
//             renderPayPalButtons();
//         }

//         // Add event listener for when the SDK finishes loading
//         const handlePayPalLoad = () => {
//             console.log("PayPal SDK loaded");
//             renderPayPalButtons();
//         };

//         window.addEventListener("paypal-sdk-loaded", handlePayPalLoad);

//         return () => {
//             window.removeEventListener("paypal-sdk-loaded", handlePayPalLoad);
//         };
//     }, [amount, onSuccess, onError]);

//     return (
//         <div className="w-full">
//             <Script
//                 src={`https://www.paypal.com/sdk/js?client-id=AQB2OjTPdbWx7DCCODYKB4vcnGg8dczEO8accLkoCBBiiy3nnQoxoImZ00n5c6BsEWE7QkFkQ9-uCXO_&currency=USD`}
//                 strategy="lazyOnload"
//                 onLoad={() => {
//                     console.log("PayPal script loaded");
//                     window.dispatchEvent(new Event("paypal-sdk-loaded"));
//                 }}
//             />
//             <div className="bg-gray-100 border rounded p-4 mb-4">
//                 <p className="text-sm text-gray-600">
//                     Test Mode: Clicking PayPal will create a payment for ${amount.toFixed(2)}
//                 </p>
//             </div>
//             <div ref={paypalButtonsRef} className="paypal-button-container" />
//         </div>
//     );
// } 