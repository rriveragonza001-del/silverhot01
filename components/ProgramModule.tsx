import React, { useMemo, useRef } from "react";
import { Activity, Promoter, UserRole } from "../types";

type Props = {
  promoterId: string; // "ALL" o id (para GESTOR debe ser su propio id)
  activities: Activity[];
  promoters: Promoter[];
  onAddActivity: (a: Activity) => void;
  currentLocation: { lat: number; lng: number };
  userRole: UserRole;
  onRefresh: () => void;
  onProgramLoaded?: (items: Activity[]) => void;
};

// ==============================
// CSV helpers
// ==============================
function escapeCsv(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]) {
  const lines = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let cur = "";
  let inQuotes = false;
  let row: string[] = [];

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];

    if (ch === '"') {
      const next = text[i + 1];
      if (inQuotes && next === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (!inQuotes && ch === ",") {
      row.push(cur);
      cur = "";
      continue;
    }

    if (!inQuotes && (ch === "\n" || ch === "\r")) {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(cur);
      rows.push(row);
      row = [];
      cur = "";
      continue;
    }

    cur += ch;
  }

  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  return rows.filter((r) => r.some((c) => c.trim() !== ""));
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ==============================
// Sorting helpers (robustos)
// ==============================
const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });

function promoterSortKey(promoterId?: string) {
  // Orden natural: g-2 < g-10
  // Usa collator con numeric:true, pero damos key limpia.
  return (promoterId ?? "").trim();
}

function parseDateToIsoOrEmpty(dateStr?: string) {
  const s = (dateStr ?? "").trim();
  if (!s) return ""; // vacío

  // Soporta YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

  // Soporta DD/MM/YYYY
  const m = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) {
    const dd = String(m[1]).padStart(2, "0");
    const mm = String(m[2]).padStart(2, "0");
    const yyyy = m[3];
    return `${yyyy}-${mm}-${dd}`;
  }

  // No reconocido -> lo dejamos como vacío para que se vaya al final
  return "";
}

function parseTimeOrEmpty(timeStr?: string) {
  const s = (timeStr ?? "").trim();
  if (!s) return "";
  // HH:MM
  if (/^\d{1,2}:\d{2}$/.test(s)) {
    const [h, m] = s.split(":");
    return `${String(h).padStart(2, "0")}:${m}`;
  }
  return "";
}

function activityComparator(a: Activity, b: Activity) {
  // 1) Gestor (natural)
  const p = collator.compare(promoterSortKey(a.promoterId), promoterSortKey(b.promoterId));
  if (p !== 0) return p;

  // 2) Fecha (vacías al final)
  const da = parseDateToIsoOrEmpty(a.date);
  const db = parseDateToIsoOrEmpty(b.date);
  if (da && db) {
    const dcmp = da.localeCompare(db);
    if (dcmp !== 0) return dcmp;
  } else if (da && !db) {
    return -1;
  } else if (!da && db) {
    return 1;
  }

  // 3) Hora (vacías al final)
  const ta = parseTimeOrEmpty(a.time);
  const tb = parseTimeOrEmpty(b.time);
  if (ta && tb) {
    const tcmp = ta.localeCompare(tb);
    if (tcmp !== 0) return tcmp;
  } else if (ta && !tb) {
    return -1;
  } else if (!ta && tb) {
    return 1;
  }

  // 4) Objetivo (estable)
  return collator.compare(a.objective ?? "", b.objective ?? "");
}

// ==============================
// Official format
// ==============================
const OFFICIAL_HEADERS = [
  "id",
  "promoterId",
  "promoterName",
  "date",       // Recomendado obligatorio para orden real
  "time",
  "community",
  "objective",
  "status",
  "place",
  "notes",
] as const;

type OfficialHeader = (typeof OFFICIAL_HEADERS)[number];

const ProgramModule: React.FC<Props> = ({
  promoterId,
  activities,
  promoters,
  onAddActivity,
  currentLocation,
  userRole,
  onRefresh,
  onProgramLoaded,
}) => {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const promoterNameById = useMemo(() => {
    return new Map(promoters.map((p) => [p.id, p.name]));
  }, [promoters]);

  const visibleActivities = useMemo(() => {
    if (userRole === UserRole.ADMIN) {
      if (promoterId === "ALL") return activities;
      return activities.filter((a) => a.promoterId === promoterId);
    }
    // GESTOR: solo las suyas (promoterId debe ser SU id)
    return activities.filter((a) => a.promoterId === promoterId);
  }, [activities, promoterId, userRole]);

  const visibleActivitiesSorted = useMemo(() => {
    return [...visibleActivities].sort(activityComparator);
  }, [visibleActivities]);

  function downloadTemplateCsv() {
    const csv = OFFICIAL_HEADERS.join(",") + "\n";
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, "PLANTILLA_AGENDA_OFICIAL.csv");
  }

  function downloadCsvOrdered() {
    const rows = visibleActivitiesSorted.map((a) => ({
      id: a.id ?? "",
      promoterId: a.promoterId ?? "",
      promoterName: promoterNameById.get(a.promoterId) ?? "",
      date: parseDateToIsoOrEmpty(a.date), // normaliza (YYYY-MM-DD)
      time: parseTimeOrEmpty(a.time),      // normaliza (HH:MM)
      community: a.community ?? "",
      objective: a.objective ?? "",
      status: a.status ?? "Programado",
      place: (a as any).place ?? "",
      notes: (a as any).notes ?? "",
    }));

    const csv = toCsv(rows, [...OFFICIAL_HEADERS]);

    // BOM UTF-8 para Excel (corrige Ã³, Ã¡, ñ, etc.)
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });

    const fname =
      userRole === UserRole.ADMIN
        ? `agenda_${promoterId === "ALL" ? "TODOS" : promoterId}.csv`
        : `agenda_${promoterId}.csv`;

    downloadBlob(blob, fname);
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      alert("CSV vacío o sin datos.");
      return;
    }

    const [hdr, ...dataRows] = rows;
    const headerIndex = new Map<string, number>();
    hdr.forEach((h, i) => headerIndex.set(h.trim(), i));

    const idx = (name: OfficialHeader | string) =>
      headerIndex.has(String(name)) ? (headerIndex.get(String(name)) as number) : -1;

    // Formato oficial: promoterId, date, objective (date debe venir si quieres orden REAL)
    const required: OfficialHeader[] = ["promoterId", "date", "objective"];
    const missing = required.filter((r) => idx(r) === -1);
    if (missing.length) {
      alert(
        `CSV inválido. Debe usar la PLANTILLA OFICIAL.\nFaltan columnas: ${missing.join(", ")}`
      );
      return;
    }

    const items: Activity[] = dataRows
      .filter((r) => r.some((c) => String(c).trim() !== ""))
      .map((r) => {
        const item: any = {};
        item.id = (idx("id") !== -1 ? r[idx("id")] : "")?.trim() || crypto.randomUUID();
        item.promoterId = r[idx("promoterId")]?.trim();
        item.date = parseDateToIsoOrEmpty(r[idx("date")]?.trim());
        item.time = idx("time") !== -1 ? parseTimeOrEmpty(r[idx("time")]?.trim()) : "";
        item.community = idx("community") !== -1 ? r[idx("community")]?.trim() : "";
        item.objective = r[idx("objective")]?.trim();
        item.status = idx("status") !== -1 ? r[idx("status")]?.trim() : "Programado";
        item.place = idx("place") !== -1 ? r[idx("place")]?.trim() : "";
        item.notes = idx("notes") !== -1 ? r[idx("notes")]?.trim() : "";

        return item as Activity;
      });

    // Seguridad por rol:
    if (userRole !== UserRole.ADMIN) {
      const invalid = items.find((a) => a.promoterId !== promoterId);
      if (invalid) {
        alert("Importación rechazada: un gestor solo puede cargar programación para su propio ID.");
        return;
      }
    }

    // Validación práctica: si vienen sin fecha, avisa (no bloquea, pero explica desorden)
    const withoutDate = items.filter((a) => !parseDateToIsoOrEmpty(a.date)).length;
    if (withoutDate > 0) {
      alert(
        `Aviso: ${withoutDate} filas vienen SIN fecha (date). Esas se enviarán al final y no pueden ordenarse cronológicamente.`
      );
    }

    onProgramLoaded?.(items);
    alert(`Programación cargada: ${items.length} registros.`);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Agenda</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {userRole === UserRole.ADMIN ? "Vista Administrador" : "Vista Gestor"}
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onRefresh}
            className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
          >
            Actualizar
          </button>

          <button
            onClick={downloadTemplateCsv}
            className="px-4 py-2 rounded-xl bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all"
          >
            Plantilla CSV
          </button>

          <button
            onClick={downloadCsvOrdered}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all"
          >
            Descargar CSV (Ordenado)
          </button>

          <button
            onClick={() => fileRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 hover:text-white transition-all"
          >
            Cargar CSV
          </button>

          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handleImportFile(f);
            }}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Actividades visibles: {visibleActivitiesSorted.length}
        </p>

        <div className="space-y-3">
          {visibleActivitiesSorted.map((a) => (
            <div key={a.id} className="border border-slate-100 rounded-xl p-3">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-slate-800 truncate">{a.objective}</p>
                  <p className="text-[11px] text-slate-500">
                    {(a.community || "Sin comunidad")} — {(a.date || "Sin fecha")} {(a.time || "")}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Gestor: {promoterNameById.get(a.promoterId) ?? a.promoterId}
                  </p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  {a.status}
                </span>
              </div>
            </div>
          ))}

          {visibleActivitiesSorted.length === 0 && (
            <p className="text-slate-400 text-sm">No hay actividades para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramModule;
