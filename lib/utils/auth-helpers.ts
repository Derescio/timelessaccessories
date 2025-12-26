"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

/**
 * Get the authenticated user from session
 * Returns null if not authenticated
 */
export async function getAuthenticatedUser() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    return user;
  } catch (error) {
    console.error("Error getting authenticated user:", error);
    return null;
  }
}

/**
 * Require authentication - returns error response if not authenticated
 * Returns { user, error: null } if authenticated, { user: null, error: NextResponse } if not
 */
export async function requireAuth(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Require admin role - verifies user exists in DB and has ADMIN role
 * Returns { user, error: null } if admin, { user: null, error: NextResponse } if not
 */
export async function requireAdmin(): Promise<
  | { user: NonNullable<Awaited<ReturnType<typeof getAuthenticatedUser>>>; error: null }
  | { user: null; error: NextResponse }
> {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      ),
    };
  }

  if (user.role !== "ADMIN") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      ),
    };
  }

  return { user, error: null };
}

/**
 * Check if user is authenticated (non-throwing)
 * Returns user if authenticated, null otherwise
 */
export async function checkAuth() {
  return await getAuthenticatedUser();
}

/**
 * Check if user is admin (non-throwing)
 * Returns user if admin, null otherwise
 */
export async function checkAdmin() {
  const user = await getAuthenticatedUser();
  return user && user.role === "ADMIN" ? user : null;
}

