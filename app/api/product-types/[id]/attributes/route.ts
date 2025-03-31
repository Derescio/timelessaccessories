import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const productTypeId = resolvedParams.id;
    // Check if we should filter by product or inventory attributes
    const forType = req.nextUrl.searchParams.get("for");
    
    let whereClause: {
      productTypeId: string;
      isForProduct?: boolean;
    } = {
      productTypeId: productTypeId
    };
    
    // Add filter for product or inventory attributes if specified
    if (forType === "product") {
      whereClause = {
        ...whereClause,
        isForProduct: true
      };
    } else if (forType === "inventory") {
      whereClause = {
        ...whereClause,
        isForProduct: false
      };
    }
    
    const attributes = await db.productTypeAttribute.findMany({
      where: whereClause,
      orderBy: {
        name: 'asc'
      }
    });
    
    return NextResponse.json({
      success: true,
      data: attributes
    });
  } catch (error) {
    console.error("[PRODUCT_TYPE_ATTRIBUTES_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
} 