import dotenv from 'dotenv';
dotenv.config();

// Constants from environment
const CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const CLIENT_SECRET = process.env.PAYPAL_APP_SECRET || '';
const PAYPAL_API_BASE = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';

interface PayPalTokenResponse {
  access_token: string;
  token_type: string;
  app_id: string;
  expires_in: number;
  nonce: string;
  scope: string;
  [key: string]: any;
}

async function getAccessToken(): Promise<string> {
  try {
    if (!CLIENT_ID || !CLIENT_SECRET) {
      throw new Error('PayPal CLIENT_ID and CLIENT_SECRET must be configured in environment variables');
    }
    
    console.log('Using PayPal API URL:', PAYPAL_API_BASE);
    console.log('Using CLIENT_ID starting with:', CLIENT_ID.substring(0, 5) + '*'.repeat(CLIENT_ID.length - 5));
    
    const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    });

    const responseStatus = response.status;
    console.log('Response status:', responseStatus);
    
    const responseText = await response.text();
    console.log('Response body:', responseText.substring(0, 100) + (responseText.length > 100 ? '...' : ''));
    
    if (!response.ok) {
      throw new Error(`Failed to get PayPal access token: ${responseText}`);
    }

    const data = JSON.parse(responseText) as PayPalTokenResponse;
    
    // Logging token info without exposing the full token
    console.log('Authentication successful!');
    console.log('Token type:', data.token_type);
    console.log('Expires in:', data.expires_in, 'seconds');
    console.log('Scopes:', data.scope);
    
    return data.access_token;
  } catch (error) {
    console.error('Error getting PayPal access token:', error);
    throw new Error('Failed to authenticate with PayPal');
  }
}

// Self-executing async function to run the test
(async () => {
  console.log('Testing PayPal authentication...');
  try {
    const token = await getAccessToken();
    console.log('Token received successfully (first 5 chars):', token.substring(0, 5) + '*'.repeat(10));
    
    // Optional: Test token validity with a simple API call
    console.log('\nVerifying token with a test API call...');
    const verifyResponse = await fetch(`${PAYPAL_API_BASE}/v1/identity/oauth2/userinfo?schema=paypalv1.1`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });
    
    if (verifyResponse.ok) {
      const userData = await verifyResponse.json();
      console.log('Token verification successful! API response:', JSON.stringify(userData, null, 2));
    } else {
      const errorText = await verifyResponse.text();
      console.error('Token verification failed:', errorText);
    }
    
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  }
})(); 