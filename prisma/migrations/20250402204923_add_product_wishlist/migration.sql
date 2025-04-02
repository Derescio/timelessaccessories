-- CreateTable
CREATE TABLE "ProductWishlist" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductWishlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductWishlist_userId_idx" ON "ProductWishlist"("userId");

-- CreateIndex
CREATE INDEX "ProductWishlist_productId_idx" ON "ProductWishlist"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductWishlist_userId_productId_key" ON "ProductWishlist"("userId", "productId");

-- AddForeignKey
ALTER TABLE "ProductWishlist" ADD CONSTRAINT "ProductWishlist_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductWishlist" ADD CONSTRAINT "ProductWishlist_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
