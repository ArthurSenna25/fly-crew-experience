import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";

config();

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public' ORDER BY table_name`;
  console.log("Tables in Neon DB:");
  tables.forEach((t: any) => console.log(" -", t.table_name));
}

main().catch(console.error);
