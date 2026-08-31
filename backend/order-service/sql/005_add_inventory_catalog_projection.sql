-- Supports the catalog-driven inventory projection for databases created
-- before these columns were part of 002_create_inventory_table.sql.
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0;

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS product_updated_at TIMESTAMPTZ;
