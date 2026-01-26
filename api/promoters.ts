import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = getClient();

  try {
    await client.connect();

    // GET: lista todos los promoters (admin panel)
    if (req.method === "GET") {
      const r = await client.query(
        `select id, name, email, role, photo, phone, is_online, last_connection, updated_at
         from promoters
         order by updated_at desc nulls last, name asc`
      );
      return res.status(200).json({ ok: true, items: r.rows });
    }

    // PUT: upsert de perfil (gestor/admin)
    if (req.method === "PUT") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
      const id = String(body?.id ?? "");
      if (!id) return res.status(400).json({ error: "Missing id" });

      const name = body?.name ?? null;
      const email = body?.email ?? null;
      const role = body?.role ?? null;
      const photo = body?.photo ?? null;
      const phone = body?.phone ?? null;

      const is_online = typeof body?.isOnline === "boolean" ? body.isOnline : null;
      const last_connection = body?.lastConnection ?? null;

      const r = await client.query(
        `insert into promoters (id, name, email, role, photo, phone, is_online, last_connection, updated_at)
         values ($1,$2,$3,$4,$5,$6,$7,$8, now())
         on conflict (id) do update set
           name = coalesce(excluded.name, promoters.name),
           email = coalesce(excluded.email, promoters.email),
           role = coalesce(excluded.role, promoters.role),
           photo = coalesce(excluded.photo, promoters.photo),
           phone = coalesce(excluded.phone, promoters.phone),
           is_online = coalesce(excluded.is_online, promoters.is_online),
           last_connection = coalesce(excluded.last_connection, promoters.last_connection),
           updated_at = now()
         returning *`,
        [id, name, email, role, photo, phone, is_online, last_connection]
      );

      return res.status(200).json({ ok: true, item: r.rows[0] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  } finally {
    try { await client.end(); } catch {}
  }
}
