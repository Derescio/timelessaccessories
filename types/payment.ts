/**
 * Payment Types Module
 * 
 * This module contains type definitions for payment-related functionality.
 * Created as part of the payment system refactoring to improve type safety.
 */

export interface PaymentResult {
    success: boolean;
    message: string;
    data?: {
        id: string;
        status: string;
        providerId?: string;
    };
} 