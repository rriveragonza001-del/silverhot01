import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

/**
 * ✅ Log a Google Sheets (NO rompe el API si falla)
 * Requiere env vars en Vercel:
 * - SHEETS_WEBHOOK_URL
 * - SHEETS_WEBHOOK_SECRET
 */
async function pushSheetsLog(event: any) {
  try {
    const url = process.env.SHEETS_WEBHOOK_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;
    if (!url || !secret) return;

    const payload = {
      secret,
      event: {
        timestamp: new Date().toISOString(),
        source: "API",
        ...event,
      },
    };

    // Node 20 en Vercel ya trae fetch global
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // No lanzamos error si Sheets falla; solo registramos un warning interno
    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.warn("Sheets webhook failed:", r.status, t?.slice?.(0, 300));
    }
  } catch (e) {
    console.warn("Sheets webhook error:", String(e));
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const client = getClient();

  try {
    await client.connect();

    // DEBUG
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

    // =========================
    // GET - LISTAR ACTIVIDADES
    // =========================
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

    // =========================
    // POST - CREAR ACTIVIDAD
    // =========================
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const created_by = String(body?.created_by ?? "");
      const role = String(body?.role ?? "gestor");
      const assigned_to = body?.assigned_to ? String(body.assigned_to) : null;

      // front manda objective; BD usa title
      const title = String(body?.title ?? body?.objective ?? "");

      // community lo metemos en description para no depender de columna
      const community = body?.community ? String(body.community) : "";
      const rawDescription = body?.description ? String(body.description) : "";
      const description =
        community && rawDescription
          ? `Comunidad: ${community}\n\n${rawDescription}`
          : community
            ? `Comunidad: ${community}`
            : (rawDescription || null);

      const status = body?.status ? String(body.status) : "pendiente";

      // datos opcionales para logging (no afectan BD)
      const actorId = String(body?.actorId ?? created_by ?? "");
      const actorName = String(body?.actorName ?? "");
      const actorRole = String(body?.actorRole ?? role ?? "");

      if (!created_by || !title) {
        return res.status(400).json({ error: "created_by and title/objective are required" });
      }

      const r = await client.query(
        `insert into activities (created_by, role, assigned_to, title, description, status)
         values ($1,$2,$3,$4,$5,$6)
         returning *`,
        [created_by, role, assigned_to, title, description, status]
      );

      const item = r.rows[0];

      // ✅ LOG CREATE a Sheets (no bloquea respuesta)
      pushSheetsLog({
        action: "CREATE",
        actorRole,
        actorId,
        actorName,
        activityId: String(item?.id ?? ""),
        promoterId: String(item?.assigned_to ?? item?.created_by ?? ""),
        date: String(body?.date ?? ""),   // si tu front manda fecha/hora
        time: String(body?.time ?? ""),
        community: String(body?.community ?? ""),
        objective: String(body?.objective ?? body?.title ?? ""),
        status: String(item?.status ?? body?.status ?? ""),
        place: String(body?.place ?? ""),
        notes: String(body?.notes ?? ""),
      }).catch(() => {});

      return res.status(201).json({ ok: true, item });
    }

    // =========================
    // PATCH - ACTUALIZAR ACTIVIDAD (para logging UPDATE)
    // =========================
    if (req.method === "PATCH") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const id = body?.id;
      if (!id) return res.status(400).json({ error: "Missing id" });

      // logging actor
      const actorId = String(body?.actorId ?? "");
      const actorName = String(body?.actorName ?? "");
      const actorRole = String(body?.role ?? body?.actorRole ?? "");

      // leer antes (para diff)
      const beforeR = await client.query(`select * from activities where id = $1`, [id]);
      const before = beforeR.rows?.[0];
      if (!before) return res.status(404).json({ error: "Not found" });

      // campos actualizables (solo los que sabemos que existen)
      const nextTitle = body?.title ?? body?.objective ?? undefined;
      const nextAssigned = body?.assigned_to !== undefined ? (body.assigned_to ? String(body.assigned_to) : null) : undefined;
      const nextStatus = body?.status !== undefined ? String(body.status) : undefined;

      // community sigue yendo a description
      const community = body?.community !== undefined ? String(body.community ?? "") : undefined;
      const rawDescription = body?.description !== undefined ? String(body.description ?? "") : undefined;

      let nextDescription: string | null | undefined = undefined;
      if (community !== undefined || rawDescription !== undefined) {
        const c = community ?? "";
        const d = rawDescription ?? "";
        nextDescription =
          c && d ? `Comunidad: ${c}\n\n${d}` :
          c ? `Comunidad: ${c}` :
          (d || null);
      }

      // construir UPDATE dinámico
      const sets: string[] = [];
      const params: any[] = [];
      let p = 1;

      if (nextAssigned !== undefined) { sets.push(`assigned_to = $${p++}`); params.push(nextAssigned); }
      if (nextTitle !== undefined)    { sets.push(`title = $${p++}`); params.push(String(nextTitle)); }
      if (nextDescription !== undefined) { sets.push(`description = $${p++}`); params.push(nextDescription); }
      if (nextStatus !== undefined)   { sets.push(`status = $${p++}`); params.push(nextStatus); }

      if (!sets.length) return res.status(400).json({ error: "No fields to update" });

      params.push(id);
      const sql = `update activities set ${sets.join(", ")} where id = $${p} returning *`;

      const r = await client.query(sql, params);
      const item = r.rows[0];

      // diff simple (solo campos relevantes)
      const diff: any = {};
      const watch = ["assigned_to", "title", "description", "status"];
      for (const k of watch) {
        if (String(before?.[k] ?? "") !== String(item?.[k] ?? "")) {
          diff[k] = { from: before?.[k] ?? null, to: item?.[k] ?? null };
        }
      }

      // ✅ LOG UPDATE a Sheets
      pushSheetsLog({
        action: "UPDATE",
        actorRole,
        actorId,
        actorName,
        activityId: String(item?.id ?? ""),
        promoterId: String(item?.assigned_to ?? item?.created_by ?? ""),
        date: String(body?.date ?? ""),
        time: String(body?.time ?? ""),
        community: String(body?.community ?? ""),
        objective: String(body?.objective ?? body?.title ?? ""),
        status: String(item?.status ?? body?.status ?? ""),
        place: String(body?.place ?? ""),
        notes: String(body?.notes ?? ""),
        diff,
      }).catch(() => {});

      return res.status(200).json({ ok: true, item });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  } finally {
    try { await client.end(); } catch {}
  }
}
