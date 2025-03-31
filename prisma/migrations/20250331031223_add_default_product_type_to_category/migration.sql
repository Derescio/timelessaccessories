-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "defaultProductTypeId" TEXT;

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_defaultProductTypeId_fkey" FOREIGN KEY ("defaultProductTypeId") REFERENCES "ProductType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
