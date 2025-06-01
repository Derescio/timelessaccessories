/**
 * Generic Order Email Testing Script
 * 
 * This script can be reused in other e-commerce applications to test order confirmation emails.
 * Simply update the configuration section below and the import path to match your email service.
 * 
 * Prerequisites:
 * - Email service function that accepts an orderId parameter
 * - Environment variables for email service (RESEND_API_KEY, SENDER_EMAIL, etc.)
 * - Valid order ID in your database
 * 
 * Usage:
 * 1. Update the CONFIG section below
 * 2. Run: npx tsx scripts/test-order-email.ts
 * 
 * For Nodemailer users:
 * - Change emailServiceConfig to include SMTP settings
 * - Update import path to your Nodemailer email service
 */

// ========================================
// CONFIGURATION - Update for your app
// ========================================

const CONFIG = {
  // Email service configuration
  emailService: 'resend', // 'resend' | 'nodemailer' | 'sendgrid' | 'custom'
  
  // Test order ID - replace with a valid order from your database
  testOrderId: 'cmbe1zv4q000320ocvh15af49',
  
  // Environment variables to check
  envVars: {
    resend: ['RESEND_API_KEY', 'SENDER_EMAIL'],
    nodemailer: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS'],
    sendgrid: ['SENDGRID_API_KEY', 'SENDER_EMAIL'],
    custom: ['EMAIL_API_KEY', 'SENDER_EMAIL']
  },
  
  // App-specific settings
  appName: process.env.NEXT_PUBLIC_APP_NAME || 'Your App Name',
  
  // Default sender email if not in env
  defaultSender: 'onboarding@resend.dev'
};

// ========================================
// IMPORT YOUR EMAIL SERVICE FUNCTION
// ========================================

// Update this import path to match your email service location
import { sendOrderConfirmationEmail } from '../email/index';

// For other email services, you might import from:
// import { sendOrderEmail } from '../lib/email/nodemailer';
// import { sendOrderEmail } from '../services/sendgrid';
// import { sendOrderEmail } from '../utils/email-service';

// ========================================
// TESTING LOGIC - Usually no changes needed
// ========================================

async function checkEnvironment(): Promise<boolean> {
  console.log('🔍 Checking environment variables...');
  
  const requiredVars = CONFIG.envVars[CONFIG.emailService as keyof typeof CONFIG.envVars] || [];
  let allValid = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    const status = value ? '✅ Set' : '❌ Missing';
    console.log(`${varName}: ${status}`);
    
    if (!value) {
      allValid = false;
    }
  }
  
  // Show additional info
  const senderEmail = process.env.SENDER_EMAIL || CONFIG.defaultSender;
  console.log(`SENDER_EMAIL: ${senderEmail}`);
  console.log(`APP_NAME: ${CONFIG.appName}`);
  
  if (!allValid) {
    console.error('❌ Missing required environment variables');
    console.log('\n📋 Required environment variables for', CONFIG.emailService + ':');
    requiredVars.forEach(varName => {
      console.log(`   - ${varName}`);
    });
  }
  
  return allValid;
}

async function testOrderEmail() {
  console.log(`🧪 Testing ${CONFIG.emailService} email service for ${CONFIG.appName}`);
  console.log('='.repeat(60));
  
  // Check environment
  const envValid = await checkEnvironment();
  if (!envValid) {
    console.log('\n💡 Set the missing environment variables and try again.');
    return;
  }
  
  console.log(`\n📧 Testing email for order: ${CONFIG.testOrderId}`);
  
  try {
    const startTime = Date.now();
    
    // Call your email service function
    await sendOrderConfirmationEmail(CONFIG.testOrderId);
    
    const duration = Date.now() - startTime;
    console.log(`✅ Email sent successfully! (${duration}ms)`);
    
    console.log('\n📬 Check your inbox for the test email.');
    console.log('📋 If no email received, check:');
    console.log('   - Spam/junk folder');
    console.log('   - Email service logs');
    console.log('   - Email address in order data');
    console.log('   - Email service quotas/limits');
    
  } catch (error) {
    console.error('❌ Email failed:', error);
    
    if (error instanceof Error) {
      console.error('\n🔍 Error details:');
      console.error('   Message:', error.message);
      console.error('   Stack:', error.stack);
      
      // Common error hints
      if (error.message.includes('React is not defined')) {
        console.log('\n💡 Hint: Add "import React from \'react\';" to your email templates');
      }
      
      if (error.message.includes('Order') && error.message.includes('not found')) {
        console.log(`\n💡 Hint: Order ${CONFIG.testOrderId} might not exist. Update CONFIG.testOrderId with a valid order ID.`);
      }
      
      if (error.message.includes('API') || error.message.includes('401')) {
        console.log('\n💡 Hint: Check your email service API credentials');
      }
    }
  }
}

// ========================================
// EXECUTION
// ========================================

console.log('🚀 Starting email test...\n');
testOrderEmail()
  .then(() => {
    console.log('\n✨ Test completed');
  })
  .catch((error) => {
    console.error('\n💥 Test failed with unexpected error:', error);
    process.exit(1);
  }); 