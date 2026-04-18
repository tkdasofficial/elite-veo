import { Pool } from "pg";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  const sql = fs.readFileSync(path.join(__dirname, "schema.sql"), "utf8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  for (const stmt of statements) {
    try {
      await pool.query(stmt);
    } catch (e: any) {
      if (!e.message?.includes("already exists")) {
        console.error("DB init error:", e.message, "\nSQL:", stmt.slice(0, 80));
      }
    }
  }
  console.log("Database initialized");
}
