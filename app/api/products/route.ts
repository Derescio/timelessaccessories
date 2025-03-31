import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { Prisma } from "@prisma/client";

const productCreateSchema = z.object({
  name: z.string().min(3),
  description: z.string(),
  slug: z.string().min(3),
  price: z.number().min(0.01),
  costPrice: z.number().min(0.01),
  compareAtPrice: z.number().nullable().optional(),
  discountPercentage: z.number().min(0).max(100).optional(),
  hasDiscount: z.boolean().default(false),
  categoryId: z.string(),
  productTypeId: z.string(),
  sku: z.string().min(3),
  stock: z.number().int().min(0),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  imageUrl: z.string().nullable().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Check if user is authenticated and has admin role
    if (!session || session.user?.role !== "ADMIN") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Parse and validate request body
    const body = await req.json();
    const validatedData = productCreateSchema.parse(body);

    // Check if slug is already in use
    const existingProduct = await db.product.findUnique({
      where: { slug: validatedData.slug },
    });

    if (existingProduct) {
      return NextResponse.json(
        { success: false, error: "A product with this slug already exists" },
        { status: 400 }
      );
    }

    // Calculate the final price based on discount settings
    let retailPrice = validatedData.price;
    let compareAtPrice = null;
    let discountPercentage = null;
    let hasDiscount = false;

    if (validatedData.hasDiscount && validatedData.discountPercentage && validatedData.discountPercentage > 0) {
      hasDiscount = true;
      discountPercentage = validatedData.discountPercentage;
      compareAtPrice = retailPrice;
      retailPrice = retailPrice * (1 - (discountPercentage / 100));
    }

    // Create the product with its default inventory
    const product = await db.product.create({
      data: {
        name: validatedData.name,
        description: validatedData.description,
        slug: validatedData.slug,
        categoryId: validatedData.categoryId,
        productTypeId: validatedData.productTypeId,
        isActive: validatedData.isActive,
        isFeatured: validatedData.isFeatured,
        inventories: {
          create: [
            {
              sku: validatedData.sku,
              retailPrice: retailPrice,
              compareAtPrice: compareAtPrice,
              hasDiscount,
              discountPercentage,
              quantity: validatedData.stock,
              costPrice: validatedData.costPrice,
              images: validatedData.imageUrl ? [validatedData.imageUrl] : ["/images/placeholder-product.svg"],
              isDefault: true,
            }
          ]
        }
      },
      include: {
        inventories: true,
        category: true
      }
    });

    return NextResponse.json(
      { success: true, data: product },
      { status: 201 }
    );
  } catch (error) {
    console.error("[PRODUCTS_POST]", error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: "Validation error", 
          details: error.errors 
        },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "10");
        const search = searchParams.get("search") || "";
        const category = searchParams.get("category") || "";
        const sort = searchParams.get("sort") || "createdAt.desc";
        const [sortField, sortOrder] = sort.split(".");

        const skip = (page - 1) * limit;

        const orderBy: Prisma.ProductOrderByWithRelationInput = {
            [sortField]: sortOrder
        };

        const where: Prisma.ProductWhereInput = {};

        if (search) {
            where.OR = [
                { name: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } }
            ];
        }

        if (category) {
            where.categoryId = category;
        }

        const [products, total] = await Promise.all([
            db.product.findMany({
                where,
                orderBy,
                skip,
                take: limit,
                include: {
                    category: {
                        select: {
                            id: true,
                            name: true,
                            slug: true
                        }
                    },
                    inventories: {
                        where: { isDefault: true },
                        select: {
                            id: true,
                            retailPrice: true,
                            costPrice: true,
                            quantity: true,
                            sku: true,
                            images: true,
                            hasDiscount: true,
                            discountPercentage: true,
                            compareAtPrice: true
                        }
                    }
                }
            }),
            db.product.count({ where })
        ]);

        // Transform decimal values to numbers
        const transformedProducts = products.map(product => ({
            ...product,
            inventories: product.inventories.map(inventory => ({
                ...inventory,
                retailPrice: Number(inventory.retailPrice),
                costPrice: Number(inventory.costPrice),
                compareAtPrice: inventory.compareAtPrice ? Number(inventory.compareAtPrice) : null
            }))
        }));

        return NextResponse.json({
            success: true,
            data: transformedProducts,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error("Error fetching products:", error);
        return NextResponse.json(
            { success: false, error: "Failed to fetch products" },
            { status: 500 }
        );
    }
}
