
import React, { useState, useRef } from 'react';
import { Activity, ActivityStatus, ActivityType, ProblemType, Promoter, UserRole } from '../types';

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
  currentUserId: string;
}

const ActivityLog: React.FC<ActivityLogProps> = ({ activities, promoters, userRole, onUpdateActivity, onAddActivity, currentUserId }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filter, setFilter] = useState<ActivityStatus | 'ALL'>('ALL');
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    type: ActivityType.COMMUNITY_VISIT,
    agreements: '',
    additionalObservations: '',
    driveLinks: '',
    referral: '',
    companions: '',
    status: ActivityStatus.PENDING
  });

  const getPromoter = (id: string) => promoters.find(p => p.id === id);
  const filtered = activities.filter(a => filter === 'ALL' || a.status === filter);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddActivity) {
      const newActivity = {
        ...formData,
        id: 'act-' + Date.now(),
        promoterId: currentUserId,
        location: { lat: 13.6929, lng: -89.2182 }
      } as Activity;
      onAddActivity(newActivity);
      setIsModalOpen(false);
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      community: '', objective: '', attendeeName: '', attendeeRole: '', attendeePhone: '', 
      proposals: '', agreements: '', additionalObservations: '', driveLinks: '', referral: '', companions: '',
      status: ActivityStatus.PENDING
    });
  };

  const handleStatusChange = (id: string, newStatus: ActivityStatus) => {
    onUpdateActivity(id, { status: newStatus });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, activityId: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        alert("Subiendo fotografía a su Google Drive institucional...");
        onUpdateActivity(activityId, { verificationPhoto: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleConnectDrive = () => {
    alert("Redirigiendo a autenticación de Google Drive para vincular su cuenta institucional...");
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 gap-6">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Registro de Actividades</h2>
          <p className="text-sm text-slate-400 font-medium">Gestión de campo y control de estados</p>
        </div>
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
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
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-95 flex items-center gap-2"
            >
              <i className="fa-solid fa-plus"></i> Nueva Actividad
            </button>
          )}
        </div>
      </div>

      <div className="space-y-6">
        {filtered.map(activity => {
          const isExpanded = expandedActivity === activity.id;
          const promoter = getPromoter(activity.promoterId);
          const isInProgress = activity.status === ActivityStatus.IN_PROGRESS;
          const isCompleted = activity.status === ActivityStatus.COMPLETED;
          const isCancelled = activity.status === ActivityStatus.CANCELLED;
          
          return (
            <div key={activity.id} className="bg-white rounded-[2rem] md:rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div 
                className="p-6 md:p-10 cursor-pointer flex items-start justify-between gap-4 md:gap-6"
                onClick={() => setExpandedActivity(isExpanded ? null : activity.id)}
              >
                <div className="flex-1 space-y-4 md:space-y-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-full border border-indigo-100">
                      {activity.community || 'Sin Comunidad'}
                    </span>
                    <span className="text-[9px] md:text-[10px] font-black uppercase text-slate-400 bg-slate-50 px-4 py-1.5 rounded-full border border-slate-100">
                      {activity.date} | {activity.time}
                    </span>
                  </div>
                  
                  <h3 className="font-black text-slate-800 text-2xl md:text-3xl leading-tight tracking-tight">
                    {activity.objective}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-8 md:gap-12 pt-2">
                    <div className="flex items-center gap-3 md:gap-4">
                      <img src={promoter?.photo} className="w-10 h-10 md:w-12 md:h-12 rounded-2xl object-cover border-2 border-white shadow-md" />
                      <div>
                        <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Gestor</p>
                        <p className="text-xs md:text-sm font-bold text-slate-800">{promoter?.name}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Estado Actual</p>
                      <select 
                        value={activity.status}
                        disabled={isCompleted}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => handleStatusChange(activity.id, e.target.value as ActivityStatus)}
                        className={`text-[10px] font-black uppercase px-4 py-1.5 rounded-xl border-2 outline-none cursor-pointer transition-all ${getStatusStyle(activity.status)} ${isCompleted ? 'opacity-70' : ''}`}
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

              {isExpanded && (
                <div className="px-6 md:px-10 pb-10 md:pb-12 pt-6 md:pt-8 bg-slate-50/40 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-10">
                    <div className="lg:col-span-8 space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <Label>Contacto Atendido</Label>
                          <DataBox value={activity.attendeeName} subValue={activity.attendeeRole} />
                        </div>
                        <div>
                          <Label>Teléfono</Label>
                          <DataBox value={activity.attendeePhone} />
                        </div>
                      </div>

                      <div className="space-y-8">
                        <div>
                          <Label>Propuestas y Comentarios</Label>
                          {isInProgress ? (
                            <textarea 
                              className="custom-input min-h-[120px]" 
                              value={activity.proposals} 
                              onChange={e => onUpdateActivity(activity.id, { proposals: e.target.value })}
                              placeholder="Ingrese comentarios surgidos en la visita..."
                            />
                          ) : (
                            <TextBox value={activity.proposals} />
                          )}
                        </div>

                        <div>
                          <Label>Acuerdos Alcanzados</Label>
                          {isInProgress ? (
                            <textarea 
                              className="custom-input min-h-[120px] font-bold text-indigo-900" 
                              value={activity.agreements} 
                              onChange={e => onUpdateActivity(activity.id, { agreements: e.target.value })}
                              placeholder="Detalle los acuerdos pactados..."
                            />
                          ) : (
                            <TextBox value={activity.agreements} color="text-indigo-900 font-bold" bg="bg-indigo-50/30" border="border-indigo-100" />
                          )}
                        </div>
                        
                        <div>
                          <Label>Referido a (Unidad Institucional)</Label>
                          {isInProgress ? (
                            <input 
                              className="custom-input" 
                              value={activity.referral} 
                              onChange={e => onUpdateActivity(activity.id, { referral: e.target.value })}
                              placeholder="Ej: Desarrollo Urbano / Mantenimiento Vial"
                            />
                          ) : (
                            <DataBox value={activity.referral} />
                          )}
                        </div>
                      </div>

                      {isCancelled && (
                        <div className="bg-red-50 p-6 md:p-8 rounded-3xl border border-red-100 space-y-4">
                           <Label>Bitácora de Cancelación</Label>
                           <textarea 
                              className="custom-input border-red-200" 
                              value={activity.cancellationReason}
                              onChange={e => onUpdateActivity(activity.id, { cancellationReason: e.target.value })}
                              placeholder="Describa el motivo por el cual se canceló la gestión institucional..."
                           />
                           <label className="flex items-center gap-3 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={activity.willReschedule}
                                onChange={e => onUpdateActivity(activity.id, { willReschedule: e.target.checked })}
                                className="w-5 h-5 rounded border-red-200 text-red-600 focus:ring-red-500" 
                              />
                              <span className="text-sm font-black text-red-800 uppercase tracking-tight">¿Actividad para Reprogramar?</span>
                           </label>
                        </div>
                      )}
                    </div>

                    <div className="lg:col-span-4 space-y-10">
                      <div className="space-y-4">
                        <Label>Gestión de Evidencia</Label>
                        <div className="grid grid-cols-1 gap-3">
                          <button 
                            onClick={handleConnectDrive}
                            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-left shadow-sm group"
                          >
                            <i className="fa-brands fa-google-drive text-3xl text-emerald-600 group-hover:scale-110 transition-transform"></i>
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-400">Google Drive</p>
                               <p className="text-[11px] font-bold text-slate-700">Explorar Mi Drive</p>
                            </div>
                          </button>

                          <button 
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-4 p-5 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all text-left shadow-sm group"
                          >
                            <i className="fa-solid fa-camera-retro text-3xl text-indigo-600 group-hover:scale-110 transition-transform"></i>
                            <div>
                               <p className="text-[10px] font-black uppercase text-slate-400">Galería / Cámara</p>
                               <p className="text-[11px] font-bold text-slate-700">Subir Evidencia Local</p>
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handlePhotoUpload(e, activity.id)} />
                          </button>
                        </div>
                        
                        {activity.verificationPhoto && (
                          <div className="relative mt-4 rounded-3xl overflow-hidden border-4 border-white shadow-xl">
                            <img src={activity.verificationPhoto} className="w-full aspect-video object-cover" alt="Evidencia de gestión" />
                            <div className="absolute top-3 right-3 bg-emerald-500 text-white px-3 py-1.5 rounded-full shadow-lg flex items-center gap-2">
                               <i className="fa-solid fa-cloud-arrow-up text-[10px]"></i>
                               <span className="text-[8px] font-black uppercase">Sincronizado</span>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label>Enlace Externo (Drive/Docs)</Label>
                        {!isCompleted ? (
                          <input 
                            className="custom-input text-[11px] italic" 
                            value={activity.driveLinks}
                            onChange={e => onUpdateActivity(activity.id, { driveLinks: e.target.value })}
                            placeholder="https://drive.google.com/..."
                          />
                        ) : (
                          <a href={activity.driveLinks} target="_blank" className="block p-4 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-black truncate hover:underline">
                             {activity.driveLinks || 'Sin enlace adjunto'}
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white rounded-[2.5rem] md:rounded-[4rem] shadow-2xl w-full max-w-5xl overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] flex flex-col">
            <div className="px-8 md:px-14 py-8 md:py-12 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 flex-shrink-0">
              <div>
                <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Nueva Gestión Institucional</h3>
                <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.3em] mt-2">Bitácora territorial de campo</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-12 h-12 md:w-16 md:h-16 flex items-center justify-center bg-white rounded-full text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                <i className="fa-solid fa-xmark text-xl"></i>
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-8 md:p-14 space-y-10 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div>
                  <Label>Fecha de Labor</Label>
                  <input required type="date" className="custom-input" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
                </div>
                <div>
                  <Label>Hora Programada</Label>
                  <input required type="time" className="custom-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                </div>
                <div>
                  <Label>Estado de Apertura</Label>
                  <select required className="custom-input font-black text-indigo-600" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})}>
                    {Object.values(ActivityStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                  <Label>Comunidad / Sector / Colonia</Label>
                  <input required className="custom-input" value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} placeholder="Ej: Condominio Los Lirios" />
                </div>
                <div>
                  <Label>Tipo de Gestión</Label>
                  <select required className="custom-input font-bold" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                    {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <Label>Objetivo Estratégico de la Visita</Label>
                <input required className="custom-input font-black text-indigo-900" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} placeholder="Ej: Verificación de alumbrado público en pasajes internos" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <Label>Persona de Contacto</Label>
                  <input required className="custom-input" value={formData.attendeeName} onChange={e => setFormData({...formData, attendeeName: e.target.value})} placeholder="Nombre completo" />
                </div>
                <div>
                  <Label>Cargo / Rol en Comunidad</Label>
                  <input className="custom-input" value={formData.attendeeRole} onChange={e => setFormData({...formData, attendeeRole: e.target.value})} placeholder="Ej: Directivo de ADESCO" />
                </div>
                <div>
                  <Label>Teléfono de Contacto</Label>
                  <input className="custom-input" value={formData.attendeePhone} onChange={e => setFormData({...formData, attendeePhone: e.target.value})} placeholder="7777-2727" />
                </div>
              </div>

              <div className="flex flex-col md:flex-row justify-center md:justify-end gap-6 pt-10 border-t border-slate-100 flex-shrink-0">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-10 py-5 text-xs font-black text-slate-400 hover:text-slate-800 transition-colors uppercase tracking-[0.2em]">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-20 py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 active:scale-95 transition-all">Guardar Actividad</button>
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
          border-radius: 1.25rem;
          padding: 1rem 1.5rem;
          font-size: 0.9rem;
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
