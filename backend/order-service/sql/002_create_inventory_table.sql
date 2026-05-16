CREATE TABLE IF NOT EXISTS inventory (
  product_id TEXT PRIMARY KEY,
  product_name TEXT NOT NULL,
  stock INTEGER NOT NULL CHECK (stock >= 0),
  reserved INTEGER NOT NULL DEFAULT 0 CHECK (reserved >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO inventory (product_id, product_name, stock, reserved)
VALUES
  ('6a07b48c6d90bafb2d9be867', 'Mechanical Keyboard', 10, 0),
  ('6a07a6f5ec9d1bd1bd9c90b1', 'Wireless Mouse', 25, 0)
ON CONFLICT (product_id) DO NOTHING;
