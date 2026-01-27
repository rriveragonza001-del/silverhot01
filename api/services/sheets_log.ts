export type SheetsLogAction =
  | "CREATE"
  | "UPDATE"
  | "DELETE"
  | "IMPORT_UPSERT";

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

export async function pushSheetsLog(
  eventOrEvents: SheetsLogEvent | SheetsLogEvent[]
) {
  const url = process.env.SHEETS_WEBHOOK_URL;
  const secret = process.env.SHEETS_WEBHOOK_SECRET;

  if (!url || !secret) {
    console.warn("[SheetsLog] Missing env vars");
    return;
  }

  const events = Array.isArray(eventOrEvents)
    ? eventOrEvents
    : [eventOrEvents];

  const payload = {
    secret,
    events: events.map((e) => ({
      ...e,
      timestamp: e.timestamp ?? new Date().toISOString(),
      source: e.source ?? "API",
    })),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(
      `Sheets webhook failed ${res.status}: ${t}`
    );
  }
}
