import React, { useMemo, useRef } from "react";
import { Activity, Promoter, UserRole } from "../types";

type Props = {
  promoterId: string; // "ALL" o id (pero para GESTOR debe ser SU id, no ALL)
  activities: Activity[];
  promoters: Promoter[];
  onAddActivity: (a: Activity) => void;
  currentLocation: { lat: number; lng: number };
  userRole: UserRole;
  onRefresh: () => void;

  // ✅ lo activamos para que el padre pueda guardar lo importado al backend
  onProgramLoaded?: (items: Activity[]) => void;
};

function escapeCsv(v: unknown) {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[], headers: string[]) {
  const lines = [
    headers.join(","),
    ...rows.map(r => headers.map(h => escapeCsv(r[h])).join(",")),
  ];
  return lines.join("\n");
}

function parseCsv(text: string) {
  // Parser simple compatible con comillas dobles. Suficiente para MVP.
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

  // última celda
  if (cur.length || row.length) {
    row.push(cur);
    rows.push(row);
  }

  return rows.filter(r => r.some(c => c.trim() !== ""));
}

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

  const visibleActivities = useMemo(() => {
    // ADMIN: "ALL" => todas
    if (userRole === UserRole.ADMIN) {
      if (promoterId === "ALL") return activities;
      return activities.filter(a => a.promoterId === promoterId);
    }
    // GESTOR: solo las suyas (IMPORTANTE: promoterId debe ser su id)
    return activities.filter(a => a.promoterId === promoterId);
  }, [activities, promoterId, userRole]);

  const headers = [
    "id",
    "promoterId",
    "date",
    "time",
    "community",
    "objective",
    "status",
    "place",
    "notes",
  ];

  function downloadCsv() {
    const rows = visibleActivities.map(a => ({
      id: a.id ?? "",
      promoterId: a.promoterId ?? "",
      date: a.date ?? "",
      time: a.time ?? "",
      community: a.community ?? "",
      objective: a.objective ?? "",
      status: a.status ?? "",
      place: (a as any).place ?? "",
      notes: (a as any).notes ?? "",
    }));

    const csv = toCsv(rows, headers);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const fname =
      userRole === UserRole.ADMIN
        ? `agenda_${promoterId === "ALL" ? "TODOS" : promoterId}.csv`
        : `agenda_${promoterId}.csv`;

    const a = document.createElement("a");
    a.href = url;
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  async function handleImportFile(file: File) {
    const text = await file.text();
    const rows = parseCsv(text);

    if (rows.length < 2) {
      alert("CSV vacío o sin datos.");
      return;
    }

    const [hdr, ...dataRows] = rows;
    const idx = (name: string) => hdr.findIndex(h => h.trim() === name);

    const required = ["promoterId", "date", "objective"];
    const missing = required.filter(r => idx(r) === -1);
    if (missing.length) {
      alert(`CSV inválido. Faltan columnas: ${missing.join(", ")}`);
      return;
    }

    const items: Activity[] = dataRows
      .filter(r => r.some(c => String(c).trim() !== ""))
      .map(r => {
        const item: any = {};
        item.id = r[idx("id")]?.trim() || crypto.randomUUID();
        item.promoterId = r[idx("promoterId")]?.trim();
        item.date = r[idx("date")]?.trim();
        item.time = idx("time") !== -1 ? r[idx("time")]?.trim() : "";
        item.community = idx("community") !== -1 ? r[idx("community")]?.trim() : "";
        item.objective = r[idx("objective")]?.trim();
        item.status = idx("status") !== -1 ? r[idx("status")]?.trim() : "Programado";
        item.place = idx("place") !== -1 ? r[idx("place")]?.trim() : "";
        item.notes = idx("notes") !== -1 ? r[idx("notes")]?.trim() : "";
        return item as Activity;
      });

    // ✅ Reglas de seguridad por rol:
    // - ADMIN puede importar para cualquiera (promoterId en CSV manda)
    // - GESTOR solo puede importar para sí mismo
    if (userRole !== UserRole.ADMIN) {
      const invalid = items.find(a => a.promoterId !== promoterId);
      if (invalid) {
        alert("Importación rechazada: un gestor solo puede cargar programación para su propio ID.");
        return;
      }
    }

    // Enviamos al padre para que lo guarde en backend / estado global
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
            onClick={downloadCsv}
            className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 hover:text-white transition-all"
          >
            Descargar CSV
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
            onChange={e => {
              const f = e.target.files?.[0];
              e.target.value = "";
              if (f) void handleImportFile(f);
            }}
          />
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-2xl p-4">
        <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3">
          Actividades visibles: {visibleActivities.length}
        </p>

        <div className="space-y-3">
          {visibleActivities.map(a => (
            <div key={a.id} className="border border-slate-100 rounded-xl p-3">
              <div className="flex justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-black text-slate-800 truncate">{a.objective}</p>
                  <p className="text-[11px] text-slate-500">
                    {a.community || "Sin comunidad"} — {a.date || "Sin fecha"} {a.time || ""}
                  </p>
                  <p className="text-[11px] text-slate-400">Gestor: {a.promoterId}</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600">
                  {a.status}
                </span>
              </div>
            </div>
          ))}
          {visibleActivities.length === 0 && (
            <p className="text-slate-400 text-sm">No hay actividades para mostrar.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramModule;
