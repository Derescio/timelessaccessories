-- Add userId column to Category table
ALTER TABLE "Category"
ADD COLUMN "userId" TEXT;
-- Add an index to userId
CREATE INDEX "Category_userId_idx" ON "Category"("userId");
-- Add foreign key constraint
ALTER TABLE "Category"
ADD CONSTRAINT "Category_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE
SET NULL ON UPDATE CASCADE;
-- Update existing categories to set the userId of the first admin user
UPDATE "Category"
SET "userId" = (
        SELECT id
        FROM "User"
        WHERE role = 'ADMIN'
        LIMIT 1
    );