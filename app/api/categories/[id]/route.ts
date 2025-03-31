import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Get the ID from the route params
    const resolvedParams = await params;
    const id = resolvedParams.id;
    
    // Find the category with its default product type
    const category = await db.category.findUnique({
      where: {
        id
      },
      include: {
        defaultProductType: true,
        parent: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: "Category not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error("[CATEGORY_GET]", error);
    return NextResponse.json(
      { success: false, error: "Internal error" },
      { status: 500 }
    );
  }
} 