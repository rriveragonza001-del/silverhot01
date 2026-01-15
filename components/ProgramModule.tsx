
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
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  
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
    e.stopPropagation();
    setTargetDate(date);
    setIsRegistering(true);
  };

  const handleSyncCalendar = () => {
    alert("Sincronizando su Agenda Institucional con Google Calendar movil...");
  };

  const handleExportProgram = (type: 'diario' | 'semanal' | 'mensual') => {
    setIsProcessing(true);
    setShowDownloadMenu(false);
    
    setTimeout(() => {
      let filtered = [...activities];
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];
      
      if (type === 'diario') {
        filtered = activities.filter(a => a.date === todayStr);
      } else if (type === 'semanal') {
        const weekStart = new Date();
        weekStart.setDate(today.getDate() - 7);
        filtered = activities.filter(a => new Date(a.date) >= weekStart);
      }

      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert("Por favor habilite las ventanas emergentes para descargar el documento.");
        setIsProcessing(false);
        return;
      }

      const title = `PROGRAMACIÓN ${type.toUpperCase()} - ${promoterId === 'ALL' ? 'EQUIPO COMPLETO' : 'GESTOR INDIVIDUAL'}`;
      
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>${title}</title>
            <style>
              body { font-family: 'Helvetica', sans-serif; padding: 40px; color: #1e293b; }
              .header { text-align: center; border-bottom: 4px solid #4f46e5; padding-bottom: 20px; margin-bottom: 30px; }
              .header h1 { font-size: 24px; margin: 0; color: #1e293b; }
              .meta { display: flex; justify-content: space-between; font-size: 12px; margin-top: 10px; color: #64748b; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; background: #fff; }
              th { background: #f8fafc; color: #475569; padding: 12px; text-align: left; border: 1px solid #e2e8f0; font-size: 11px; text-transform: uppercase; }
              td { padding: 12px; border: 1px solid #e2e8f0; font-size: 12px; }
              .status { font-weight: bold; color: #4f46e5; }
              .footer { margin-top: 50px; border-top: 1px solid #e2e8f0; padding-top: 20px; font-size: 10px; text-align: center; color: #94a3b8; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>${title}</h1>
              <div class="meta">
                <span>PromoterFlow Gestión Institucional</span>
                <span>Generado: ${new Date().toLocaleString()}</span>
              </div>
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
                ${filtered.length > 0 ? filtered.map(a => {
                  const gestor = promoters.find(p => p.id === a.promoterId)?.name || '---';
                  return `
                    <tr>
                      <td>${a.date}</td>
                      <td><b>${a.time}</b></td>
                      <td>${gestor}</td>
                      <td>${a.community}</td>
                      <td>${a.objective}</td>
                      <td class="status">${a.status}</td>
                    </tr>
                  `;
                }).join('') : '<tr><td colspan="6" style="text-align:center; padding: 40px;">No hay actividades programadas para este periodo.</td></tr>'}
              </tbody>
            </table>
            <div class="footer">Este documento es un reporte oficial del sistema PromoterFlow.</div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(() => { window.close(); }, 500);
              };
            </script>
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
    attendeeRole: '',
    attendeePhone: '',
    type: ActivityType.COMMUNITY_VISIT,
    status: ActivityStatus.PENDING,
  });

  const submitRegistration = (e: React.FormEvent) => {
    e.preventDefault();
    const pId = (userRole === UserRole.ADMIN && promoterId !== 'ALL') ? promoterId : (promoterId === 'ALL' ? promoters[0].id : promoterId);
    const newActivity: Activity = {
      ...formData,
      id: 'plan-' + Date.now(),
      date: targetDate,
      promoterId: pId,
      location: currentLocation,
    } as Activity;
    onAddActivity(newActivity);
    setIsRegistering(false);
    setFormData({ time: '08:00', community: '', objective: '', attendeeName: '', attendeeRole: '', attendeePhone: '', type: ActivityType.COMMUNITY_VISIT, status: ActivityStatus.PENDING });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* Header con Controles */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 p-6 flex flex-col lg:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200">
            <button onClick={() => changeMonth(-1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-500"><i className="fa-solid fa-chevron-left"></i></button>
            <h2 className="px-6 text-lg font-black text-slate-800 uppercase tracking-tighter w-48 text-center flex items-center justify-center">
              {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
            </h2>
            <button onClick={() => changeMonth(1)} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-xl transition-all text-slate-500"><i className="fa-solid fa-chevron-right"></i></button>
          </div>
          <button onClick={() => setCurrentMonth(new Date())} className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-5 py-2.5 rounded-xl border border-indigo-100 uppercase tracking-widest hover:bg-indigo-100 shadow-sm transition-all">Hoy</button>
          
          <button 
            onClick={handleSyncCalendar}
            className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-100 uppercase tracking-widest hover:bg-emerald-100 shadow-sm transition-all flex items-center gap-2"
          >
            <i className="fa-solid fa-rotate"></i> Sincronizar Google
          </button>
        </div>

        <div className="flex gap-3 w-full lg:w-auto relative">
          <button 
            onClick={() => setShowDownloadMenu(!showDownloadMenu)}
            className="w-full bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
          >
            <i className="fa-solid fa-file-pdf"></i> Descargar Plan / Agenda
            <i className={`fa-solid fa-chevron-${showDownloadMenu ? 'up' : 'down'} ml-2`}></i>
          </button>
          
          {showDownloadMenu && (
            <div className="absolute top-full right-0 mt-2 w-full lg:w-64 bg-white rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-100 p-2 z-[200] animate-in slide-in-from-top-2">
              <button onClick={() => handleExportProgram('diario')} className="w-full text-left p-4 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[11px] font-black text-slate-600 uppercase transition-all flex items-center gap-3 border-b border-slate-50">
                <i className="fa-solid fa-calendar-day"></i> Programación Diaria
              </button>
              <button onClick={() => handleExportProgram('semanal')} className="w-full text-left p-4 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[11px] font-black text-slate-600 uppercase transition-all flex items-center gap-3 border-b border-slate-50">
                <i className="fa-solid fa-calendar-week"></i> Programación Semanal
              </button>
              <button onClick={() => handleExportProgram('mensual')} className="w-full text-left p-4 hover:bg-indigo-50 hover:text-indigo-600 rounded-xl text-[11px] font-black text-slate-600 uppercase transition-all flex items-center gap-3">
                <i className="fa-solid fa-calendar"></i> Programación Mensual
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Grid del Calendario Mensual */}
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
                  
                  <button 
                    onClick={(e) => openRegister(e, day.date)}
                    className="w-7 h-7 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
                    title="Agregar actividad rápida"
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

      {/* Modal: Registro de Actividad (Mismos campos que Registro Principal) */}
      {isRegistering && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-3xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-10 space-y-8 max-h-[90vh] overflow-y-auto no-scrollbar">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-2xl font-black text-slate-800 tracking-tight">Nueva Programación</h3>
                  <p className="text-[10px] text-indigo-600 font-black uppercase tracking-widest mt-1">Día: {targetDate}</p>
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
                  <input required className="agenda-input" placeholder="Lugar de la visita..." value={formData.community} onChange={e => setFormData({...formData, community: e.target.value})} />
                </div>

                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-1">Objetivo General</label>
                  <textarea required rows={3} className="agenda-input resize-none" placeholder="¿Qué se espera lograr?" value={formData.objective} onChange={e => setFormData({...formData, objective: e.target.value})} />
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
                  <button type="submit" className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">
                    Confirmar Programación
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Detalle y Modales de Loader */}
      {isProcessing && (
        <div className="fixed inset-0 z-[2000] bg-slate-900/70 backdrop-blur-md flex flex-col items-center justify-center gap-4">
          <div className="w-20 h-20 bg-white text-indigo-600 rounded-[2rem] flex items-center justify-center text-3xl shadow-[0_0_50px_rgba(79,70,229,0.3)] animate-pulse">
            <i className="fa-solid fa-file-export"></i>
          </div>
          <p className="text-xs font-black text-white uppercase tracking-[0.3em]">Preparando Documento...</p>
        </div>
      )}

      <style>{`
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
