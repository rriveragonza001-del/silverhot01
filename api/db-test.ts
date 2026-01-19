import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const url = process.env.DATABASE_URL;
  if (!url) return res.status(500).json({ ok: false, error: "Missing DATABASE_URL" });

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const r = await client.query("select now() as now");
    return res.status(200).json({ ok: true, now: r.rows[0]?.now });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: e?.message ?? "DB error" });
  } finally {
    try { await client.end(); } catch {}
  }
}
