import { testConnection } from "@/lib/db/test-connection";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/utils/auth-helpers";

export async function GET() {
  // Require admin authentication - database connection status is sensitive
  const authResult = await requireAdmin();
  if (authResult.error) {
    return authResult.error;
  }

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