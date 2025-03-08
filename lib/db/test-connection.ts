import { prisma } from "./config";

export async function testConnection() {
  try {
    // Test the connection by attempting a simple query
    const result = await prisma.$queryRaw`SELECT 1+1 as result`;
    console.log("✅ Database connection successful:", result);
    return true;
  } catch (error) {
    console.error("❌ Database connection failed:", error);
    return false;
  } finally {
    await prisma.$disconnect();
  }
} 