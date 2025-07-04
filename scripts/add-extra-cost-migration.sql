-- Migration: Add extraCost field to attribute value tables
-- This enables variant pricing based on attribute values
-- Add extraCost to ProductAttributeValue table
ALTER TABLE "ProductAttributeValue"
ADD COLUMN "extraCost" DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
-- Add extraCost to InventoryAttributeValue table  
ALTER TABLE "InventoryAttributeValue"
ADD COLUMN "extraCost" DECIMAL(10, 2) NOT NULL DEFAULT 0.00;
-- Add comments for documentation
COMMENT ON COLUMN "ProductAttributeValue"."extraCost" IS 'Additional cost modifier for this attribute value (e.g., +$25 for Silver material)';
COMMENT ON COLUMN "InventoryAttributeValue"."extraCost" IS 'Additional cost modifier for this inventory attribute value (e.g., +$100 for 16GB RAM)';
-- Example data updates (uncomment to apply):
-- UPDATE "ProductAttributeValue" SET "extraCost" = 25.00 WHERE "value" = 'Silver';
-- UPDATE "ProductAttributeValue" SET "extraCost" = 50.00 WHERE "value" = 'Gold'; 
-- UPDATE "InventoryAttributeValue" SET "extraCost" = 100.00 WHERE "value" = '16GB';
-- UPDATE "InventoryAttributeValue" SET "extraCost" = 200.00 WHERE "value" = '32GB';