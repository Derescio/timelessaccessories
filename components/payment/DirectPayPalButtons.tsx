// "use client";

// import { useEffect, useRef, useState } from "react";
// import { toast } from "sonner";

// // Properly declare PayPal on window
// declare global {
//     interface Window {
//         paypal: any;
//     }
// }

// interface DirectPayPalButtonsProps {
//     amount: number;
//     onSuccess?: (details: any) => void;
//     onError?: (error: any) => void;
// }

// export default function DirectPayPalButtons({ amount, onSuccess, onError }: DirectPayPalButtonsProps) {
//     const paypalContainerRef = useRef<HTMLDivElement>(null);
//     const [scriptLoaded, setScriptLoaded] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         console.log("DirectPayPalButtons mounted with amount:", amount);

//         // Display container dimensions for debugging
//         const logContainerDimensions = () => {
//             if (paypalContainerRef.current) {
//                 const rect = paypalContainerRef.current.getBoundingClientRect();
//                 console.log("PayPal container dimensions:", {
//                     width: rect.width,
//                     height: rect.height,
//                     top: rect.top,
//                     left: rect.left,
//                     visible: rect.width > 0 && rect.height > 0
//                 });
//             } else {
//                 console.log("PayPal container reference not yet available");
//             }
//         };

//         // Log container dimensions initially and after a short delay
//         logContainerDimensions();
//         const timeoutId = setTimeout(logContainerDimensions, 1000);

//         return () => clearTimeout(timeoutId);
//     }, [amount]);

//     useEffect(() => {
//         // Only add the script once
//         if (!document.querySelector('script[src*="www.paypal.com/sdk/js"]')) {
//             const script = document.createElement('script');
//             // Using the exact client ID from your .env file
//             script.src = `https://www.paypal.com/sdk/js?client-id=AQB2OjTPdbWx7DCCODYKB4vcnGg8dczEO8accLkoCBBiiy3nnQoxoImZ00n5c6BsEWE7QkFkQ9-uCXO_&currency=USD&debug=true`;
//             script.async = true;

//             script.onload = () => {
//                 console.log("PayPal script loaded successfully");
//                 setScriptLoaded(true);
//             };

//             script.onerror = (e) => {
//                 console.error("Failed to load PayPal script", e);
//                 setError("Failed to load PayPal payment system. Please refresh or try a different payment method.");
//             };

//             document.body.appendChild(script);
//             console.log("PayPal script added to document body");

//             return () => {
//                 if (script.parentNode) {
//                     script.parentNode.removeChild(script);
//                 }
//             };
//         } else {
//             // Script already exists
//             console.log("PayPal script already exists in the document");
//             setScriptLoaded(true);
//         }
//     }, []);

//     useEffect(() => {
//         // Only render buttons when the script is loaded and the container is ready
//         if (scriptLoaded && paypalContainerRef.current) {
//             // Clear any existing buttons
//             paypalContainerRef.current.innerHTML = '';
//             console.log("PayPal container cleared, preparing to render buttons");

//             try {
//                 if (!window.paypal) {
//                     console.error("PayPal script loaded but window.paypal is not defined");
//                     setError("PayPal is not available. Please refresh the page.");
//                     return;
//                 }

//                 if (!window.paypal.Buttons) {
//                     console.error("PayPal script loaded but window.paypal.Buttons is not defined");
//                     setError("PayPal buttons are not available. Please refresh the page.");
//                     return;
//                 }

//                 console.log("Creating PayPal buttons with config:", {
//                     amount: amount,
//                     container: paypalContainerRef.current.id
//                 });

//                 // Add both debug=true and intent parameters
//                 window.paypal.Buttons({
//                     // Set up the transaction
//                     style: {
//                         layout: 'vertical',
//                         color: 'blue',
//                         shape: 'rect',
//                         label: 'paypal'
//                     },
//                     createOrder: function (data: any, actions: any) {
//                         console.log("Creating PayPal order for amount:", amount);
//                         return actions.order.create({
//                             intent: "CAPTURE",
//                             purchase_units: [{
//                                 amount: {
//                                     currency_code: "USD",
//                                     value: amount.toFixed(2)
//                                 }
//                             }]
//                         });
//                     },

//                     // Finalize the transaction
//                     onApprove: function (data: any, actions: any) {
//                         console.log("PayPal order approved:", data);
//                         return actions.order.capture().then(function (details: any) {
//                             console.log("Transaction completed:", details);
//                             toast.success(`Payment completed! Transaction ID: ${details.id}`);

//                             if (onSuccess) {
//                                 onSuccess(details);
//                             }
//                         });
//                     },

//                     // Handle errors
//                     onError: function (err: any) {
//                         console.error("PayPal error:", err);
//                         setError("There was an error processing your payment. Please try again.");

//                         if (onError) {
//                             onError(err);
//                         }
//                     },
//                     onInit: function () {
//                         console.log("PayPal button initialized");
//                     },
//                     onClick: function () {
//                         console.log("PayPal button clicked");
//                     }
//                 }).render(paypalContainerRef.current).then(() => {
//                     console.log("PayPal buttons rendered successfully");
//                 }).catch((renderError: any) => {
//                     console.error("Error rendering PayPal buttons:", renderError);
//                     setError("Failed to display PayPal buttons. Please try refreshing the page.");
//                 });

//             } catch (err) {
//                 console.error("Error setting up PayPal buttons:", err);
//                 setError("There was an error displaying PayPal. Please refresh the page.");
//             }
//         } else {
//             console.log("Not rendering PayPal buttons yet:", {
//                 scriptLoaded,
//                 containerExists: !!paypalContainerRef.current
//             });
//         }
//     }, [scriptLoaded, amount, onSuccess, onError]);

//     if (error) {
//         return (
//             <div className="bg-red-50 border border-red-200 rounded p-4">
//                 <p className="text-red-600">{error}</p>
//             </div>
//         );
//     }

//     return (
//         <div className="w-full border border-gray-200 rounded-md p-4">
//             <h3 className="text-sm font-medium mb-4">Secure Payment with PayPal</h3>
//             {!scriptLoaded && (
//                 <div className="text-center p-4 bg-gray-50 rounded">
//                     <p className="text-gray-600">Loading PayPal payment options...</p>
//                 </div>
//             )}

//             <div
//                 ref={paypalContainerRef}
//                 id="paypal-button-container"
//                 className="min-h-[200px] bg-white"
//                 style={{ minWidth: '250px' }}
//             />
//         </div>
//     );
// } 