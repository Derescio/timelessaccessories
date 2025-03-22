import { NextResponse } from "next/server";

// Simple endpoint to test PayPal connection
export async function GET() {
  return NextResponse.json({
    success: true,
    message: "PayPal test API is functioning",
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "Missing client ID"
  });
} 