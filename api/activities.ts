
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
if (req.method === "GET" && req.query.__debug === "1") {
  const r = await client.query(`
    select
      current_database() as db,
      inet_server_addr() as server_addr,
      now() as now,
      (select count(*) from activities) as activities_count
  `);
  return res.status(200).json({ ok: true, debug: r.rows[0] });
}

    // LISTAR ACTIVIDADES
    if (req.method === "GET") {
      const role = String(req.query.role ?? "gestor");
      const user = String(req.query.user ?? "");

      let sqlText = `
        select a.*,
               coalesce(json_agg(o order by o.created_at) filter (where o.id is not null), '[]') as observations
        from activities a
        left join activity_observations o on o.activity_id = a.id
      `;
      const params: any[] = [];

      if (role !== "admin") {
        if (!user) return res.status(400).json({ error: "Missing user" });
        params.push(user);
        sqlText += ` where (a.created_by = $1 or a.assigned_to = $1) `;
      }

      sqlText += ` group by a.id order by a.created_at desc limit 200`;

      const r = await client.query(sqlText, params);
      return res.status(200).json({ ok: true, items: r.rows });
    }

    // CREAR ACTIVIDAD
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const created_by = String(body?.created_by ?? "");
      const role = String(body?.role ?? "gestor");
      const assigned_to = body?.assigned_to ? String(body.assigned_to) : null;

      // ✅ Tu front manda objective; tu BD exige title
      const title = String(body?.title ?? body?.objective ?? "");

      // Si tu tabla NO tiene "community", lo metemos en description temporalmente
      const community = body?.community ? String(body.community) : "";
      const rawDescription = body?.description ? String(body.description) : "";
      const description =
        community && rawDescription
          ? `Comunidad: ${community}\n\n${rawDescription}`
          : community
            ? `Comunidad: ${community}`
            : (rawDescription || null);

      const status = body?.status ? String(body.status) : "pendiente";

      if (!created_by || !title) {
        return res.status(400).json({ error: "created_by and title/objective are required" });
      }

      // ✅ INSERT SOLO a columnas que existen (title/description)
      const r = await client.query(
        `insert into activities (created_by, role, assigned_to, title, description, status)
         values ($1,$2,$3,$4,$5,$6)
         returning *`,
        [created_by, role, assigned_to, title, description, status]
      );

      return res.status(201).json({ ok: true, item: r.rows[0] });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  } finally {
    try { await client.end(); } catch {}
  }
}

