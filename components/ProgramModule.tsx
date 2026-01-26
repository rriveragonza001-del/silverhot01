import React, { useMemo } from "react";
import { Activity, Promoter, UserRole } from "../types";

type Props = {
  promoterId: string;               // "ALL" o id
  activities: Activity[];
  promoters: Promoter[];
  onAddActivity: (a: Activity) => void;
  currentLocation: { lat: number; lng: number };
  userRole: UserRole;
  onRefresh: () => void;
  onProgramLoaded?: (items: Activity[]) => void;
};

const ProgramModule: React.FC<Props> = ({
  promoterId,
  activities,
  promoters,
  onAddActivity,
  currentLocation,
  userRole,
  onRefresh,
}) => {
  const visibleActivities = useMemo(() => {
    // ADMIN: "ALL" => todas
    if (userRole === UserRole.ADMIN) {
      if (promoterId === "ALL") return activities;
      return activities.filter(a => a.promoterId === promoterId);
    }
    // GESTOR: solo las suyas
    return activities.filter(a => a.promoterId === promoterId);
  }, [activities, promoterId, userRole]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-slate-800">Agenda</h2>
          <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
            {userRole === UserRole.ADMIN ? "Vista Administrador" : "Vista Gestor"}
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
        >
          Actualizar
        </button>
      </div>

      {/* Aquí va tu UI real de agenda, calendario, tarjetas, etc.
          Por ahora dejo una lista simple para demostrar que llena. */}
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
                  <p className="text-[11px] text-slate-400">
                    Gestor: {a.promoterId}
                  </p>
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
