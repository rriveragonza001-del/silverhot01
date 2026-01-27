import type { VercelRequest, VercelResponse } from "@vercel/node";
import { pushSheetsLog } from "./sheets_log";

export default async function handler(_req: VercelRequest, res: VercelResponse) {
  await pushSheetsLog({
    action: "CREATE",
    actorRole: "ADMIN",
    actorId: "test-admin",
    actorName: "TEST",
    activityId: "test-activity-1",
    promoterId: "g-1",
    date: "2026-02-01",
    time: "08:00",
    community: "Cuscatancingo",
    objective: "Prueba de log a Google Sheets",
    status: "Programado",
    place: "Oficina",
    notes: "Evento de prueba",
    source: "API",
    diff: { test: true },
  });

  return res.status(200).json({ ok: true });
}
