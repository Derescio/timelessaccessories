import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const productTypes = await db.productType.findMany({
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: productTypes
    });
  } catch (error) {
    console.error("[PRODUCT_TYPES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
} 