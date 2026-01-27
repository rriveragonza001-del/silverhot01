export type SheetsLogAction = "CREATE" | "UPDATE" | "DELETE" | "IMPORT_UPSERT";

export type SheetsLogEvent = {
  timestamp?: string;
  action: SheetsLogAction;

  actorRole: string;
  actorId: string;
  actorName?: string;

  activityId: string;
  promoterId: string;

  date?: string;
  time?: string;
  community?: string;
  objective?: string;
  status?: string;
  place?: string;
  notes?: string;

  source?: "WEB" | "CSV" | "API";
  diff?: Record<string, unknown>;
};

export async function pushSheetsLog(eventOrEvents: SheetsLogEvent | SheetsLogEvent[]) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  if (!url || !secret) {
    console.warn("[SheetsLog] Disabled: missing env vars");
    return;
  }

  const events = Array.isArray(eventOrEvents) ? eventOrEvents : [eventOrEvents];

  const payload = {
    secret,
    events: events.map((e) => ({
      ...e,
      timestamp: e.timestamp ?? new Date().toISOString(),
      source: e.source ?? "API",
    })),
  };

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.warn("[SheetsLog] Failed:", r.status, t);
    }
  } catch (err) {
    console.warn("[SheetsLog] Error:", String(err));
  }
}
