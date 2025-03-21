/*
  Warnings:

  - Added the required column `name` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "OrderItem" ADD COLUMN     "image" TEXT,
ADD COLUMN     "name" TEXT NOT NULL;
