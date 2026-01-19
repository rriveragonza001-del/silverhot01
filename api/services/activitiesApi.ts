// services/activitiesApi.ts
export type ApiActivityRow = {
  id: string | number;
  created_by: string;
  role: string;
  assigned_to: string | null;

  // Según tu API actual:
  objective?: string | null;
  community?: string | null;
  activity_date?: string | null;
  activity_time?: string | null;

  // Según tu tabla anterior (si aún existe en tu schema):
  title?: string | null;
  description?: string | null;
  date?: string | null;

  status: string;
  created_at?: string;
  observations?: any[];
};

export async function fetchActivities(params: { role: "admin" | "gestor"; user?: string }) {
  const qs = new URLSearchParams();
  qs.set("role", params.role);
  if (params.role !== "admin") qs.set("user", params.user || "");

  const r = await fetch(`/api/activities?${qs.toString()}`, {
    headers: { "Accept": "application/json" },
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error fetching activities");
  return data as { ok: true; items: ApiActivityRow[] };
}

export async function createActivity(payload: any) {
  const r = await fetch(`/api/activities`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await r.json();
  if (!r.ok) throw new Error(data?.error || "Error creating activity");
  return data as { ok: true; item: ApiActivityRow };
}
