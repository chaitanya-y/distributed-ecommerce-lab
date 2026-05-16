import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function connectPostgres() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing");
  }

  const client = await pool.connect();

  try {
    await client.query("SELECT 1");
    console.log("Connected to PostgreSQL");
  } finally {
    client.release();
  }
}
