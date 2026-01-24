
import React, { useState, useMemo, useRef } from 'react';
// Fix: Removed 'Type' from local types import
import { Activity, ActivityType, ActivityStatus, Location, UserRole, Promoter } from '../types';
// Fix: Imported 'Type' from @google/genai


interface ProgramModuleProps {
  activities: Activity[];
  promoters: Promoter[];
  onProgramLoaded: (activities: Activity[]) => void;
  onAddActivity: (activity: Activity) => void;
  currentLocation: Location;
  promoterId: string;
  userRole: UserRole;
  onRefresh?: () => void;
}

const ProgramModule: React.FC<ProgramModuleProps> = ({ 
  activities, 
  promoters,
  onProgramLoaded, 
  onAddActivity,
  currentLocation, 
  promoterId,
  userRole,
  onRefresh
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [extractedData, setExtractedData] = useState<Activity[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<Partial<Activity>>({
    time: '08:00',
    community: '',
    objective: '',
    attendeeName: '',
    attendeeRole: '',
    attendeePhone: '',
    type: ActivityType.COMMUNITY_VISIT,
    status: ActivityStatus.PENDING,
    promoterId: (userRole === UserRole.ADMIN && promoterId === 'ALL') ? '' : promoterId
  });

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      cells.push({ day: i, date: dateStr });
    }
    return cells;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const getActivitiesForDate = (date: string) => {
    return activities.filter(a => a.date === date).sort((a, b) => a.time.localeCompare(b.time));
  };

  const handleOpenDay = (date: string) => {
    setTargetDate(date);
    setIsDayViewOpen(true);
  };

  const openRegister = (e: React.MouseEvent, date: string) => {
    e.stopPropagation();
    setTargetDate(date);
    setFormData(prev => ({
      ...prev,
      promoterId: (userRole === UserRole.ADMIN && promoterId === 'ALL') ? '' : promoterId
    }));
    setIsRegistering(true);
  };

  const handleSync = () => {
    setIsSyncing(true);
    if (onRefresh) onRefresh();
    setTimeout(() => {
      setIsSyncing(false);
    }, 1000);
  };

  // Función para leer archivo y enviarlo a Gemini
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportLoading(true);
    setExtractedData([]);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(',')[1];
        
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: {
            parts: [
              {
                inlineData: {
                  data: base64Data,
                  mimeType: file.type || 'application/pdf'
                }
              },
              {
                text: `Analiza este documento PDF/Imagen de una agenda de promotores. 
                Extrae cada fila de la tabla de actividades y conviértela en un JSON con este formato exacto:
                Array de objetos { id, date, time, community, objective, attendeeName, attendeeRole, attendeePhone, type, status, promoterId }.
                Instrucciones críticas:
                - "date" debe ser YYYY-MM-DD.
                - "type" debe mapear a: ${Object.values(ActivityType).join(', ')}.
                - "status" debe ser siempre 'Pendiente' para nuevas cargas.
                - "promoterId": Si el documento menciona un gestor, busca su nombre y asume un ID. Si no lo sabes, deja el campo vacío.
                - No incluyas texto extra, solo el JSON puro.`
              }
            ]
          },
          config: {
            responseMimeType: "application/json",
            // Fix: Updated responseSchema to use Type enum
            responseSchema: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  date: { type: Type.STRING },
                  time: { type: Type.STRING },
                  community: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  attendeeName: { type: Type.STRING },
                  attendeeRole: { type: Type.STRING },
                  attendeePhone: { type: Type.STRING },
                  type: { type: Type.STRING },
                  status: { type: Type.STRING },
                  promoterId: { type: Type.STRING }
                }
              }
            }
          }
        });

        const data = JSON.parse(response.text || '[]');
        
        // Mapear IDs si es posible o asignar el actual
        const mappedData = data.map((a: any) => ({
          ...a,
          id: 'import-' + Math.random().toString(36).substr(2, 9),
          location: currentLocation,
          // Si el admin está importando, intenta ver si el promoterId detectado existe, sino usa el actual
          promoterId: a.promoterId || (userRole === UserRole.ADMIN ? '' : promoterId)
        }));

        setExtractedData(mappedData);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error importando:", error);
      alert("Hubo un error procesando el archivo. Intente de nuevo.");
    } finally {
      setImportLoading(false);
    }
  };

  const confirmImport = () => {
    onProgramLoaded(extractedData);
    setIsImporting(false);
    setExtractedData([]);
    alert(`Se han importado ${extractedData.length} actividades exitosamente.`);
  };

  const submitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const finalPromoterId = formData.promoterId || promoterId;
    if (userRole === UserRole.ADMIN && finalPromoterId === 'ALL') {
      alert("Por favor selecciona un gestor de destino para esta actividad.");
      return;
    }
    const newActivity: Activity = {
      ...formData,
      id: 'plan-' + Date.now(),
      date: targetDate,
      promoterId: finalPromoterId,
      location: currentLocation,
      status: ActivityStatus.PENDING
    } as Activity;
    onAddActivity(newActivity);
    setIsRegistering(false);
    setFormData({ 
      time: '08:00', 
      community: '', 
      objective: '', 
      attendeeName: '', 
      attendeeRole: '', 
      attendeePhone: '', 
      type: ActivityType.COMMUNITY_VISIT, 
      status: ActivityStatus.PENDING,
      promoterId: (userRole === UserRole.ADMIN && promoterId === 'ALL') ? '' : promoterId
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-500"><i className="fa-solid fa-chevron-left"></i></button>
            <h2 className="px-6 text-lg font-black text-slate-800 uppercase tracking-tighter w-48 text-center flex items-center justify-center">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-500"><i className="fa-solid fa-chevron-right"></i></button>
          </div>
          
          <button 
            onClick={handleSync}
            className={`flex items-center gap-3 px-6 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${isSyncing ? 'bg-indigo-600 text-white' : 'bg-white text-indigo-600 border border-indigo-100 hover:bg-indigo-50'}`}
          >
            <i className={`fa-solid fa-sync ${isSyncing ? 'animate-spin' : ''}`}></i>
            {isSyncing ? 'Sincronizando...' : 'Actualizar Agenda'}
          </button>
        </div>

        <div className="flex gap-4 w-full lg:w-auto">
           <button 
             onClick={() => setIsImporting(true)}
             className="flex-1 bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl hover:bg-slate-800 active:scale-95 transition-all"
           >
             <i className="fa-solid fa-file-import"></i> Cargar / Importar desde PDF
           </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {['Dom', 'Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[160px]">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="border-r border-b border-slate-50 bg-slate-50/10"></div>;
            const dateActivities = getActivitiesForDate(day.date);
            const isToday = day.date === new Date().toISOString().split('T')[0];
            return (
              <div 
                key={day.date} 
                className="border-r border-b border-slate-100 p-2 md:p-3 hover:bg-slate-50/50 transition-all cursor-pointer group relative flex flex-col gap-1 overflow-hidden"
                onClick={() => handleOpenDay(day.date)}
              >
                <div className="flex justify-between items-start mb-1 pointer-events-none">
                  <span className={`text-xs md:text-base font-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full transition-colors ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                    {day.day}
                  </span>
                  <button 
                    onClick={(e) => openRegister(e, day.date)}
                    className="pointer-events-auto w-6 h-6 md:w-7 md:h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <i className="fa-solid fa-plus text-[10px]"></i>
                  </button>
                </div>
                <div className="space-y-1 pointer-events-none">
                  {dateActivities.slice(0, 3).map(act => {
                    const g = promoters.find(p => p.id === act.promoterId);
                    return (
                      <div
                        key={act.id}
                        className={`px-1.5 py-0.5 rounded text-[7px] md:text-[8px] font-black uppercase truncate border border-transparent ${
                          act.status === ActivityStatus.COMPLETED 
                          ? 'bg-emerald-50 text-emerald-700' 
                          : 'bg-indigo-50 text-indigo-700'
                        }`}
                      >
                        {userRole === UserRole.ADMIN && promoterId === 'ALL' && (
                          <span className="opacity-60 mr-1">[{g?.name.split(' ')[0].toUpperCase()}]</span>
                        )}
                        {act.time} {act.community}
                      </div>
                    )
                  })}
                  {dateActivities.length > 3 && (
                    <div className="text-[7px] md:text-[8px] font-bold text-slate-300 px-1">+{dateActivities.length - 3}</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {isImporting && (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-2xl font-black text-slate-800 tracking-tight">Carga Institucional de Agenda</h3>
                       <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">Sincronización mediante documento PDF o Imagen</p>
                    </div>
                    <button onClick={() => setIsImporting(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                       <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                 </div>

                 {extractedData.length === 0 ? (
                    <div className="space-y-8 py-10">
                       <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2.5rem] p-12 text-center group hover:border-indigo-300 transition-all cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                          <div className={`w-20 h-20 mx-auto rounded-3xl flex items-center justify-center text-3xl mb-6 transition-all ${importLoading ? 'bg-indigo-600 text-white animate-pulse' : 'bg-white text-indigo-600 shadow-lg group-hover:scale-110'}`}>
                             {importLoading ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-file-pdf"></i>}
                          </div>
                          <h4 className="font-black text-slate-800 text-lg">{importLoading ? 'Procesando Documento...' : 'Seleccionar PDF o Imagen'}</h4>
                          <p className="text-xs text-slate-400 mt-2 font-medium px-8">{importLoading ? 'Gemini está leyendo y estructurando los datos de la tabla...' : 'Sube la agenda que fue exportada previamente para restaurar los registros.'}</p>
                          <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileUpload} />
                       </div>
                    </div>
                 ) : (
                    <div className="space-y-6">
                       <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl flex items-center gap-4">
                          <i className="fa-solid fa-circle-check text-emerald-500 text-2xl"></i>
                          <div>
                             <p className="text-sm font-black text-emerald-800 uppercase tracking-tight">Detección Finalizada</p>
                             <p className="text-xs text-emerald-600 font-medium">Se han identificado {extractedData.length} actividades programadas.</p>
                          </div>
                       </div>
                       
                       <div className="space-y-3 max-h-60 overflow-y-auto pr-2 no-scrollbar">
                          {extractedData.map((act, i) => (
                             <div key={i} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center">
                                <div>
                                   <p className="text-[10px] font-black text-slate-800 uppercase">{act.date} | {act.time}</p>
                                   <p className="text-[9px] text-slate-400 font-bold">{act.community}</p>
                                </div>
                                <span className="text-[8px] font-black bg-white px-3 py-1 rounded-full border border-slate-100 uppercase">{act.type}</span>
                             </div>
                          ))}
                       </div>

                       <div className="flex gap-4 pt-4">
                          <button onClick={() => setExtractedData([])} className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-800 transition-colors">Volver a intentar</button>
                          <button onClick={confirmImport} className="flex-[2] bg-indigo-600 text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Confirmar e Importar</button>
                       </div>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Render Day View and Registration Modals as before... */}
      {isDayViewOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 md:p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Actividades Programadas</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2">{targetDate}</p>
                  </div>
                  <button onClick={() => setIsDayViewOpen(false)} className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </div>
                <div className="space-y-4">
                  {getActivitiesForDate(targetDate).length > 0 ? (
                    getActivitiesForDate(targetDate).map(act => {
                      const gestor = promoters.find(p => p.id === act.promoterId);
                      return (
                        <div key={act.id} className="bg-slate-50 border border-slate-100 p-5 md:p-6 rounded-3xl flex items-center gap-4 md:gap-6 group hover:border-indigo-100 hover:bg-white transition-all shadow-sm">
                          <div className="text-center min-w-[60px] md:min-w-[70px] border-r border-slate-200 pr-4 md:pr-6">
                            <p className="text-lg md:text-xl font-black text-slate-800 leading-none">{act.time}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Hora</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <img src={gestor?.photo} className="w-5 h-5 rounded-full object-cover border border-slate-200" />
                              <span className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{gestor?.name}</span>
                            </div>
                            <h4 className="text-sm md:text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{act.objective}</h4>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase mt-1">{act.community}</p>
                          </div>
                          <button onClick={() => { setSelectedActivity(act); setIsDayViewOpen(false); }} className="w-9 h-9 md:w-10 md:h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all shadow-sm">
                            <i className="fa-solid fa-eye"></i>
                          </button>
                        </div>
                      )
                    })
                  ) : (
                    <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                      <i className="fa-solid fa-calendar-xmark text-4xl text-slate-200 mb-4"></i>
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No hay actividades para este día</p>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => { setIsDayViewOpen(false); setIsRegistering(true); }}
                  className="w-full bg-indigo-600 text-white py-4 md:py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-plus"></i> Registrar Nueva Actividad
                </button>
              </div>
           </div>
        </div>
      )}

      {isRegistering && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-10 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Nueva Programación</h3>
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Día: {targetDate}</p>
                </div>
                <button onClick={() => setIsRegistering(false)} className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>
              <form onSubmit={submitRegistration} className="space-y-6">
                {userRole === UserRole.ADMIN && (
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-indigo-600 uppercase tracking-widest px-1">Gestor de Destino</label>
                      <select required className="agenda-input border-indigo-200 bg-indigo-50/30" value={formData.promoterId} onChange={e => setFormData({...formData, promoterId: e.target.value})}>
                         <option value="">-- Seleccionar Gestor --</option>
                         {promoters.filter(p => p.role === UserRole.FIELD_PROMOTER).map(p => (
                            <option key={p.id} value={p.id}>{p.name} ({p.zone || 'Global'})</option>
                         ))}
                      </select>
                   </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Hora Programada</label>
                    <input required type="time" className="agenda-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Categoría</label>
                    <select className="agenda-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                      {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Ubicación / Comunidad</label>
                  <input required className="agenda-input" placeholder="Ej: Calle Arce..." value={formData.community} onChange={setFormData as any} />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Objetivo General</label>
                  <textarea required rows={3} className="agenda-input resize-none" placeholder="¿Qué se espera lograr con esta labor?" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Nombre Contacto</label>
                      <input className="agenda-input" value={formData.attendeeName} onChange={e => setFormData({...formData, attendeeName: e.target.value})} placeholder="Ej: Maria Perez" />
                   </div>
                   <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Teléfono</label>
                      <input className="agenda-input" value={formData.attendeePhone} onChange={e => setFormData({...formData, attendeePhone: e.target.value})} placeholder="7777-2727" />
                   </div>
                </div>
                <div className="pt-4">
                  <button type="submit" className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Ingresar a Agenda Institucional</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {selectedActivity && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 md:p-10 space-y-8">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">{selectedActivity.type}</span>
                       <h3 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tighter mt-4">{selectedActivity.time}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedActivity.date}</p>
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                       <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                 </div>
                 <div className="p-6 md:p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2 tracking-widest">Objetivo</p>
                    <p className="text-base md:text-lg font-bold text-slate-800 italic leading-relaxed">"{selectedActivity.objective}"</p>
                 </div>
                 <button onClick={() => setSelectedActivity(null)} className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl">Cerrar Detalle</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .agenda-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          padding: 0.875rem 1.25rem;
          font-size: 0.85rem;
          color: #1e293b;
          font-weight: 700;
          outline: none;
          transition: all 0.3s;
        }
        .agenda-input:focus {
          border-color: #4f46e5;
          background: white;
          box-shadow: 0 10px 30px -5px rgba(79, 70, 229, 0.1);
        }
      `}</style>
    </div>
  );
};

export default ProgramModule;
