import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const url = process.env.DATABASE_URL;
  if (!url) {
    return res.status(500).json({ ok: false, error: "Missing DATABASE_URL" });
  }

  const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });

  try {
    await client.connect();
    const r = await client.query("select now() as now");
    await client.end();

    return res.status(200).json({ ok: true, now: r.rows[0].now });
  } catch (e: any) {
    try { await client.end(); } catch {}
    return res.status(500).json({ ok: false, error: e?.message ?? "DB error" });
  }
}
