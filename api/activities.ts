import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";

/** =========================
 *  DB
 *  ========================= */
function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

/** =========================
 *  Google Sheets Log (AGENDA_LOG)
 *  ========================= */
type SheetsLogAction = "CREATE" | "UPDATE" | "DELETE" | "IMPORT_UPSERT";

async function pushSheetsLog(event: {
  action: SheetsLogAction;

  actorRole: string;     // "admin" | "gestor" (o lo que uses)
  actorId: string;       // quien hizo la acción
  actorName?: string;

  activityId: string;
  promoterId: string;    // a quién pertenece la actividad

  date?: string;
  time?: string;
  community?: string;
  objective?: string;
  status?: string;
  place?: string;
  notes?: string;

  source?: "API" | "WEB" | "CSV";
  diff?: Record<string, unknown>;
}) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  // Si no hay configuración, no rompemos la API
  if (!url || !secret) return;

  const payload = {
    secret,
    events: [
      {
        timestamp: new Date().toISOString(),
        source: event.source ?? "API",
        ...event,
      },
    ],
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!r.ok) {
    // No bloqueamos la operación principal, pero dejamos rastro en logs de Vercel
    const t = await r.text().catch(() => "");
    console.error("[SheetsLog] webhook failed:", r.status, t?.slice?.(0, 300));
  }
}

/** Normaliza role (por si el front manda ADMIN/GESTOR o admin/gestor) */
function normRole(v: any) {
  const s = String(v ?? "").toLowerCase();
  if (s === "admin" || s === "administrator") return "admin";
  if (s === "gestor" || s === "promoter") return "gestor";
  // Si tu front manda "UserRole.ADMIN"
  if (s.includes("admin")) return "admin";
  return "gestor";
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

    /** =========================
     *  GET - LISTAR
     *  ========================= */
    if (req.method === "GET") {
      const role = normRole(req.query.role ?? "gestor");
      const user = String(req.query.user ?? "");

      let sqlText = `
        select a.*,
               coalesce(json_agg(o order by o.created_at) filter (where o.id is not null), '[]') as observations
        from activities a
        left join activity_observations o on o.activity_id = a.id
      `;
      const params: any[] = [];

      // Gestor: solo sus creadas o asignadas
      if (role !== "admin") {
        if (!user) return res.status(400).json({ error: "Missing user" });
        params.push(user);
        sqlText += ` where (a.created_by = $1 or a.assigned_to = $1) `;
      }

      // 🔧 Nota: hoy ordenas por created_at; tu “agenda” real debería ordenar por date/time
      // cuando esos campos existan en la tabla.
      sqlText += ` group by a.id order by a.created_at desc limit 500`;

      const r = await client.query(sqlText, params);
      return res.status(200).json({ ok: true, items: r.rows });
    }

    /** =========================
     *  POST - CREAR
     *  ========================= */
    if (req.method === "POST") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const created_by = String(body?.created_by ?? "");
      const role = normRole(body?.role ?? "gestor");
      const assigned_to = body?.assigned_to ? String(body.assigned_to) : null;

      // front manda objective; BD exige title
      const title = String(body?.title ?? body?.objective ?? "");

      // Si tabla no tiene community, lo guardas en description
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

      const r = await client.query(
        `insert into activities (created_by, role, assigned_to, title, description, status)
         values ($1,$2,$3,$4,$5,$6)
         returning *`,
        [created_by, role, assigned_to, title, description, status]
      );

      const item = r.rows[0];

      // ✅ LOG a Sheets (no bloquea si falla)
      await pushSheetsLog({
        action: "CREATE",
        actorRole: role,
        actorId: created_by,
        actorName: body?.actorName ? String(body.actorName) : undefined,
        activityId: String(item.id),
        promoterId: assigned_to ?? created_by, // dueño lógico de la actividad
        community,
        objective: title,
        status,
        notes: rawDescription || undefined,
        source: "API",
        diff: { created: true },
      });

      return res.status(201).json({ ok: true, item });
    }

    /** =========================
     *  PATCH - EDITAR (NUEVO)
     *  ========================= */
    if (req.method === "PATCH") {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;

      const id = String(body?.id ?? "");
      if (!id) return res.status(400).json({ error: "Missing id" });

      const actorId = String(body?.actorId ?? body?.created_by ?? "");
      const role = normRole(body?.role ?? "gestor");
      if (!actorId) return res.status(400).json({ error: "Missing actorId/created_by" });

      // Traer registro actual para diff/log
      const beforeR = await client.query(`select * from activities where id = $1`, [id]);
      if (!beforeR.rows.length) return res.status(404).json({ error: "Not found" });
      const before = beforeR.rows[0];

      // Campos editables (según tu tabla actual)
      const nextTitle = body?.title ?? body?.objective;
      const nextStatus = body?.status;

      // community/notes se guardan dentro de description (porque tu tabla no tiene community)
      const community = body?.community ? String(body.community) : "";
      const rawDescription = body?.description ? String(body.description) : "";
      const nextDescription =
        community && rawDescription
          ? `Comunidad: ${community}\n\n${rawDescription}`
          : community
            ? `Comunidad: ${community}`
            : (rawDescription || before.description || null);

      const upd = await client.query(
        `update activities
           set title = coalesce($2, title),
               status = coalesce($3, status),
               description = $4
         where id = $1
         returning *`,
        [id, nextTitle ?? null, nextStatus ?? null, nextDescription]
      );

      const item = upd.rows[0];

      // Diff simple
      const diff: Record<string, unknown> = {};
      if ((nextTitle ?? null) !== null && nextTitle !== before.title) diff.title = { from: before.title, to: nextTitle };
      if ((nextStatus ?? null) !== null && nextStatus !== before.status) diff.status = { from: before.status, to: nextStatus };
      if (nextDescription !== before.description) diff.description = { from: before.description, to: nextDescription };

      await pushSheetsLog({
        action: "UPDATE",
        actorRole: role,
        actorId,
        actorName: body?.actorName ? String(body.actorName) : undefined,
        activityId: String(item.id),
        promoterId: String(item.assigned_to ?? item.created_by),
        community,
        objective: String(item.title ?? ""),
        status: String(item.status ?? ""),
        notes: rawDescription || undefined,
        source: "API",
        diff,
      });

      return res.status(200).json({ ok: true, item });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  } finally {
    try { await client.end(); } catch {}
  }
}
