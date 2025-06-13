'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCartPromotions } from '@/hooks/use-cart-promotions';
import Link from 'next/link';
import { ShoppingCart, User, UserCheck, AlertCircle, CheckCircle } from 'lucide-react';

export default function TestCheckoutFlowPage() {
    const { data: session, status } = useSession();
    const { appliedPromotions, clearPromotions } = useCartPromotions();
    const [testResults, setTestResults] = useState<Array<{
        test: string;
        status: 'pending' | 'pass' | 'fail';
        details?: string;
    }>>([]);

    const isAuthenticated = status === 'authenticated';

    const addTestResult = (test: string, status: 'pass' | 'fail', details?: string) => {
        setTestResults(prev => [
            ...prev.filter(r => r.test !== test),
            { test, status, details }
        ]);
    };

    const clearTestResults = () => {
        setTestResults([]);
    };

    const testScenarios = [
        {
            id: 'guest-no-promo',
            title: 'Guest Checkout (No Promotions)',
            description: 'Test guest user checkout flow without any promotions applied',
            steps: [
                '1. Ensure you are signed out',
                '2. Clear any applied promotions',
                '3. Add items to cart',
                '4. Proceed through checkout as guest',
                '5. Complete payment',
                '6. Verify order total matches cart total + shipping + tax'
            ],
            requirements: 'Must be signed out, no promotions applied'
        },
        {
            id: 'authenticated-no-promo',
            title: 'Authenticated Checkout (No Promotions)',
            description: 'Test signed-in user checkout flow without any promotions applied',
            steps: [
                '1. Ensure you are signed in',
                '2. Clear any applied promotions',
                '3. Add items to cart',
                '4. Proceed through checkout as authenticated user',
                '5. Complete payment',
                '6. Verify order total matches cart total + shipping + tax'
            ],
            requirements: 'Must be signed in, no promotions applied'
        },
        {
            id: 'guest-to-auth-welcome10',
            title: 'Guest → Sign Up → WELCOME10 Usage',
            description: 'Test that WELCOME10 can only be used once per user across guest/auth states',
            steps: [
                '1. As guest, use WELCOME10 and complete order',
                '2. Sign up with same email used in guest order',
                '3. Try to use WELCOME10 again',
                '4. Should be rejected as already used',
                '5. Verify one-time usage enforcement'
            ],
            requirements: 'Email tracking for guest-to-user promotion usage'
        }
    ];

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            <h1 className="text-3xl font-bold mb-6">Checkout Flow Test Suite</h1>

            {/* Current Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Authentication Status
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {isAuthenticated ? (
                                <>
                                    <UserCheck className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">Signed in as {session?.user?.email}</span>
                                </>
                            ) : (
                                <>
                                    <User className="h-4 w-4 text-gray-600" />
                                    <span className="text-sm">Guest user</span>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4" />
                            Applied Promotions
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            {appliedPromotions.length > 0 ? (
                                <>
                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                    <span className="text-sm">{appliedPromotions.length} promotion(s) active</span>
                                </>
                            ) : (
                                <>
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                    <span className="text-sm">No promotions applied</span>
                                </>
                            )}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">Test Results</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-sm">
                            <span className="text-green-600">{testResults.filter(r => r.status === 'pass').length} passed</span>
                            {' • '}
                            <span className="text-red-600">{testResults.filter(r => r.status === 'fail').length} failed</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card className="mb-8">
                <CardHeader>
                    <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-2">
                        {isAuthenticated ? (
                            <Button variant="outline" onClick={() => signOut()}>
                                Sign Out
                            </Button>
                        ) : (
                            <Button variant="outline" onClick={() => signIn()}>
                                Sign In
                            </Button>
                        )}

                        <Button
                            variant="outline"
                            onClick={clearPromotions}
                            disabled={appliedPromotions.length === 0}
                        >
                            Clear Promotions ({appliedPromotions.length})
                        </Button>

                        <Button variant="outline" onClick={clearTestResults}>
                            Clear Test Results
                        </Button>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" asChild>
                            <Link href="/cart-demo">Go to Cart Demo</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/cart">Go to Cart</Link>
                        </Button>
                        <Button variant="outline" asChild>
                            <Link href="/shipping?guest=true">Go to Shipping</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Test Scenarios */}
            <div className="space-y-6">
                <h2 className="text-2xl font-semibold">Test Scenarios</h2>

                {testScenarios.map((scenario) => {
                    const testResult = testResults.find(r => r.test === scenario.id);

                    return (
                        <Card key={scenario.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg">{scenario.title}</CardTitle>
                                    {testResult && (
                                        <Badge variant={testResult.status === 'pass' ? 'default' : 'destructive'}>
                                            {testResult.status === 'pass' ? 'PASS' : 'FAIL'}
                                        </Badge>
                                    )}
                                </div>
                                <p className="text-sm text-gray-600">{scenario.description}</p>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="font-medium mb-2">Requirements:</h4>
                                    <p className="text-sm text-gray-600">{scenario.requirements}</p>
                                </div>

                                <div>
                                    <h4 className="font-medium mb-2">Test Steps:</h4>
                                    <ol className="text-sm space-y-1">
                                        {scenario.steps.map((step, index) => (
                                            <li key={index} className="text-gray-600">{step}</li>
                                        ))}
                                    </ol>
                                </div>

                                {testResult?.details && (
                                    <div className="bg-gray-50 p-3 rounded-md">
                                        <h4 className="font-medium mb-1">Test Details:</h4>
                                        <p className="text-sm text-gray-600">{testResult.details}</p>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addTestResult(scenario.id, 'pass', 'Manual test completed successfully')}
                                    >
                                        Mark as Pass
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => addTestResult(scenario.id, 'fail', 'Manual test failed - see details')}
                                    >
                                        Mark as Fail
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Current Applied Promotions */}
            {appliedPromotions.length > 0 && (
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle className="text-lg text-orange-600">⚠️ Active Promotions</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-gray-600 mb-3">
                            The following promotions are currently applied. Clear them before testing no-promotion scenarios:
                        </p>
                        <div className="space-y-2">
                            {appliedPromotions.map((promo) => (
                                <div key={promo.id} className="flex justify-between items-center p-2 bg-orange-50 border border-orange-200 rounded">
                                    <div>
                                        <span className="font-medium">{promo.couponCode}</span>
                                        <span className="text-sm text-gray-600 ml-2">{promo.name}</span>
                                    </div>
                                    <span className="text-orange-600 font-medium">${promo.discount.toFixed(2)} off</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Testing Instructions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-medium mb-2">Before Testing:</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                            <li>• Ensure you have test products in your cart or use the cart demo</li>
                            <li>• Clear any existing promotions if testing no-promotion scenarios</li>
                            <li>• Note your authentication status</li>
                            <li>• Have test payment methods ready</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">What to Verify:</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                            <li>• Order totals are calculated correctly without promotions</li>
                            <li>• Tax is calculated on full subtotal (not discounted amount)</li>
                            <li>• Shipping costs are applied correctly</li>
                            <li>• Payment processing works for both guest and authenticated users</li>
                            <li>• WELCOME10 usage is properly tracked across guest/auth states</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium mb-2">Expected Behavior:</h4>
                        <ul className="text-sm space-y-1 text-gray-600">
                            <li>• Guest checkout: Email required, no saved addresses</li>
                            <li>• Authenticated checkout: Email pre-filled, saved addresses available</li>
                            <li>• No promotion discounts applied to order totals</li>
                            <li>• WELCOME10 should only work once per email address</li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
} 