import React, { useEffect, useMemo, useState } from "react";
import type { Activity, Promoter, UserRole } from "../types";

type Props = {
  promoterId: string; // 'ALL' cuando admin está viendo todo el equipo
  activities: Activity[];
  promoters: Promoter[];
  onAddActivity: (activity: Activity) => void | Promise<void>;
  currentLocation: { lat: number; lng: number };
  userRole: UserRole;
  onRefresh: () => void | Promise<void>;
  onProgramLoaded?: (acts: Activity[]) => void | Promise<void>;
};

const ProgramModule: React.FC<Props> = ({
  promoterId,
  activities,
  promoters,
  onAddActivity,
  userRole,
  onRefresh,
  onProgramLoaded,
}) => {
  // (Opcional) notifica que cargó agenda
  useEffect(() => {
    if (onProgramLoaded) {
      try {
        void onProgramLoaded(activities);
      } catch {}
    }
    // solo al montar/cambiar lista
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activities]);

  // Ordenar por fecha/hora (si existen)
  const sorted = useMemo(() => {
    const copy = [...(activities || [])];
    copy.sort((a, b) => {
      const ad = `${a.date || ""} ${a.time || ""}`.trim();
      const bd = `${b.date || ""} ${b.time || ""}`.trim();
      return bd.localeCompare(ad);
    });
    return copy;
  }, [activities]);

  // Form simple para crear actividad
  const [title, setTitle] = useState("");
  const [community, setCommunity] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [status, setStatus] = useState<string>("pendiente");

  const displayPromoterName = (id: string) => {
    const p = promoters.find((x) => x.id === id);
    return p?.name || id;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const payload: Activity = {
      id: "",
      promoterId: userRole === (UserRole as any).ADMIN ? (promoterId === "ALL" ? "" : promoterId) : promoterId,
      objective: title,
      community,
      date,
      time,
      status: status as any,
      location: undefined as any,
    } as Activity;

    await onAddActivity(payload);

    setTitle("");
    setCommunity("");
    setDate("");
    setTime("");
    setStatus("pendiente");
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-black text-slate-800 tracking-tight">Agenda</h2>
            <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
              {userRole === (UserRole as any).ADMIN
                ? promoterId === "ALL"
                  ? "Vista administrador: TODO EL EQUIPO"
                  : `Vista administrador: ${displayPromoterName(promoterId)}`
                : "Vista gestor: MIS ACTIVIDADES"}
            </p>
          </div>

          <button
            onClick={() => void onRefresh()}
            className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90"
            title="Refrescar agenda"
          >
            <i className="fa-solid fa-sync"></i> Refrescar
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Objetivo / Título"
            className="md:col-span-2 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
          <input
            value={community}
            onChange={(e) => setCommunity(e.target.value)}
            placeholder="Comunidad"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            value={date}
            onChange={(e) => setDate(e.target.value)}
            type="date"
            className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <div className="flex gap-2">
            <input
              value={time}
              onChange={(e) => setTime(e.target.value)}
              type="time"
              className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
              title="Estado"
            >
              <option value="pendiente">pendiente</option>
              <option value="en_proceso">en_proceso</option>
              <option value="completada">completada</option>
            </select>
          </div>

          <button
            type="submit"
            className="md:col-span-5 mt-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-5 py-3 text-[11px] font-black uppercase tracking-widest shadow-sm"
          >
            Agregar a agenda
          </button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
        <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Actividades ({sorted.length})</h3>

        <div className="mt-4 divide-y divide-slate-100">
          {sorted.map((a) => (
            <div key={a.id} className="py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="font-black text-slate-800 truncate">{a.objective || (a as any).title || "Sin título"}</p>
                <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-1">
                  {a.community ? `Comunidad: ${a.community}` : "Comunidad: (no definida)"} · {a.date || "sin fecha"} {a.time || ""}
                </p>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">
                  Gestor: {displayPromoterName(a.promoterId)}
                </p>
              </div>

              <span className="text-[10px] font-black uppercase tracking-widest px-3 py-2 rounded-xl bg-slate-100 text-slate-700">
                {String(a.status || "pendiente")}
              </span>
            </div>
          ))}

          {sorted.length === 0 && (
            <div className="py-10 text-center text-slate-500 text-sm font-bold">
              No hay actividades cargadas en la agenda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProgramModule;
