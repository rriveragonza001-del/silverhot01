
import React, { useState, useMemo, useRef } from 'react';
import { Activity, ActivityType, ActivityStatus, Location, ProblemType, UserRole, Promoter } from '../types';

interface ProgramModuleProps {
  activities: Activity[];
  promoters: Promoter[];
  onProgramLoaded: (activities: Activity[]) => void;
  onAddActivity: (activity: Activity) => void;
  currentLocation: Location;
  promoterId: string;
  userRole: UserRole;
}

const ProgramModule: React.FC<ProgramModuleProps> = ({ 
  activities, 
  promoters,
  onProgramLoaded, 
  onAddActivity,
  currentLocation, 
  promoterId,
  userRole
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDayViewOpen, setIsDayViewOpen] = useState(false);
  const [targetDate, setTargetDate] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  const openDayView = (date: string) => {
    setTargetDate(date);
    setIsDayViewOpen(true);
  };

  const openRegister = (e: React.MouseEvent, date: string) => {
    e.stopPropagation(); // Evitar que se abra la vista de día
    setTargetDate(date);
    setIsRegistering(true);
  };

  // Función mejorada para exportar programación a PDF/Impresión
  const handleExportProgram = (type: 'diario' | 'semanal' | 'mensual') => {
    setIsProcessing(true);
    
    setTimeout(() => {
      let filteredActivities = [...activities];
      const todayStr = new Date().toISOString().split('T')[0];
      
      if (type === 'diario') {
        filteredActivities = activities.filter(a => a.date === todayStr);
      } else if (type === 'semanal') {
        // Filtro simplificado de 7 días
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        filteredActivities = activities.filter(a => new Date(a.date) >= weekAgo);
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) return;

      const title = `Programación ${type.charAt(0).toUpperCase() + type.slice(1)} de Actividades`;
      
      printWindow.document.write(`
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 30px; color: #334155; }
              .header { text-align: center; border-bottom: 3px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { color: #1e293b; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
              th { background: #f1f5f9; color: #475569; padding: 12px; text-align: left; border: 1px solid #e2e8f0; text-transform: uppercase; }
              td { padding: 12px; border: 1px solid #e2e8f0; }
              .footer { margin-top: 40px; text-align: right; font-size: 10px; color: #94a3b8; }
              .badge { padding: 4px 8px; rounded: 4px; font-weight: bold; font-size: 10px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <p>PromoterFlow - Sistema de Gestión Institucional</p>
              <p>Generado el: ${new Date().toLocaleString()}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Hora</th>
                  <th>Gestor</th>
                  <th>Comunidad</th>
                  <th>Objetivo</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${filteredActivities.map(a => {
                  const gestor = promoters.find(p => p.id === a.promoterId)?.name || 'N/A';
                  return `
                    <tr>
                      <td>${a.date}</td>
                      <td><b>${a.time}</b></td>
                      <td>${gestor}</td>
                      <td>${a.community}</td>
                      <td>${a.objective}</td>
                      <td>${a.status}</td>
                    </tr>
                  `;
                }).join('')}
              </tbody>
            </table>
            <div class="footer">Este documento es una programación oficial generada por el sistema.</div>
            <script>window.onload = function() { window.print(); setTimeout(() => { window.close(); }, 500); };</script>
          </body>
        </html>
      `);
      printWindow.document.close();
      setIsProcessing(false);
    }, 1000);
  };

  const [formData, setFormData] = useState<Partial<Activity>>({
    time: '08:00',
    community: '',
    objective: '',
    attendeeName: '',
    type: ActivityType.COMMUNITY_VISIT,
    status: ActivityStatus.PENDING,
  });

  const submitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
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
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,.xlsx,.xls" />

      {/* Header con Controles de Navegación y Descarga */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 shadow-inner">
            <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-500"><i className="fa-solid fa-chevron-left"></i></button>
            <h2 className="px-6 text-lg font-black text-slate-800 uppercase tracking-tighter w-48 text-center flex items-center justify-center">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-500"><i className="fa-solid fa-chevron-right"></i></button>
          </div>
          <button onClick={() => setCurrentMonth(new Date())} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 uppercase tracking-widest hover:bg-indigo-100 shadow-sm active:scale-95 transition-all">Hoy</button>
        </div>

        <div className="flex gap-3 w-full lg:w-auto">
          <div className="relative group flex-1 lg:flex-none">
            <button className="w-full bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
              <i className="fa-solid fa-file-pdf"></i> Descargar Programación
            </button>
            <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2 hidden group-hover:block z-[100] animate-in slide-in-from-top-2">
              <button onClick={() => handleExportProgram('diario')} className="w-full text-left p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[10px] font-black text-slate-600 uppercase transition-colors">Programación Diaria</button>
              <button onClick={() => handleExportProgram('semanal')} className="w-full text-left p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[10px] font-black text-slate-600 uppercase transition-colors">Programación Semanal</button>
              <button onClick={() => handleExportProgram('mensual')} className="w-full text-left p-3.5 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[10px] font-black text-slate-600 uppercase transition-colors">Programación Mensual</button>
            </div>
          </div>
        </div>
      </div>

      {/* Calendario Mensual */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50">
          {['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map(d => (
            <div key={d} className="py-4 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[120px] md:auto-rows-[160px]">
          {calendarDays.map((day, idx) => {
            if (!day) return <div key={`empty-${idx}`} className="border-r border-b border-slate-50 bg-slate-50/10"></div>;
            
            const dateActivities = getActivitiesForDate(day.date);
            const isToday = day.date === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={day.date} 
                onClick={() => openDayView(day.date)}
                className="border-r border-b border-slate-100 p-2 md:p-3 hover:bg-slate-50/50 transition-all cursor-pointer group relative flex flex-col gap-1 overflow-hidden"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className={`text-sm md:text-base font-black w-8 h-8 flex items-center justify-center rounded-full ${isToday ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 group-hover:text-indigo-600'}`}>
                    {day.day}
                  </span>
                  
                  {/* Botón "+" específico para agregar actividad */}
                  <button 
                    onClick={(e) => openRegister(e, day.date)}
                    className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                  >
                    <i className="fa-solid fa-plus text-xs"></i>
                  </button>
                </div>

                <div className="space-y-1">
                  {dateActivities.slice(0, 3).map(act => (
                    <div
                      key={act.id}
                      className={`px-2 py-1 rounded-md text-[8px] font-black uppercase truncate border border-transparent ${
                        act.status === ActivityStatus.COMPLETED 
                        ? 'bg-emerald-50 text-emerald-700' 
                        : 'bg-indigo-50 text-indigo-700'
                      }`}
                    >
                      {act.time} {act.community}
                    </div>
                  ))}
                  {dateActivities.length > 3 && (
                    <div className="text-[8px] font-bold text-slate-300 px-1">+{dateActivities.length - 3} más</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Vista de Actividades del Día */}
      {isDayViewOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-3xl font-black text-slate-800 tracking-tight">Actividades Programadas</h3>
                    <p className="text-xs font-black text-indigo-600 uppercase tracking-widest mt-2">{targetDate}</p>
                  </div>
                  <button onClick={() => setIsDayViewOpen(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                    <i className="fa-solid fa-xmark text-xl"></i>
                  </button>
                </div>

                <div className="space-y-4">
                  {getActivitiesForDate(targetDate).length > 0 ? (
                    getActivitiesForDate(targetDate).map(act => {
                      const gestor = promoters.find(p => p.id === act.promoterId);
                      return (
                        <div key={act.id} className="bg-slate-50 border border-slate-100 p-6 rounded-3xl flex items-center gap-6 group hover:border-indigo-100 hover:bg-white transition-all">
                          <div className="text-center min-w-[60px] border-r border-slate-200 pr-6">
                            <p className="text-xl font-black text-slate-800 leading-none">{act.time}</p>
                            <p className="text-[8px] font-black text-slate-400 uppercase mt-1">Hora</p>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <img src={gestor?.photo} className="w-4 h-4 rounded-full" />
                              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{gestor?.name}</span>
                            </div>
                            <h4 className="text-base font-black text-slate-800 group-hover:text-indigo-600 transition-colors leading-tight">{act.objective}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{act.community}</p>
                          </div>
                          <button onClick={() => setSelectedActivity(act)} className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 hover:text-indigo-600 transition-all">
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
                  className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                  <i className="fa-solid fa-plus"></i> Registrar Nueva Actividad
                </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal: Registro de Actividad */}
      {isRegistering && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Programación</h3>
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Día asignado: {targetDate}</p>
                </div>
                <button onClick={() => setIsRegistering(false)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 shadow-sm border border-slate-100 transition-all">
                  <i className="fa-solid fa-xmark text-xl"></i>
                </button>
              </div>

              <form onSubmit={submitRegistration} className="space-y-6">
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
                  <input required className="agenda-input" placeholder="Nombre de la comunidad o lugar..." value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Objetivo de la Labor</label>
                  <textarea required rows={3} className="agenda-input resize-none" placeholder="Descripción detallada de la meta..." value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} />
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                    Guardar en Agenda Institucional
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detalle Individual de Actividad */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-6 bg-slate-900/90 backdrop-blur-md">
           <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-10 space-y-8">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-[8px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">{selectedActivity.type}</span>
                       <h3 className="text-4xl font-black text-slate-800 tracking-tighter mt-4">{selectedActivity.time}</h3>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{selectedActivity.date}</p>
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-slate-100">
                       <i className="fa-solid fa-xmark text-xl"></i>
                    </button>
                 </div>
                 <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Objetivo</p>
                    <p className="text-lg font-bold text-slate-800 italic leading-relaxed">"{selectedActivity.objective}"</p>
                 </div>
                 <button onClick={() => setSelectedActivity(null)} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest">Entendido</button>
              </div>
           </div>
        </div>
      )}

      {/* Loader Global */}
      {isProcessing && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 bg-white text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-2xl animate-bounce">
            <i className="fa-solid fa-file-export"></i>
          </div>
          <p className="text-xs font-black text-white uppercase tracking-[0.3em] animate-pulse">Generando Documento Institucional...</p>
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
          font-size: 0.9rem;
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
