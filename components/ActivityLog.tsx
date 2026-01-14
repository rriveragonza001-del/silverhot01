
import React, { useState } from 'react';
import { Activity, ActivityStatus, ProblemType, Promoter, UserRole } from '../types';

// Moved to top and fixed children prop type
const FormField = ({ label, children }: { label: string, children?: React.ReactNode }) => (
  <div className="space-y-1.5">
    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{label}</label>
    {children}
  </div>
);

const InfoBox = ({ label, value, subValue }: { label: string, value: string, subValue?: string }) => (
  <div className="space-y-1">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
    <div className="bg-white px-4 py-3 rounded-2xl border border-slate-200 shadow-sm">
      <p className="text-xs font-bold text-slate-800 truncate">{value || 'N/A'}</p>
      {subValue && <p className="text-[9px] text-slate-400 font-medium truncate">{subValue}</p>}
    </div>
  </div>
);

interface ActivityLogProps {
  activities: Activity[];
  promoters: Promoter[];
  userRole: UserRole;
  onUpdateActivity: (id: string, updates: Partial<Activity>) => void;
  onAddActivity?: (activity: Activity) => void;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, promoters, userRole, onUpdateActivity, onAddActivity }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<ActivityStatus | 'ALL'>('ALL');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<Activity>>({
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    community: '',
    objective: '',
    attendeeName: '',
    attendeeRole: '',
    attendeePhone: '',
    proposals: '',
    problemsIdentified: ProblemType.OTRAS,
    agreements: '',
    additionalObservations: '',
    driveLinks: '',
    referral: '',
    companions: '',
    status: ActivityStatus.COMPLETED
  });

  const getPromoter = (id: string) => promoters.find(p => p.id === id);
  
  const filtered = activities.filter(a => {
    return filter === 'ALL' || a.status === filter;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddActivity) {
      const newActivity = {
        ...formData,
        id: 'act-' + Date.now(),
        location: { lat: 13.6929, lng: -89.2182 } // Default coordination
      } as Activity;
      onAddActivity(newActivity);
      setIsModalOpen(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        community: '',
        objective: '',
        attendeeName: '',
        attendeeRole: '',
        attendeePhone: '',
        proposals: '',
        problemsIdentified: ProblemType.OTRAS,
        agreements: '',
        additionalObservations: '',
        driveLinks: '',
        referral: '',
        companions: '',
        status: ActivityStatus.COMPLETED
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight">Bitácora de Labores</h2>
          <p className="text-sm text-slate-500 font-medium">Historial detallado de acciones en territorio</p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value as any)} 
            className="flex-1 md:flex-none bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-600 outline-none"
          >
            <option value="ALL">TODOS LOS ESTADOS</option>
            {Object.values(ActivityStatus).map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {userRole === UserRole.FIELD_PROMOTER && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              Registrar Acción
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filtered.map(activity => {
          const isExpanded = expandedActivity === activity.id;
          const promoter = getPromoter(activity.promoterId);
          return (
            <div key={activity.id} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div 
                className="p-6 cursor-pointer"
                onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex gap-2">
                    <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                      {activity.community || 'Sin Comunidad'}
                    </span>
                    <span className="text-[9px] font-black uppercase text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-100">
                      {activity.date}
                    </span>
                  </div>
                  <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-300`}></i>
                </div>
                
                <h3 className="font-black text-slate-800 text-lg leading-tight mb-4">{activity.objective}</h3>
                
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <img src={promoter?.photo} className="w-8 h-8 rounded-xl object-cover border-2 border-white shadow-sm" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Gestor</p>
                      <p className="text-xs font-bold text-slate-700">{promoter?.name}</p>
                    </div>
                  </div>
                  
                  <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
                  
                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Problemática</p>
                    <p className="text-xs font-bold text-red-500">{activity.problemsIdentified}</p>
                  </div>

                  <div className="h-8 w-px bg-slate-100 hidden md:block"></div>

                  <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter leading-none">Estado</p>
                    <p className="text-xs font-black text-indigo-600 uppercase">{activity.status}</p>
                  </div>
                </div>
              </div>

              {isExpanded && (
                <div className="px-6 pb-8 pt-4 bg-slate-50/50 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <InfoBox label="Contacto Atendido" value={activity.attendeeName} subValue={activity.attendeeRole} />
                        <InfoBox label="Teléfono Contacto" value={activity.attendeePhone} />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Propuestas y Comentarios</label>
                        <p className="text-sm bg-white p-4 rounded-2xl border border-slate-200 text-slate-700 leading-relaxed shadow-sm">
                          {activity.proposals || 'Sin propuestas registradas.'}
                        </p>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Acuerdos Alcanzados</label>
                        <p className="text-sm bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-indigo-900 font-medium leading-relaxed">
                          {activity.agreements || 'Pendiente de definir acuerdos.'}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <InfoBox label="Referido a" value={activity.referral || 'N/A'} />
                        <InfoBox label="Compañeros" value={activity.companions || 'Solo'} />
                      </div>
                    </div>

                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Observaciones Adicionales</label>
                        <p className="text-xs bg-white p-4 rounded-2xl border border-slate-200 text-slate-500 italic">
                          {activity.additionalObservations || 'Sin observaciones extras.'}
                        </p>
                      </div>

                      {activity.driveLinks && (
                        <a 
                          href={activity.driveLinks} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-3 p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all group"
                        >
                          <i className="fa-brands fa-google-drive text-2xl"></i>
                          <div>
                            <p className="text-[10px] font-black uppercase">Recursos Externos</p>
                            <p className="text-xs font-bold truncate group-hover:underline">Ver Documentos en Drive</p>
                          </div>
                        </a>
                      )}

                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Firma de Jefatura</label>
                        {userRole === UserRole.ADMIN ? (
                          <textarea 
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 text-xs outline-none focus:border-indigo-600 transition-all shadow-sm"
                            placeholder="Agregar comentario administrativo..."
                            value={activity.adminComments || ''}
                            onClick={e => e.stopPropagation()}
                            onChange={e => onUpdateActivity(activity.id, { adminComments: e.target.value })}
                          />
                        ) : (
                          <p className="text-xs italic text-indigo-900 bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                            {activity.adminComments || 'Esperando revisión de supervisor...'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && (
          <div className="bg-white rounded-[2rem] p-20 text-center border-2 border-dashed border-slate-200">
            <i className="fa-solid fa-clipboard-question text-4xl text-slate-200 mb-4"></i>
            <p className="text-slate-400 font-bold uppercase text-sm">No hay acciones registradas para mostrar</p>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden animate-in zoom-in-95 duration-300 my-8">
            <div className="px-10 py-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Acción Territorial</h3>
                <p className="text-sm text-slate-400 font-medium uppercase tracking-widest text-[10px]">Registro de labor institucional</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-white rounded-full text-slate-400 hover:text-slate-600 shadow-sm transition-colors border border-slate-100"><i className="fa-solid fa-xmark text-xl"></i></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-10 space-y-10">
              {/* Sección 1: Información Base */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-indigo-600 pl-4">
                  <span className="text-sm font-black text-indigo-600 uppercase tracking-widest">1. Datos Generales</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Fecha de la Visita">
                    <input required type="date" className="input-field" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                  </FormField>
                  <FormField label="Hora (Columna 3)">
                    <input required type="time" className="input-field" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </FormField>
                  <FormField label="Comunidad / Sector">
                    <input required className="input-field" value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} placeholder="Ej: Renacimiento 86" />
                  </FormField>
                  <div className="md:col-span-3">
                    <FormField label="Objetivo de la Visita">
                      <input required className="input-field font-bold text-indigo-700" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} placeholder="Ej: Programar reparación de luminarias" />
                    </FormField>
                  </div>
                </div>
              </div>

              {/* Sección 2: Contacto */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-emerald-500 pl-4">
                  <span className="text-sm font-black text-emerald-600 uppercase tracking-widest">2. Contacto Comunitario</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <FormField label="Nombre Atiende">
                    <input required className="input-field" value={formData.attendeeName} onChange={e => setFormData({...formData, attendeeName: e.target.value})} placeholder="Nombre completo" />
                  </FormField>
                  <FormField label="Cargo / Rol">
                    <input className="input-field" value={formData.attendeeRole} onChange={e => setFormData({...formData, attendeeRole: e.target.value})} placeholder="Ej: Síndico de JD" />
                  </FormField>
                  <FormField label="Teléfono">
                    <input className="input-field" value={formData.attendeePhone} onChange={e => setFormData({...formData, attendeePhone: e.target.value})} placeholder="0000-0000" />
                  </FormField>
                </div>
              </div>

              {/* Sección 3: Análisis Técnico */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-amber-500 pl-4">
                  <span className="text-sm font-black text-amber-600 uppercase tracking-widest">3. Hallazgos y Acuerdos</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <FormField label="Problemáticas Identificadas">
                    <select required className="input-field font-bold" value={formData.problemsIdentified} onChange={e => setFormData({...formData, problemsIdentified: e.target.value as any})}>
                      {Object.values(ProblemType).map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </FormField>
                  <FormField label="Propuestas / Comentarios">
                    <textarea rows={3} className="input-field resize-none" value={formData.proposals} onChange={e => setFormData({...formData, proposals: e.target.value})} placeholder="¿Qué se propuso en la visita?" />
                  </FormField>
                  <FormField label="Acuerdos Específicos">
                    <textarea rows={3} className="input-field resize-none bg-indigo-50/30 border-indigo-100 font-medium" value={formData.agreements} onChange={e => setFormData({...formData, agreements: e.target.value})} placeholder="¿A qué compromisos se llegó?" />
                  </FormField>
                  <FormField label="Observaciones Adicionales">
                    <textarea rows={3} className="input-field resize-none" value={formData.additionalObservations} onChange={e => setFormData({...formData, additionalObservations: e.target.value})} />
                  </FormField>
                </div>
              </div>

              {/* Sección 4: Otros */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-l-4 border-slate-800 pl-4">
                  <span className="text-sm font-black text-slate-800 uppercase tracking-widest">4. Otros y Seguimiento</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField label="Drive Link (Columna 13)">
                    <input className="input-field italic" value={formData.driveLinks} onChange={e => setFormData({...formData, driveLinks: e.target.value})} placeholder="URL de Google Drive" />
                  </FormField>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField label="Referido a">
                      <input className="input-field" value={formData.referral} onChange={e => setFormData({...formData, referral: e.target.value})} placeholder="Unidad / Depto" />
                    </FormField>
                    <FormField label="Acompañantes">
                      <input className="input-field" value={formData.companions} onChange={e => setFormData({...formData, companions: e.target.value})} placeholder="Nombres" />
                    </FormField>
                  </div>
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center md:justify-end gap-4 pt-10 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-4 text-sm font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-widest">Cerrar</button>
                <button type="submit" className="bg-indigo-600 text-white px-16 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-indigo-200 active:scale-95 transition-all">Finalizar Registro</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .input-field {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1rem;
          padding: 0.85rem 1.25rem;
          font-size: 0.875rem;
          color: #1e293b;
          outline: none;
          transition: all 0.2s;
        }
        .input-field:focus {
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 4px 12px -2px rgba(79, 70, 229, 0.08);
        }
      `}</style>
    </div>
  );
};

export default ActivityLog;
