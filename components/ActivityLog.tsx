
import React, { useState } from 'react';
import { Activity, ActivityStatus, ActivityType, Promoter, UserRole } from '../types';

interface ActivityLogProps {
  activities: Activity[];
  promoters: Promoter[];
  userRole: UserRole;
  onUpdateActivity: (id: string, updates: Partial<Activity>) => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, promoters, userRole, onUpdateActivity }) => {
  const [filter, setFilter] = useState<ActivityStatus | 'ALL'>('ALL');
  const [promoterFilter, setPromoterFilter] = useState<string>('ALL');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const getPromoter = (id: string) => promoters.find(p => p.id === id);
  const filtered = activities.filter(a => {
    const matchesStatus = filter === 'ALL' || a.status === filter;
    const matchesPromoter = promoterFilter === 'ALL' || a.promoterId === promoterFilter;
    return matchesStatus && matchesPromoter;
  });

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl p-4 border border-slate-200 flex flex-col gap-4">
        <h2 className="font-bold text-slate-800">Bitácora de Acciones</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {userRole === UserRole.ADMIN && (
            <select value={promoterFilter} onChange={e => setPromoterFilter(e.target.value)} className="bg-slate-50 border-none rounded-lg px-3 py-2 text-[10px] font-bold">
              <option value="ALL">TODOS LOS GESTORES</option>
              {promoters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          )}
          <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-slate-50 border-none rounded-lg px-3 py-2 text-[10px] font-bold">
            <option value="ALL">TODOS LOS ESTADOS</option>
            {Object.values(ActivityStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(activity => {
          const isExpanded = expandedActivity === activity.id;
          const promoter = getPromoter(activity.promoterId);
          return (
            <div key={activity.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden" onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}>
              <div className="p-4 flex flex-col gap-2">
                <div className="flex justify-between items-start">
                   <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{activity.type}</span>
                   <span className="text-[8px] font-black uppercase text-slate-500 bg-slate-50 px-2 py-0.5 rounded-full">{activity.status}</span>
                </div>
                <h3 className="font-bold text-slate-800 text-sm">{activity.title}</h3>
                <div className="flex items-center gap-2 mt-1">
                   <img src={promoter?.photo} className="w-5 h-5 rounded-full" />
                   <span className="text-[10px] text-slate-500 font-medium">{promoter?.name} • {activity.startTime}</span>
                </div>
              </div>
              {isExpanded && (
                <div className="px-4 pb-4 pt-2 bg-slate-50/50 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacto Atendido</p>
                      <div className="bg-white p-3 rounded-xl border border-slate-200 text-xs font-medium text-slate-700">
                        {activity.communityContact?.name || 'N/A'} • {activity.communityContact?.community || 'N/A'}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observación Gestor</p>
                      <p className="text-xs bg-white p-3 rounded-xl border border-slate-200">{activity.observations || 'Sin observaciones'}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest">Retroalimentación Jefatura</p>
                    {userRole === UserRole.ADMIN ? (
                      <textarea 
                        className="w-full bg-white border border-indigo-100 rounded-xl p-3 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="Agregar comentario administrativo..."
                        value={activity.adminComments || ''}
                        onClick={e => e.stopPropagation()}
                        onChange={e => onUpdateActivity(activity.id, { adminComments: e.target.value })}
                      />
                    ) : (
                      <p className="text-xs italic text-indigo-900 bg-indigo-50 p-3 rounded-xl border border-indigo-100">{activity.adminComments || 'Esperando revisión...'}</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  );
};

export default ActivityLog;
