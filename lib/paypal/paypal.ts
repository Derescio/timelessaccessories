/**
 * PayPal API Integration
 * 
 * This file contains utilities to interact with the PayPal API.
 */


// PayPal API URLs
const PAYPAL_API_URL = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com';
const base = process.env.PAYPAL_API_URL || 'https://api-m.sandbox.paypal.com'
// PayPal authentication
const PAYPAL_CLIENT_ID = process.env.PAYPAL_CLIENT_ID || '';
const PAYPAL_APP_SECRET = process.env.PAYPAL_APP_SECRET || '';

if (!PAYPAL_CLIENT_ID || !PAYPAL_APP_SECRET) {
  console.error('PayPal credentials are not configured properly');
}

// Response types
// interface PayPalTokenResponse {
//   access_token: string;
//   token_type: string;
//   app_id: string;
//   expires_in: number;
//   nonce: string;
// }

// interface PayPalOrderResponse {
//   id: string;
//   status: string;
//   links: Array<{
//     href: string;
//     rel: string;
//     method: string;
//   }>;
// }

// interface PayPalCaptureResponse {
//   id: string;
//   status: string;
//   payer?: {
//     email_address?: string;
//     payer_id?: string;
//   };
//   purchase_units?: Array<{
//     reference_id: string;
//     shipping?: {
//       name?: {
//         full_name?: string;
//       };
//       address?: {
//         address_line_1?: string;
//         admin_area_2?: string;
//         admin_area_1?: string;
//         postal_code?: string;
//         country_code?: string;
//       };
//     };
//     payments?: {
//       captures?: Array<{
//         id: string;
//         status: string;
//         amount: {
//           value: string;
//           currency_code: string;
//         };
//       }>;
//     };
//   }>;
// }

// Get PayPal access token
// async function getAccessToken(): Promise<string> {
//   try {
//     const auth = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');
    
//     const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/x-www-form-urlencoded',
//         'Authorization': `Basic ${auth}`
//       },
//       body: 'grant_type=client_credentials'
//     });
    
//     const data = await response.json();
    
//     if (!response.ok) {
//       throw new Error(data.error_description || 'Failed to get PayPal access token');
//     }
    
//     return data.access_token;
//   } catch (error) {
//     console.error('Error getting PayPal access token:', error);
//     throw error;
//   }
// }

export async function getAccessToken() {
  const { PAYPAL_CLIENT_ID, PAYPAL_APP_SECRET } = process.env;
  const authString = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_APP_SECRET}`).toString('base64');
  const response = await fetch(`${base}/v1/oauth2/token`, {
      method: 'POST',
      body: 'grant_type=client_credentials',
      headers: {

          Authorization: `Basic ${authString}`,
          'Content-Type': 'application/x-www-form-urlencoded',
      },

  });

  const data = await handleResponse(response);
  return data.access_token;

}

// Create PayPal order
// async function createOrder(amount: number, orderId: string) {
//   try {
//     const accessToken = await getAccessToken();
    
//     const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${accessToken}`
//       },
//       body: JSON.stringify({
//         intent: 'CAPTURE',
//         purchase_units: [
//           {
//             reference_id: orderId,
//             amount: {
//               currency_code: 'USD',
//               value: amount.toFixed(2)
//             }
//           }
//         ]
//       })
//     });
    
//     const data = await response.json();
    
//     if (!response.ok) {
//       throw new Error(data.message || 'Failed to create PayPal order');
//     }
    
//     return data;
//   } catch (error) {
//     console.error('Error creating PayPal order:', error);
//     throw error;
//   }
// }
async function createOrder(amount:number){
  const accessToken = await getAccessToken();
  const url = `${base}/v2/checkout/orders`;
  const response = await fetch(url, {
      method: 'post',
      headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
              {
                  amount: {
                      currency_code: 'USD',
                      value: amount,
                  },
              },
          ],
      }),
  });
  return handleResponse(response);
}

// Capture PayPal payment
async function capturePayment(paypalOrderId: string) {
  try {
    const accessToken = await getAccessToken();
    
    const response = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Failed to capture PayPal payment');
    }
    
    return data;
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    throw error;
  }
}

export const paypal = {
  createOrder,
  capturePayment
};

async function handleResponse(response: Response) {
  if (response.ok) {
      return response.json();

  } else {
      const error = await response.text();
      throw new Error(error);
  }
}