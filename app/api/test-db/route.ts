import { testConnection } from "@/lib/db/test-connection";
import { NextResponse } from "next/server";

export async function GET() {
  const isConnected = await testConnection();
  
  if (isConnected) {
    return NextResponse.json({ status: "success", message: "Database connection successful" });
  } else {
    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 500 }
    );
  }
} 