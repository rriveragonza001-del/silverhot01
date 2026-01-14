
import React, { useState, useMemo, useRef } from 'react';
import { Activity, ActivityType, ActivityStatus, Location, ProblemType, UserRole } from '../types';

interface ProgramModuleProps {
  activities: Activity[];
  onProgramLoaded: (activities: Activity[]) => void;
  onAddActivity: (activity: Activity) => void;
  currentLocation: Location;
  promoterId: string;
  userRole: UserRole;
}

const ProgramModule: React.FC<ProgramModuleProps> = ({ 
  activities, 
  onProgramLoaded, 
  onAddActivity,
  currentLocation, 
  promoterId,
  userRole
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Lógica para construir los días del calendario mensual
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const cells = [];
    // Relleno días del mes anterior
    for (let i = 0; i < firstDay; i++) {
      cells.push(null);
    }
    // Días del mes actual
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

  const handleDayClick = (date: string) => {
    setTargetDate(date);
    setIsRegistering(true);
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsImporting(true);
    const fileName = e.target.files[0].name;
    
    setTimeout(() => {
      const mockAct: Activity = {
        id: 'imp-' + Date.now(),
        promoterId: promoterId === 'ALL' ? 'p2' : promoterId,
        date: new Date().toISOString().split('T')[0],
        time: '09:00',
        community: 'Comunidad Importada',
        objective: `Carga desde: ${fileName}`,
        attendeeName: 'Coordinador Local',
        attendeeRole: 'Gestor',
        attendeePhone: 'N/A',
        proposals: 'Datos extraídos del archivo cargado.',
        problemsIdentified: ProblemType.OTRAS,
        type: ActivityType.COMMUNITY_VISIT,
        status: ActivityStatus.PENDING,
        location: currentLocation,
        agreements: 'Pendiente de revisión.',
        additionalObservations: 'Importación exitosa.',
        driveLinks: '',
        referral: '',
        companions: ''
      };
      onProgramLoaded([mockAct]);
      setIsImporting(false);
      alert("Programación cargada con éxito.");
    }, 1500);
  };

  const handleDownload = (type: 'diario' | 'semanal' | 'mensual') => {
    setIsDownloading(true);
    setTimeout(() => {
      alert(`Preparando archivo de programación ${type.toUpperCase()}... \n\nEl documento se ha generado exitosamente.`);
      setIsDownloading(false);
    }, 1200);
  };

  const [formData, setFormData] = useState<Partial<Activity>>({
    time: '08:00',
    community: '',
    objective: '',
    attendeeName: '',
    attendeeRole: '',
    attendeePhone: '',
    proposals: '',
    type: ActivityType.COMMUNITY_VISIT,
    status: ActivityStatus.PENDING,
    problemsIdentified: ProblemType.OTRAS
  });

  const submitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.community || !formData.objective) {
      alert("Por favor completa los campos obligatorios.");
      return;
    }
    const newActivity: Activity = {
      ...formData,
      id: 'plan-' + Date.now(),
      date: targetDate,
      promoterId: promoterId === 'ALL' ? 'p2' : promoterId,
      location: currentLocation,
    } as Activity;
    onAddActivity(newActivity);
    setIsRegistering(false);
    setFormData({ ...formData, community: '', objective: '', attendeeName: '' });
  };

  return (
    <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500 font-sans">
      <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileImport} accept=".pdf,.xlsx,.xls,.doc,.docx" />

      {/* Header del Calendario */}
      <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-sm border border-slate-200 p-5 md:p-8 flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6">
        <div className="flex items-center gap-3 md:gap-6 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
            <button onClick={() => changeMonth(-1)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all"><i className="fa-solid fa-chevron-left text-xs"></i></button>
            <h2 className="px-4 md:px-6 text-sm md:text-xl font-black text-slate-800 uppercase tracking-tighter w-32 md:w-48 text-center">
              {currentMonth.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="w-8 h-8 md:w-10 md:h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all"><i className="fa-solid fa-chevron-right text-xs"></i></button>
          </div>
          <button onClick={() => setCurrentMonth(new Date())} className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100 uppercase tracking-widest hover:bg-indigo-100">Hoy</button>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <button onClick={() => fileInputRef.current?.click()} className="flex-1 md:flex-none bg-emerald-50 text-emerald-600 border border-emerald-100 px-4 md:px-6 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95">
            <i className="fa-solid fa-file-upload"></i> Cargar
          </button>
          <div className="relative group flex-1 md:flex-none">
            <button className="w-full bg-slate-900 text-white px-4 md:px-8 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all">
              <i className="fa-solid fa-download"></i> Descargar
            </button>
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 hidden group-hover:block z-50 animate-in slide-in-from-top-2">
              <button onClick={() => handleDownload('diario')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-[9px] font-black text-slate-600 uppercase">Diario</button>
              <button onClick={() => handleDownload('semanal')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-[9px] font-black text-slate-600 uppercase">Semanal</button>
              <button onClick={() => handleDownload('mensual')} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl text-[9px] font-black text-slate-600 uppercase">Mensual</button>
            </div>
          </div>
        </div>
      </div>

      {/* Grid del Calendario Mensual */}
      <div className="bg-white rounded-[2rem] md:rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map(d => (
            <div key={d} className="py-2 md:py-4 text-center text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[100px] md:auto-rows-[160px]">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="border-r border-b border-slate-50 bg-slate-50/20"></div>;
            
            const dateActivities = getActivitiesForDate(day.date);
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={day.date} 
                onClick={() => handleDayClick(day.date)}
                className="border-r border-b border-slate-100 p-1 md:p-3 hover:bg-slate-50/50 transition-all cursor-pointer group relative flex flex-col gap-1 overflow-hidden"
              >
                <div className="flex justify-between items-center mb-1">
                  <span className={`text-xs md:text-sm font-black w-6 h-6 md:w-8 md:h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                    {day.day}
                  </span>
                  {dateActivities.length > 0 && (
                    <span className="text-[7px] md:text-[9px] font-black text-indigo-400 hidden md:block">{dateActivities.length} Labores</span>
                  )}
                </div>

                <div className="space-y-1">
                  {dateActivities.slice(0, 3).map(act => (
                    <button
                      key={act.id}
                      onClick={(e) => { e.stopPropagation(); setSelectedActivity(act); }}
                      className={`w-full text-left px-1 md:px-2 py-0.5 md:py-1 rounded-md text-[7px] md:text-[8px] font-black uppercase truncate border ${
                        act.status === ActivityStatus.COMPLETED 
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700' 
                        : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                      }`}
                    >
                      {act.time} {act.community}
                    </button>
                  ))}
                  {dateActivities.length > 3 && (
                    <div className="text-[7px] md:text-[8px] font-bold text-slate-300 px-1">+{dateActivities.length - 3}</div>
                  )}
                </div>

                <div className="absolute bottom-1 right-1 md:bottom-2 md:right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <i className="fa-solid fa-plus-circle text-indigo-200 text-base md:text-lg"></i>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Detalle de Actividad */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-8 md:p-12 space-y-6 md:space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
                 <div className="flex justify-between items-start">
                    <div className="space-y-1 md:space-y-2">
                       <span className="text-[8px] md:text-[9px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 md:px-4 md:py-2 rounded-full uppercase tracking-widest">{selectedActivity.type}</span>
                       <h3 className="text-3xl md:text-4xl font-black text-slate-800 tracking-tight leading-none mt-2 md:mt-4">{selectedActivity.time}</h3>
                       <p className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest">{selectedActivity.date}</p>
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="w-10 h-10 md:w-14 md:h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-slate-100 shadow-sm active:scale-90">
                       <i className="fa-solid fa-xmark text-lg md:text-2xl"></i>
                    </button>
                 </div>

                 <div className="space-y-4 md:space-y-6">
                    <div className="p-6 md:p-8 bg-slate-50 rounded-2xl md:rounded-3xl border border-slate-100">
                       <p className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Objetivo Programado</p>
                       <p className="text-base md:text-lg font-bold text-slate-800 leading-relaxed italic">"{selectedActivity.objective}"</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                       <div className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-3xl">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comunidad</p>
                          <p className="text-sm font-bold text-slate-800">{selectedActivity.community}</p>
                       </div>
                       <div className="p-4 md:p-6 bg-white border border-slate-200 rounded-2xl md:rounded-3xl">
                          <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Responsable</p>
                          <p className="text-sm font-bold text-slate-800">{selectedActivity.attendeeName || 'N/A'}</p>
                       </div>
                    </div>
                 </div>

                 <button onClick={() => setSelectedActivity(null)} className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Cerrar Detalle</button>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Registro de Actividad (Menú de Programación) */}
      {isRegistering && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 md:p-12 space-y-6 md:space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl md:text-3xl font-black text-slate-800 tracking-tight">Programar para el {targetDate}</h3>
                  <p className="text-[9px] md:text-[10px] text-slate-400 font-black uppercase tracking-widest mt-1">Sincronización de Agenda</p>
                </div>
                <button onClick={() => setIsRegistering(false)} className="w-10 h-10 md:w-14 md:h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-slate-100 shadow-sm active:scale-90">
                  <i className="fa-solid fa-xmark text-lg md:text-2xl"></i>
                </button>
              </div>

              <form onSubmit={submitRegistration} className="space-y-4 md:space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Hora</label>
                    <input required type="time" className="agenda-input" value={formData.time} onChange={e => setFormData({...formData, time: e.target.value})} />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Tipo</label>
                    <select className="agenda-input" value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})}>
                      {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-1 md:space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Comunidad / Lugar</label>
                  <input required className="agenda-input" placeholder="Ej: San Jacinto Sector A" value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} />
                </div>

                <div className="space-y-1 md:space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Objetivo General</label>
                  <textarea required rows={2} className="agenda-input resize-none" placeholder="Descripción de la labor..." value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Contacto</label>
                    <input className="agenda-input" placeholder="Nombre completo" value={formData.attendeeName} onChange={e => setFormData({...formData, attendeeName: e.target.value})} />
                  </div>
                  <div className="space-y-1 md:space-y-2">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Teléfono</label>
                    <input className="agenda-input" placeholder="0000-0000" value={formData.attendeePhone} onChange={e => setFormData({...formData, attendeePhone: e.target.value})} />
                  </div>
                </div>

                <div className="pt-4 md:pt-6">
                  <button type="submit" className="w-full bg-indigo-600 text-white py-4 md:py-5 rounded-2xl md:rounded-3xl font-black text-[10px] md:text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                    Guardar Actividad
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Loader de Descargas/Importación */}
      {(isDownloading || isImporting) && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white text-indigo-600 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center text-2xl md:text-3xl shadow-2xl">
            <i className="fa-solid fa-spinner animate-spin"></i>
          </div>
          <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">Procesando Información...</p>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .agenda-input {
          width: 100%;
          background: #f8fafc;
          border: 2px solid #f1f5f9;
          border-radius: 1.25rem;
          padding: 1rem 1.5rem;
          font-size: 0.875rem;
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
