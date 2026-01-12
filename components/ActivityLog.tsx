
import React, { useState, useEffect } from 'react';
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
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const getPromoter = (id: string) => promoters.find(p => p.id === id);
  
  const filteredActivities = activities.filter(a => {
    const matchesStatus = filter === 'ALL' || a.status === filter;
    const matchesPromoter = promoterFilter === 'ALL' || a.promoterId === promoterFilter;
    return matchesStatus && matchesPromoter;
  });

  const statusColors = {
    [ActivityStatus.PENDING]: 'bg-slate-100 text-slate-600 border border-slate-200',
    [ActivityStatus.IN_PROGRESS]: 'bg-blue-100 text-blue-600 border border-blue-200',
    [ActivityStatus.COMPLETED]: 'bg-green-100 text-green-600 border border-green-200',
    [ActivityStatus.CANCELLED]: 'bg-red-100 text-red-600 border border-red-200',
  };

  const typeColors: Record<ActivityType, string> = {
    [ActivityType.COMMUNITY_VISIT]: 'text-blue-600 border-blue-200 bg-blue-50',
    [ActivityType.COMPLAINT_FOLLOWUP]: 'text-red-600 border-red-200 bg-red-50',
    [ActivityType.COMMUNITY_MEETING]: 'text-indigo-600 border-indigo-200 bg-indigo-50',
    [ActivityType.LEGALIZATION_PROCESS]: 'text-amber-600 border-amber-200 bg-amber-50',
    [ActivityType.OATH_TAKING]: 'text-purple-600 border-purple-200 bg-purple-50',
    [ActivityType.CONSTITUTION]: 'text-teal-600 border-teal-200 bg-teal-50',
    [ActivityType.WORK_FOLLOWUP]: 'text-orange-600 border-orange-200 bg-orange-50',
    [ActivityType.SOCIAL_ACTIVITY]: 'text-rose-600 border-rose-200 bg-rose-50',
    [ActivityType.TRAINING_ACTIVITY]: 'text-emerald-600 border-emerald-200 bg-emerald-50',
    [ActivityType.OTHER]: 'text-slate-600 border-slate-200 bg-slate-50',
  };

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 md:p-6 bg-slate-50/50">
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Bitácora de Campo</h2>
            <p className="text-[11px] text-slate-500 font-medium">Control de labores diarias y retroalimentación</p>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
            {userRole === UserRole.ADMIN && (
              <select 
                value={promoterFilter}
                onChange={(e) => setPromoterFilter(e.target.value)}
                className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap shadow-sm"
              >
                <option value="ALL">TODOS LOS GESTORES</option>
                {promoters.map(p => <option key={p.id} value={p.id}>{p.name.toUpperCase()}</option>)}
              </select>
            )}
            <select 
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-[10px] font-black uppercase text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
            >
              <option value="ALL">TODOS LOS ESTADOS</option>
              {Object.values(ActivityStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className={`${isMobile ? 'space-y-3' : 'bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden'}`}>
        {!isMobile ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase tracking-widest font-black">
              <tr>
                <th className="px-6 py-4">Información de Acción</th>
                <th className="px-6 py-4">Verificación / Contacto</th>
                <th className="px-6 py-4">Estado / Observaciones</th>
                <th className="px-6 py-4 text-right">Detalles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredActivities.map((activity) => {
                const promoter = getPromoter(activity.promoterId);
                const isExpanded = expandedActivity === activity.id;

                return (
                  <React.Fragment key={activity.id}>
                    <tr className={`hover:bg-slate-50/80 transition-colors ${isExpanded ? 'bg-indigo-50/30' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                          <span className={`px-2 py-1 rounded border text-[9px] font-black uppercase whitespace-nowrap h-fit ${typeColors[activity.type]}`}>
                            {activity.type}
                          </span>
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{activity.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <img src={promoter?.photo} className="w-4 h-4 rounded-full" alt="" />
                              <span className="text-[11px] text-slate-500 font-medium">{promoter?.name} • {activity.startTime}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          {activity.verificationPhoto ? (
                            <div className="w-10 h-10 rounded-lg border-2 border-white shadow-sm overflow-hidden bg-slate-200 flex-shrink-0">
                              <img src={activity.verificationPhoto} className="w-full h-full object-cover" alt="Verificación" />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-lg border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-300">
                              <i className="fa-solid fa-camera text-xs"></i>
                            </div>
                          )}
                          <div className="text-[11px] text-slate-600">
                            {activity.communityContact ? (
                              <p className="font-bold leading-tight">{activity.communityContact.name} <span className="text-emerald-500 ml-1">{activity.communityContact.hasWhatsApp ? '(WA)' : ''}</span></p>
                            ) : (
                              <p className="italic opacity-50">Sin contacto</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-2">
                          <span className={`w-fit px-3 py-1 rounded-full text-[9px] font-black uppercase ${statusColors[activity.status]}`}>
                            {activity.status}
                          </span>
                          {activity.adminComments && (
                            <div className="flex items-center gap-1.5 text-indigo-600 font-bold text-[10px]">
                              <i className="fa-solid fa-comment-dots"></i>
                              Observación Admin
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
                          className={`p-2 rounded-lg transition-all ${isExpanded ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:text-indigo-600'}`}
                        >
                          <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-eye'}`}></i>
                        </button>
                      </td>
                    </tr>
                    {isExpanded && <ExpandedDetails activity={activity} userRole={userRole} onUpdateActivity={onUpdateActivity} />}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="space-y-4">
            {filteredActivities.map((activity) => {
              const promoter = getPromoter(activity.promoterId);
              const isExpanded = expandedActivity === activity.id;

              return (
                <div key={activity.id} className={`bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all ${isExpanded ? 'ring-2 ring-indigo-500' : ''}`}>
                  <div className="p-4 flex flex-col gap-3" onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}>
                    <div className="flex justify-between items-start">
                      <span className={`px-2 py-0.5 rounded border text-[8px] font-black uppercase ${typeColors[activity.type]}`}>
                        {activity.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${statusColors[activity.status]}`}>
                        {activity.status}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 line-clamp-1">{activity.title}</h3>
                      <p className="text-[10px] text-slate-400 font-medium mt-1">{promoter?.name} • {activity.date} • {activity.startTime}</p>
                    </div>
                    <div className="flex items-center gap-3 py-2 border-t border-slate-50">
                      {activity.verificationPhoto && (
                        <div className="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                          <img src={activity.verificationPhoto} className="w-full h-full object-cover" alt="" />
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="text-[10px] font-bold text-slate-700">Contacto: {activity.communityContact?.name || 'N/A'}</p>
                        <p className="text-[9px] text-slate-400">Comunidad: {activity.communityContact?.community || 'N/A'}</p>
                      </div>
                      <i className={`fa-solid ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-slate-300 text-xs`}></i>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="p-4 bg-slate-50/80 border-t border-slate-100 space-y-4 animate-in slide-in-from-top-2">
                       <ExpandedDetails activity={activity} userRole={userRole} onUpdateActivity={onUpdateActivity} isMobile={true} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      
      {filteredActivities.length === 0 && (
        <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-dashed border-slate-200">
          <i className="fa-solid fa-folder-open text-4xl mb-3 opacity-20"></i>
          <p className="text-sm font-medium">No se encontraron actividades registradas.</p>
        </div>
      )}
    </div>
  );
};

const ExpandedDetails = ({ activity, userRole, onUpdateActivity, isMobile }: { activity: any, userRole: UserRole, onUpdateActivity: any, isMobile?: boolean }) => {
  const content = (
    <div className={`grid grid-cols-1 ${!isMobile ? 'md:grid-cols-2 lg:grid-cols-3' : ''} gap-6`}>
      <div className="space-y-4">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacto Comunitario</h4>
        {activity.communityContact ? (
          <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-2">
            <p className="text-xs font-bold text-slate-800">{activity.communityContact.name}</p>
            <div className="flex flex-col gap-1 text-[10px] text-slate-500 font-medium">
              <span><i className="fa-solid fa-phone w-4"></i> {activity.communityContact.phone}</span>
              <span><i className="fa-solid fa-user-tag w-4"></i> {activity.communityContact.role}</span>
              <span><i className="fa-solid fa-map-location-dot w-4"></i> {activity.communityContact.community}</span>
            </div>
          </div>
        ) : <p className="text-[10px] text-slate-400 italic">No hay contacto registrado</p>}
      </div>

      <div className="space-y-4">
        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Observaciones e Incidentes</h4>
        <div className="space-y-3">
          <div>
            <label className="text-[8px] font-black text-slate-400 uppercase mb-1 block">Observación Gestor</label>
            {userRole === UserRole.FIELD_PROMOTER ? (
              <textarea 
                className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs"
                value={activity.observations || ''}
                onChange={(e) => onUpdateActivity(activity.id, { observations: e.target.value })}
              />
            ) : <p className="text-[11px] bg-white p-2 rounded-xl border border-slate-100">{activity.observations || '-'}</p>}
          </div>
          {activity.incidents && (
            <div className="p-2 bg-red-50 rounded-xl border border-red-100">
              <label className="text-[8px] font-black text-red-400 uppercase mb-1 block">Incidente Reportado</label>
              <p className="text-[11px] text-red-700 font-medium">{activity.incidents}</p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Retroalimentación Jefatura</h4>
        <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100">
          {userRole === UserRole.ADMIN ? (
            <div className="space-y-3">
              <textarea 
                className="w-full bg-white border border-indigo-100 rounded-xl p-2 text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                value={activity.adminComments || ''}
                placeholder="Escribe un comentario..."
                onChange={(e) => onUpdateActivity(activity.id, { adminComments: e.target.value })}
              />
              <button onClick={() => alert('Retroalimentación enviada')} className="w-full bg-indigo-600 text-white text-[9px] font-black py-2 rounded-lg uppercase tracking-widest shadow-md">
                Enviar Feedback
              </button>
            </div>
          ) : (
            <p className="text-xs text-indigo-900 italic font-medium">{activity.adminComments || 'Pendiente de revisión por administración...'}</p>
          )}
        </div>
      </div>
    </div>
  );

  return !isMobile ? (
    <tr><td colSpan={4} className="px-6 py-6 bg-slate-50/50 border-x border-slate-100">{content}</td></tr>
  ) : content;
};

export default ActivityLog;
