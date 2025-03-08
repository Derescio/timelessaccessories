import { Resend } from 'resend';

// Initialize Resend client
export const resend = new Resend(process.env.RESEND_API_KEY);

// Email sender address - update this with your verified domain
export const emailFrom = 'noreply@timelessaccessories.com';

// Email templates configuration
export const emailConfig = {
  orderConfirmation: {
    subject: 'Order Confirmation - Timeless Accessories',
    template: 'order-confirmation',
  },
  welcomeEmail: {
    subject: 'Welcome to Timeless Accessories',
    template: 'welcome',
  },
  passwordReset: {
    subject: 'Reset Your Password - Timeless Accessories',
    template: 'password-reset',
  },
  shippingUpdate: {
    subject: 'Shipping Update - Timeless Accessories',
    template: 'shipping-update',
  },
} as const; 