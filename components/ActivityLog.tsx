
import React, { useState } from 'react';
import { Activity, ActivityStatus, ActivityType, ProblemType, Promoter, UserRole } from '../types';

// Componentes de interfaz para replicar la captura de pantalla
// Se marcó children como opcional para corregir errores de compilación de TypeScript en el entorno de ejecución
const Label = ({ children }: { children?: React.ReactNode }) => (
  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block px-1">
    {children}
  </label>
);

const DataBox = ({ value, subValue, className = "" }: { value: string, subValue?: string, className?: string }) => (
  <div className={`bg-white px-5 py-4 rounded-2xl border border-slate-100 shadow-sm min-h-[58px] flex flex-col justify-center ${className}`}>
    <p className="text-sm font-bold text-slate-800 leading-tight">{value || '---'}</p>
    {subValue && <p className="text-[10px] text-slate-400 font-medium mt-1 uppercase">{subValue}</p>}
  </div>
);

const TextBox = ({ value, color = "text-slate-700", bg = "bg-white", border = "border-slate-100" }: { value: string, color?: string, bg?: string, border?: string }) => (
  <div className={`${bg} p-6 rounded-2xl border ${border} shadow-sm min-h-[110px]`}>
    <p className={`text-sm leading-relaxed ${color}`}>{value || 'Sin información registrada.'}</p>
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
    // Added initial type state
    type: ActivityType.COMMUNITY_VISIT,
    agreements: '',
    additionalObservations: '',
    driveLinks: '',
    referral: '',
    companions: '',
    status: ActivityStatus.COMPLETED // 1. Estado al momento de ingresar
  });

  const getPromoter = (id: string) => promoters.find(p => p.id === id);
  const filtered = activities.filter(a => filter === 'ALL' || a.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddActivity) {
      const newActivity = {
        ...formData,
        id: 'act-' + Date.now(),
        location: { lat: 13.6929, lng: -89.2182 }
      } as Activity;
      onAddActivity(newActivity);
      setIsModalOpen(false);
      // Reset form
      setFormData({
        ...formData,
        community: '', objective: '', attendeeName: '', attendeeRole: '', attendeePhone: '', 
        proposals: '', agreements: '', additionalObservations: '', driveLinks: '', referral: '', companions: ''
      });
    }
  };

  const getStatusStyle = (status: ActivityStatus) => {
    switch(status) {
      case ActivityStatus.COMPLETED: return 'text-indigo-600 bg-indigo-50 border-indigo-100';
      case ActivityStatus.IN_PROGRESS: return 'text-amber-600 bg-amber-50 border-amber-100';
      case ActivityStatus.PENDING: return 'text-slate-500 bg-slate-50 border-slate-100';
      case ActivityStatus.CANCELLED: return 'text-red-600 bg-red-50 border-red-100';
      default: return 'text-slate-500 bg-slate-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header del Log */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200 gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Registro de Actividades</h2>
          <p className="text-sm text-slate-400 font-medium">Historial de gestiones y reporte de novedades</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value as any)} 
            className="flex-1 md:flex-none bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3 text-xs font-black text-slate-600 outline-none focus:border-indigo-600 transition-all"
          >
            <option value="ALL">TODOS LOS REGISTROS</option>
            {Object.values(ActivityStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
          </select>
          {userRole === UserRole.FIELD_PROMOTER && (
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i>
              Registrar Acción
            </button>
          )}
        </div>
      </div>

      {/* Lista de Actividades */}
      <div className="space-y-6">
        {filtered.map(activity => {
          const isExpanded = expandedActivity === activity.id;
          const promoter = getPromoter(activity.promoterId);
          
          return (
            <div key={activity.id} className="bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              {/* Resumen de la Tarjeta */}
              <div 
                className="p-10 cursor-pointer flex items-start justify-between gap-6"
                onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
              >
                <div className="flex-1 space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                      {activity.community || 'Sin Comunidad'}
                    </span>
                    <span className="text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                      {activity.date}
                    </span>
                    {/* Display Activity Type badge */}
                    <span className="text-[10px] font-black uppercase text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full border border-emerald-100">
                      {activity.type}
                    </span>
                  </div>
                  
                  <h3 className="font-black text-slate-800 text-3xl leading-tight tracking-tight">
                    {activity.objective}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-12 pt-2">
                    <div className="flex items-center gap-4">
                      <img src={promoter?.photo} className="w-12 h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                      <div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Gestor</p>
                        <p className="text-sm font-bold text-slate-800">{promoter?.name}</p>
                      </div>
                    </div>
                    
                    <div className="h-10 w-px bg-slate-100 hidden md:block"></div>
                    
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Problemática</p>
                      <p className="text-sm font-black text-red-500 uppercase">{activity.problemsIdentified}</p>
                    </div>

                    <div className="h-10 w-px bg-slate-100 hidden md:block"></div>

                    {/* 2. Cambio de estado después de registrado (POST-REGISTRO) */}
                    <div>
                      <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-1">Estado</p>
                      <select 
                        value={activity.status}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateActivity(activity.id, { status: e.target.value as ActivityStatus })}
                        className={`text-xs font-black uppercase px-4 py-1.5 rounded-xl border-2 outline-none cursor-pointer transition-all ${getStatusStyle(activity.status)}`}
                      >
                        {Object.values(ActivityStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="pt-2">
                  <i className={`fa-solid fa-chevron-${isExpanded ? 'up' : 'down'} text-slate-300 text-xl`}></i>
                </div>
              </div>

              {/* Detalle Expandido (UI coincidente con captura) */}
              {isExpanded && (
                <div className="px-10 pb-12 pt-8 bg-slate-50/40 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* Columna Principal (Izquierda) */}
                    <div className="lg:col-span-8 space-y-10">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <Label>Contacto Atendido</Label>
                          <DataBox value={activity.attendeeName} subValue={activity.attendeeRole} />
                        </div>
                        <div>
                          <Label>Teléfono Contacto</Label>
                          <DataBox value={activity.attendeePhone} />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Propuestas y Comentarios</Label>
                        <TextBox value={activity.proposals} />
                      </div>

                      <div>
                        <Label>Acuerdos Alcanzados</Label>
                        <TextBox 
                          value={activity.agreements} 
                          color="text-indigo-900 font-bold" 
                          bg="bg-indigo-50/50" 
                          border="border-indigo-100" 
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <Label>Referido a</Label>
                          <DataBox value={activity.referral} />
                        </div>
                        <div>
                          <Label>Compañeros</Label>
                          <DataBox value={activity.companions} />
                        </div>
                      </div>
                    </div>

                    {/* Columna Lateral (Derecha) */}
                    <div className="lg:col-span-4 space-y-10">
                      <div>
                        <Label>Observaciones Adicionales</Label>
                        <TextBox value={activity.additionalObservations} color="text-slate-500 italic" />
                      </div>

                      <div className="space-y-4">
                        <Label>Recursos Externos</Label>
                        {activity.driveLinks ? (
                          <a 
                            href={activity.driveLinks} 
                            target="_blank" 
                            rel="noreferrer"
                            className="flex items-center gap-5 p-6 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100 hover:bg-emerald-100 transition-all group shadow-sm"
                          >
                            <i className="fa-brands fa-google-drive text-4xl"></i>
                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest">RECURSOS EXTERNOS</p>
                              <p className="text-sm font-bold truncate group-hover:underline">Ver Documentos en Drive</p>
                            </div>
                          </a>
                        ) : (
                          <div className="p-6 bg-slate-100 text-slate-400 rounded-3xl border border-slate-200 text-center">
                            <p className="text-xs font-bold uppercase">Sin Enlaces Adjuntos</p>
                          </div>
                        )}
                      </div>

                      <div className="space-y-4">
                        <Label>Firma de Jefatura</Label>
                        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm min-h-[90px] flex flex-col justify-center">
                          {userRole === UserRole.ADMIN ? (
                            <textarea 
                              className="w-full text-xs font-medium text-slate-600 outline-none border-none resize-none bg-transparent"
                              placeholder="Escriba aquí la validación administrativa..."
                              value={activity.adminComments || ''}
                              onClick={e => e.stopPropagation()}
                              onChange={e => onUpdateActivity(activity.id, { adminComments: e.target.value })}
                            />
                          ) : (
                            <p className="text-xs italic text-indigo-900 font-medium">
                              {activity.adminComments || 'Esperando revisión de supervisor...'}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal de Ingreso (Optimizado con todos los campos) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="px-14 py-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <div>
                <h3 className="text-3xl font-black text-slate-800 tracking-tight">Nueva Gestión de Campo</h3>
                <p className="text-xs text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Sincronización de bitácora institucional</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-16 h-16 flex items-center justify-center bg-white rounded-full text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all active:scale-90">
                <i className="fa-solid fa-xmark text-2xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-14 space-y-12 overflow-y-auto no-scrollbar flex-1">
              {/* Sección: Datos de Identificación */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <Label>Fecha</Label>
                  <input required type="date" className="custom-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Hora (Columna 3)</Label>
                  <input required type="time" className="custom-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div>
                  <Label>Estado Inicial (Momento 1)</Label>
                  <select required className="custom-input font-black text-indigo-600" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    {Object.values(ActivityStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label>Comunidad / Colonia / Sector</Label>
                  <input required className="custom-input" value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} placeholder="Ej: Lirios del Norte 1era Etapa" />
                </div>
                <div>
                  <Label>Tipo de Problemática</Label>
                  <select required className="custom-input" value={formData.problemsIdentified} onChange={e => setFormData({...formData, problemsIdentified: e.target.value as any})}>
                    {Object.values(ProblemType).map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Added row for Activity Type selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label>Tipo de Actividad</Label>
                  <select required className="custom-input font-bold text-indigo-600" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div className="hidden md:block"></div>
              </div>

              <div>
                <Label>Objetivo Principal de la Visita</Label>
                <input required className="custom-input font-bold text-indigo-800" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} placeholder="Ej: Visita de seguimiento para reparación de drenajes" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <Label>Nombre Persona Atendida</Label>
                  <input required className="custom-input" value={formData.attendeeName} onChange={e => setFormData({...formData, attendeeName: e.target.value})} placeholder="Ej: Juan Perez" />
                </div>
                <div>
                  <Label>Cargo / Rol Comunitario</Label>
                  <input className="custom-input" value={formData.attendeeRole} onChange={e => setFormData({...formData, attendeeRole: e.target.value})} placeholder="Ej: Presidente de ADESCO" />
                </div>
                <div>
                  <Label>Contacto Telefónico</Label>
                  <input className="custom-input" value={formData.attendeePhone} onChange={e => setFormData({...formData, attendeePhone: e.target.value})} placeholder="7777-2727" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label>Propuestas y Comentarios</Label>
                  <textarea rows={4} className="custom-input resize-none" value={formData.proposals} onChange={e => setFormData({...formData, proposals: e.target.value})} />
                </div>
                <div>
                  <Label>Acuerdos Alcanzados</Label>
                  <textarea rows={4} className="custom-input resize-none font-bold text-indigo-900 bg-indigo-50/20" value={formData.agreements} onChange={e => setFormData({...formData, agreements: e.target.value})} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <Label>Referido a (Unidad)</Label>
                  <input className="custom-input" value={formData.referral} onChange={e => setFormData({...formData, referral: e.target.value})} placeholder="Ej: Desarrollo Urbano" />
                </div>
                <div>
                  <Label>Compañeros de Equipo</Label>
                  <input className="custom-input" value={formData.companions} onChange={e => setFormData({...formData, companions: e.target.value})} placeholder="Ej: Janira Alvarado, Dolores Hernandez" />
                </div>
                <div>
                  <Label>Link de Evidencia (Drive)</Label>
                  <input className="custom-input italic text-emerald-600" value={formData.driveLinks} onChange={e => setFormData({...formData, driveLinks: e.target.value})} placeholder="https://drive.google.com/..." />
                </div>
              </div>

              <div>
                <Label>Observaciones Adicionales</Label>
                <textarea rows={2} className="custom-input resize-none italic" value={formData.additionalObservations} onChange={e => setFormData({...formData, additionalObservations: e.target.value})} placeholder="Cualquier detalle relevante adicional..." />
              </div>

              <div className="flex flex-col md:flex-row justify-center md:justify-end gap-6 pt-10 border-t border-slate-100 flex-shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-12 py-5 text-sm font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-[0.2em]">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-24 py-5 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all">Guardar Actividad</button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      <style>{`
        .custom-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.5rem;
          padding: 1.25rem 1.75rem;
          font-size: 0.95rem;
          color: #1e293b;
          outline: none;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .custom-input:focus {
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 10px 30px -5px rgba(79, 70, 229, 0.12);
        }
      `}</style>
    </div>
  );
};

export default ActivityLog;