CREATE TABLE IF NOT EXISTS inventory (
  product_id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL CHECK (stock >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  product_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
