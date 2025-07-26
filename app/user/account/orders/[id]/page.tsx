"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    // CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { getOrderById, getOrderStatusActions, getUserAddress } from "@/lib/actions/user.actions"
import { formatPrice } from "@/lib/utils"
import { ArrowLeft, Package, CreditCard, Truck, CheckCircle, AlertCircle, Clock } from "lucide-react"

interface OrderItem {
    id: string;
    name: string;
    price: string | number;
    quantity: number;
    image?: string | null;
    attributes?: Record<string, string>;
    inventory: {
        sku: string;
    };
}

interface Payment {
    id: string;
    status: string;
    provider: string;
    amount: string | number;
    lastUpdated: string;
}

// interface ShippingAddress {
//     street: string;
//     city: string;
//     state: string;
//     postalCode: string;
//     country: string;
// }


interface PromotionUsage {
    id: string;
    couponCode: string | null;
    discountAmount: string;
    originalAmount: string;
    finalAmount: string;
    promotion: {
        id: string;
        name: string;
        description: string | null;
        promotionType: string;
    } | null;
}

interface Order {
    id: string;
    status: string;
    createdAt: string | Date;
    shippingAddress?: string | null;
    items: OrderItem[];
    payment?: Payment | null;
    subtotal: string | number;
    shipping: string | number;
    tax: string | number;
    total: string | number;
    promotionUsage?: PromotionUsage[];
}

export default function OrderDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [order, setOrder] = useState<Order | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [shippingAddress, setShippingAddress] = useState<string | null>(null);
    const [isLoadingAddress, setIsLoadingAddress] = useState(true);
    const [paymentStatus, setPaymentStatus] = useState<string>("PENDING")
    const [statusActions, setStatusActions] = useState({
        message: '',
        action: '',
        cta: null as string | null,
        ctaLink: null as string | null
    })

    useEffect(() => {
        async function fetchOrderDetails() {
            try {
                setIsLoading(true)
                const orderId = params.id as string
                const result = await getOrderById(orderId)

                if (!result.success) {
                    setError(result.message)
                    return
                }

                if (result.data) {
                    // Ensure we have the proper structure before setting to state
                    const orderData: Order = {
                        id: result.data.id,
                        status: result.data.status,
                        createdAt: result.data.createdAt,
                        shippingAddress: result.data.shippingAddress,
                        items: result.data.items,
                        payment: result.data.payment,
                        subtotal: result.data.subtotal,
                        shipping: result.data.shipping,
                        tax: result.data.tax,
                        total: result.data.total,
                        promotionUsage: result.data.promotionUsage
                    };

                    // Log detailed information about attributes in order items
                    // console.log('Order loaded:', orderData.id);
                    if (orderData.items && orderData.items.length > 0) {
                        //  console.log('Order contains', orderData.items.length, 'items');

                        orderData.items.forEach((item, index) => {
                            // console.log(`Item ${index + 1} (${item.name}):`, {
                            //     specifications: item.attributes,
                            //     hasSpecifications: item.attributes && Object.keys(item.attributes || {}).length > 0
                            // });
                        });
                    }

                    setOrder(orderData)
                    setPaymentStatus(result.data.payment?.status || "PENDING")
                } else {
                    setError("Order data is missing")
                }
            } catch (err) {
                console.error("Error fetching order details:", err)
                setError("Failed to load order details")
            } finally {
                setIsLoading(false)
            }
        }

        fetchOrderDetails()
    }, [params.id])

    // Debug: Log attributes when order changes
    useEffect(() => {
        if (order && order.items.length > 0) {
            // console.log('Order items in render:', order.items);
            // console.log('First item attributes in render:', order.items[0]?.attributes);
        }
    }, [order]);

    useEffect(() => {
        async function fetchStatusActions() {
            if (order && order.status) {
                const actions = await getOrderStatusActions(order.status, paymentStatus)
                setStatusActions(actions)
            }
        }

        if (order) {
            fetchStatusActions()
        }
    }, [order, paymentStatus])

    useEffect(() => {
        async function fetchShippingAddress() {
            try {
                const address = await getUserAddress(); // Fetch the address from the server
                setShippingAddress(address ? JSON.stringify(address) : null); // Store the address as a string
            } catch (error) {
                console.error("Error fetching shipping address:", error);
                setShippingAddress(null);
            } finally {
                setIsLoadingAddress(false); // Stop the loading state
            }
        }
        fetchShippingAddress();
    }, []);

    if (isLoadingAddress) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        );
    }

    // Format the date to a readable string
    function formatDate(dateString: string | Date) {
        const date = new Date(dateString)
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    // Get the appropriate status color
    function getStatusColor(status: string) {
        switch (status) {
            case 'PENDING':
                return "bg-yellow-100 text-yellow-800"
            case 'PROCESSING':
                return "bg-blue-100 text-blue-800"
            case 'SHIPPED':
                return "bg-indigo-100 text-indigo-800"
            case 'DELIVERED':
                return "bg-green-100 text-green-800"
            case 'CANCELLED':
                return "bg-red-100 text-red-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    // Get the appropriate payment status color
    function getPaymentStatusColor(status: string) {
        switch (status) {
            case 'PENDING':
                return "bg-yellow-100 text-yellow-800"
            case 'COMPLETED':
                return "bg-green-100 text-green-800"
            case 'FAILED':
                return "bg-red-100 text-red-800"
            case 'REFUNDED':
                return "bg-purple-100 text-purple-800"
            default:
                return "bg-gray-100 text-gray-800"
        }
    }

    // Get the appropriate status icon
    function getStatusIcon(status: string) {
        switch (status) {
            case 'PENDING':
                return <Clock className="h-5 w-5 text-yellow-600" />
            case 'PROCESSING':
                return <Package className="h-5 w-5 text-blue-600" />
            case 'SHIPPED':
                return <Truck className="h-5 w-5 text-indigo-600" />
            case 'DELIVERED':
                return <CheckCircle className="h-5 w-5 text-green-600" />
            case 'CANCELLED':
                return <AlertCircle className="h-5 w-5 text-red-600" />
            default:
                return <Package className="h-5 w-5 text-gray-600" />
        }
    }

    // Get payment method icon
    function getPaymentIcon() {
        return <CreditCard className="h-5 w-5 text-gray-600" />
    }

    // Parse shipping address from JSON string
    // const getShippingAddress = (): ShippingAddress | null => {
    //     if (!order?.shippingAddress) return null;

    //     try {
    //         return typeof order.shippingAddress === 'string'
    //             ? JSON.parse(order.shippingAddress)
    //             : order.shippingAddress;
    //     } catch (e) {
    //         console.error("Error parsing shipping address:", e);
    //         return null;
    //     }
    // }

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>
        )
    }

    if (error || !order) {
        return (
            <div className="space-y-6">
                <div className="flex items-center">
                    <Button
                        variant="ghost"
                        className="mr-4"
                        onClick={() => router.back()}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-2xl font-light">ORDER DETAILS</h1>
                </div>

                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>
                        {error || "Order not found. Please try again or contact customer support."}
                    </AlertDescription>
                </Alert>

                <Button asChild>
                    <Link href="/user/account/orders">View All Orders</Link>
                </Button>
            </div>
        )
    }

    //const shippingAddress = getUserAddress();
    console.log("Shipping address:", shippingAddress)
    // const newShippingAddress = result?.data?.shippingAddress


    return (
        <div className="space-y-6">
            <div className="flex items-center">
                <Button
                    variant="ghost"
                    className="mr-4"
                    onClick={() => router.back()}
                >
                    <ArrowLeft className="h-4 w-4 mr-2" /> Back
                </Button>
                <h1 className="text-2xl font-light">
                    ORDER #{order.id.substring(0, 8).toUpperCase()}
                </h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 space-y-6">
                    {/* Order Status Card */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle>Order Status</CardTitle>
                                <Badge className={getStatusColor(order.status)}>
                                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                                </Badge>
                            </div>
                            <CardDescription>
                                Placed on {formatDate(order.createdAt)}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="pb-3">
                            <div className="flex items-start space-x-4">
                                {getStatusIcon(order.status)}
                                <div>
                                    <p className="font-medium">{statusActions.message}</p>
                                    <p className="text-sm text-gray-500 mt-1">{statusActions.action}</p>
                                </div>
                            </div>
                        </CardContent>
                        {/* {statusActions.cta && (
                            <CardFooter>
                                <Button asChild>
                                    <Link href={statusActions.ctaLink || "#"}>
                                        {statusActions.cta}
                                    </Link>
                                </Button>
                            </CardFooter>
                        )} */}
                    </Card>

                    {/* Order Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Order Items</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {order.items.map((item) => (
                                    <div key={item.id} className="flex items-start space-x-4 border-b border-gray-100 pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                                        <div className="relative w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                                            {item.image ? (
                                                <Image
                                                    src={item.image}
                                                    alt={item.name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No image
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="font-medium text-base">{item.name}</h4>
                                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-500 mt-1">
                                                <span>Quantity: {item.quantity}</span>
                                                <span>Price: {formatPrice(Number(item.price))}</span>
                                            </div>

                                            {/* Display item specifications if available */}
                                            {item.attributes && Object.keys(item.attributes).length > 0 && (
                                                <div className="mt-2 text-sm text-gray-700 border-t border-gray-100 pt-2">
                                                    <h4 className="font-medium mb-1 text-gray-600">Specifications</h4>
                                                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                                        {Object.entries(item.attributes as Record<string, string>).map(([key, value]) => (
                                                            <div key={key} className="flex items-center">
                                                                <span className="text-gray-500 mr-2">{key}:</span>
                                                                <span className="font-medium">{value}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <div className="text-right">
                                            <div className="font-medium">{formatPrice(Number(item.price) * item.quantity)}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-6">
                    {/* Payment Information */}
                    <Card>
                        <CardHeader className="pb-3">
                            <div className="flex justify-between items-center">
                                <CardTitle>Payment</CardTitle>
                                <Badge className={getPaymentStatusColor(paymentStatus)}>
                                    {paymentStatus.charAt(0) + paymentStatus.slice(1).toLowerCase()}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="pb-3">
                            {order.payment ? (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            {getPaymentIcon()}
                                            <span>{order.payment.provider}</span>
                                        </div>
                                        <span>{formatPrice(Number(order.payment.amount))}</span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Last updated: {formatDate(order.payment.lastUpdated)}
                                    </div>
                                </div>
                            ) : (
                                <div className="text-yellow-600 flex items-center">
                                    <AlertCircle className="h-4 w-4 mr-2" />
                                    Payment pending
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Order Summary */}
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle>Order Summary</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Subtotal:</span>
                                    <span>{formatPrice(Number(order.subtotal))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Shipping:</span>
                                    <span>{formatPrice(Number(order.shipping))}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500">Tax:</span>
                                    <span>{formatPrice(Number(order.tax))}</span>
                                </div>

                                {/* Display promotion usage if available */}
                                {order.promotionUsage && order.promotionUsage.length > 0 && (
                                    order.promotionUsage.map((promo) => (
                                        <div key={promo.id} className="flex justify-between text-sm text-green-600">
                                            <span className="flex items-center">
                                                <Badge variant="outline" className="mr-2 text-xs bg-green-50 text-green-700 border-green-200">
                                                    {promo.couponCode || 'PROMO'}
                                                </Badge>
                                                Discount Applied:
                                            </span>
                                            <span>-{formatPrice(Number(promo.discountAmount))}</span>
                                        </div>
                                    ))
                                )}

                                <Separator className="my-2" />
                                <div className="flex justify-between font-medium text-base">
                                    <span>Total:</span>
                                    <span className="text-primary">{formatPrice(Number(order.total))}</span>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Shipping Address */}
                    {/* <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-6"> */}
                    {shippingAddress && (
                        <Card>
                            <CardHeader>
                                <CardTitle>Shipping Address</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-1">
                                    {shippingAddress && typeof shippingAddress === "string" && (
                                        (() => {
                                            try {
                                                const parsedAddress = JSON.parse(shippingAddress);
                                                //      console.log("Parsed shippingAddress:", parsedAddress); // Debugging

                                                return (
                                                    <>
                                                        <p><strong>Street:</strong> {parsedAddress.street || "N/A"}</p>
                                                        <p><strong>City:</strong> {parsedAddress.city || "N/A"}</p>
                                                        <p><strong>State:</strong> {parsedAddress.state || "N/A"}</p>
                                                        <p><strong>Postal Code:</strong> {parsedAddress.postalCode || "N/A"}</p>
                                                        <p><strong>Country:</strong> {parsedAddress.country || "N/A"}</p>
                                                    </>
                                                );
                                            } catch (error) {
                                                console.error("Error parsing shipping address:", error);
                                                return <p className="text-red-500">Invalid shipping address format.</p>;
                                            }
                                        })()
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                    {/* </div>
                        </div>
                    </div> */}
                </div>
            </div>
        </div>
    )
} 