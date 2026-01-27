export default async function handler(_req: any, res: any) {
  try {
    const url = process.env.SHEETS_WEBHOOK_URL;
    const secret = process.env.SHEETS_WEBHOOK_SECRET;

    if (!url || !secret) {
      return res.status(500).json({
        ok: false,
        error: "Faltan env vars: SHEETS_WEBHOOK_URL o SHEETS_WEBHOOK_SECRET",
      });
    }

    const payload = {
      secret,
      events: [
        {
          timestamp: new Date().toISOString(),
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
        },
      ],
    };

    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await r.text().catch(() => "");
    if (!r.ok) {
      return res.status(500).json({
        ok: false,
        error: `Webhook respondió ${r.status}`,
        body: text.slice(0, 500),
      });
    }

    return res.status(200).json({ ok: true, webhookResponse: text.slice(0, 200) });
  } catch (e: any) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
