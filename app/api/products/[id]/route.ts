import { NextResponse } from "next/server";
import { getProductById, updateProductWithAttributes } from "@/lib/actions/product.actions";

export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;

        const result = await getProductById(productId);

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to fetch product" },
                { status: 404 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in GET /api/products/[id]:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const resolvedParams = await params;
        const productId = resolvedParams.id;
        const body = await request.json();

        const result = await updateProductWithAttributes({
            ...body,
            id: productId
        });

        if (!result.success) {
            return NextResponse.json(
                { error: result.error || "Failed to update product" },
                { status: 400 }
            );
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error in PATCH /api/products/[id]:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
} 