import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting migration script...');

  try {
    // 1. Find and mark all addresses from the address management page
    // This assumes that addresses from the address page are ones we want to mark
    // You might need to adjust this logic based on your specific criteria
    const addresses = await prisma.address.findMany();
    console.log(`Found ${addresses.length} addresses to process`);

    // Update all addresses created by checkout - set them to not show in the address book
    const updateNonUserManaged = await prisma.$executeRaw`
      UPDATE "Address" SET "isUserManaged" = false;
    `;
    console.log(`Updated ${updateNonUserManaged} addresses to non-user-managed`);

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 