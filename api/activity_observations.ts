import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const client = getClient();
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

    const activity_id = Number(body?.activity_id);
    const created_by = String(body?.created_by ?? "");
    const note = String(body?.note ?? "");

    if (!activity_id || !created_by || !note) {
      return res.status(400).json({ error: "activity_id, created_by, note are required" });
    }

    await client.connect();
    const r = await client.query(
      `insert into activity_observations (activity_id, created_by, note)
       values ($1,$2,$3)
       returning *`,
      [activity_id, created_by, note]
    );

    return res.status(201).json({ ok: true, item: r.rows[0] });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  } finally {
    try { await client.end(); } catch {}
  }
}
