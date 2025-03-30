-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "userId" TEXT;

-- CreateIndex
CREATE INDEX "Category_userId_idx" ON "Category"("userId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
