
import React, { useState, useMemo, useRef } from 'react';
import { Activity, ActivityType, ActivityStatus, Location, ProblemType } from '../types';

interface ProgramModuleProps {
  activities: Activity[];
  onProgramLoaded: (activities: Activity[]) => void;
  currentLocation: Location;
  promoterId: string;
}

const ProgramModule: React.FC<ProgramModuleProps> = ({ activities, onProgramLoaded, currentLocation, promoterId }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [viewMode, setViewMode] = useState<'calendar' | 'import'>('calendar');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingFileType, setPendingFileType] = useState<'excel' | 'pdf' | 'word' | null>(null);

  // Lógica de Calendario
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const days = new Date(year, month + 1, 0).getDate();
    
    const result = [];
    // Espacios en blanco para el inicio del mes
    for (let i = 0; i < firstDay; i++) result.push(null);
    // Días del mes
    for (let i = 1; i <= days; i++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
      result.push({ day: i, date: dateStr });
    }
    return result;
  }, [currentMonth]);

  const changeMonth = (offset: number) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  const dayActivities = useMemo(() => {
    return activities
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [activities, selectedDate]);

  // Simulación de importación de archivos reales
  const triggerFileSelect = (type: 'excel' | 'pdf' | 'word') => {
    setPendingFileType(type);
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    setIsImporting(true);
    const fileName = e.target.files[0].name;
    
    setTimeout(() => {
      const today = new Date();
      const mockProgram: Activity[] = [
        {
          id: `file-${Date.now()}`,
          promoterId: promoterId,
          date: selectedDate,
          time: '10:00',
          community: 'Importado desde Archivo',
          objective: `Actividad extraída de: ${fileName}`,
          attendeeName: 'Contacto del Documento',
          attendeeRole: 'N/A',
          attendeePhone: 'N/A',
          proposals: 'Procesado por el lector de documentos.',
          problemsIdentified: ProblemType.OTRAS,
          type: ActivityType.COMMUNITY_VISIT,
          agreements: 'Revisión pendiente.',
          additionalObservations: `Origen: ${pendingFileType?.toUpperCase()}`,
          driveLinks: '',
          referral: '',
          companions: '',
          status: ActivityStatus.PENDING,
          location: currentLocation
        }
      ];
      onProgramLoaded(mockProgram);
      setIsImporting(false);
      setViewMode('calendar');
      alert("Archivo procesado y actividades añadidas a la agenda.");
    }, 1500);
  };

  const handleGoogleSheetImport = () => {
    if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
      alert("Por favor ingresa una URL válida de Google Sheets");
      return;
    }
    setIsImporting(true);
    setTimeout(() => {
      const today = new Date();
      const mockActivities: Activity[] = [
        {
          id: `sheet-${Date.now()}`,
          promoterId: promoterId,
          date: today.toISOString().split('T')[0],
          time: '08:00',
          community: 'Colonia Flor Blanca',
          objective: 'Inspección técnica importada de Sheet',
          attendeeName: 'Ing. Roberto Alas',
          attendeeRole: 'Supervisor',
          attendeePhone: '7766-5544',
          proposals: 'Evaluar puntos críticos.',
          problemsIdentified: ProblemType.OTRAS,
          type: ActivityType.WORK_FOLLOWUP,
          agreements: 'Cronograma listo.',
          additionalObservations: 'Google Sheet Sync',
          driveLinks: '',
          referral: '',
          companions: '',
          status: ActivityStatus.PENDING,
          location: currentLocation
        }
      ];
      onProgramLoaded(mockActivities);
      setIsImporting(false);
      setSheetUrl('');
      setViewMode('calendar');
    }, 1500);
  };

  return (
    <div className="space-y-6 font-sans animate-in fade-in duration-500">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        onChange={handleFileChange}
        accept={pendingFileType === 'excel' ? '.xlsx,.xls' : pendingFileType === 'pdf' ? '.pdf' : '.doc,.docx'} 
      />

      {/* Header & Tabs */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
            <i className="fa-solid fa-calendar-day text-indigo-600"></i>
            Gestión de Agenda
          </h2>
          <p className="text-sm text-slate-400 font-medium">Visualiza y carga tu programación de actividades</p>
        </div>
        <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto shadow-inner">
          <button 
            onClick={() => setViewMode('calendar')}
            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'calendar' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Calendario
          </button>
          <button 
            onClick={() => setViewMode('import')}
            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'import' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Importar
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Calendario Estilo Google */}
          <div className="lg:col-span-8 bg-white rounded-[3rem] shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-4">
                <button onClick={() => changeMonth(-1)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors border border-transparent hover:border-slate-200">
                  <i className="fa-solid fa-chevron-left"></i>
                </button>
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                  {currentMonth.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                </h3>
                <button onClick={() => changeMonth(1)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-slate-400 transition-colors border border-transparent hover:border-slate-200">
                  <i className="fa-solid fa-chevron-right"></i>
                </button>
              </div>
              <button onClick={() => { setCurrentMonth(new Date()); setSelectedDate(new Date().toISOString().split('T')[0]); }} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline">Ir a Hoy</button>
            </div>
            
            <div className="p-4 grid grid-cols-7 gap-1">
              {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(d => (
                <div key={d} className="text-center py-4 text-[10px] font-black text-slate-300 uppercase tracking-widest">{d}</div>
              ))}
              {daysInMonth.map((dayObj, idx) => {
                if (!dayObj) return <div key={`empty-${idx}`} className="h-28"></div>;
                const isSelected = selectedDate === dayObj.date;
                const isToday = dayObj.date === new Date().toISOString().split('T')[0];
                const dayActs = activities.filter(a => a.date === dayObj.date);

                return (
                  <button
                    key={dayObj.date}
                    onClick={() => setSelectedDate(dayObj.date)}
                    className={`h-28 border rounded-2xl p-2 flex flex-col gap-1 transition-all group relative ${
                      isSelected ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-50 hover:border-slate-200'
                    }`}
                  >
                    <span className={`text-sm font-black w-7 h-7 flex items-center justify-center rounded-full transition-colors ${
                      isToday ? 'bg-indigo-600 text-white' : isSelected ? 'text-indigo-600' : 'text-slate-400'
                    }`}>
                      {dayObj.day}
                    </span>
                    
                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {dayActs.slice(0, 3).map(act => (
                        <div key={act.id} className="text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md bg-indigo-100 text-indigo-700 truncate">
                          {act.time} {act.community}
                        </div>
                      ))}
                      {dayActs.length > 3 && (
                        <div className="text-[8px] font-black text-slate-400 px-1 mt-0.5">+{dayActs.length - 3} más</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Agenda Detallada Lateral */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-slate-900 text-white p-8 rounded-[3rem] shadow-xl">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50 mb-2">Actividades para el</h4>
               <p className="text-xl font-black">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
              {dayActivities.length > 0 ? (
                dayActivities.map(act => (
                  <button 
                    key={act.id} 
                    onClick={() => setSelectedActivity(act)}
                    className="w-full bg-white p-6 rounded-[2rem] border-2 border-slate-50 hover:border-indigo-100 shadow-sm transition-all text-left flex gap-4 group"
                  >
                    <div className="flex flex-col items-center justify-center border-r border-slate-100 pr-4">
                      <p className="text-xl font-black text-slate-800 tracking-tighter">{act.time}</p>
                      <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mt-2"></span>
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 truncate">{act.community}</p>
                      <h5 className="text-sm font-black text-slate-800 leading-tight group-hover:text-indigo-600 transition-colors">{act.objective}</h5>
                    </div>
                  </button>
                ))
              ) : (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] p-12 text-center">
                  <i className="fa-solid fa-calendar-xmark text-3xl text-slate-200 mb-4"></i>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sin programación</p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* VISTA DE IMPORTACIÓN REPOTENCIADA */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-200 space-y-8">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl">
                <i className="fa-solid fa-link"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Sincronizar Cloud</h3>
                <p className="text-xs text-slate-400 font-medium">Conecta hojas de cálculo externas</p>
              </div>
            </div>

            <div className="space-y-4">
              <input 
                type="text" 
                placeholder="URL de Google Sheets..." 
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-emerald-500 transition-all font-bold text-sm"
                value={sheetUrl}
                onChange={e => setSheetUrl(e.target.value)}
              />
              <button 
                onClick={handleGoogleSheetImport}
                disabled={isImporting || !sheetUrl}
                className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-100 active:scale-95 transition-all flex items-center justify-center gap-3"
              >
                {isImporting ? <i className="fa-solid fa-spinner animate-spin"></i> : <i className="fa-solid fa-sync"></i>}
                Sincronizar Ahora
              </button>
            </div>
          </div>

          <div className="bg-white rounded-[3rem] p-12 shadow-sm border border-slate-200 space-y-8">
             <div className="flex items-center gap-5">
              <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center text-2xl">
                <i className="fa-solid fa-file-arrow-up"></i>
              </div>
              <div>
                <h3 className="text-xl font-black text-slate-800">Cargar Documentos</h3>
                <p className="text-xs text-slate-400 font-medium">Extraer agenda de archivos locales</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button onClick={() => triggerFileSelect('excel')} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-emerald-500 hover:bg-emerald-50 transition-all gap-3 group">
                <i className="fa-solid fa-file-excel text-2xl text-slate-400 group-hover:text-emerald-600"></i>
                <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-emerald-700">Excel</span>
              </button>
              <button onClick={() => triggerFileSelect('pdf')} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-red-500 hover:bg-red-50 transition-all gap-3 group">
                <i className="fa-solid fa-file-pdf text-2xl text-slate-400 group-hover:text-red-600"></i>
                <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-red-700">PDF</span>
              </button>
              <button onClick={() => triggerFileSelect('word')} className="flex flex-col items-center justify-center p-6 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50 transition-all gap-3 group">
                <i className="fa-solid fa-file-word text-2xl text-slate-400 group-hover:text-blue-600"></i>
                <span className="text-[8px] font-black uppercase text-slate-400 group-hover:text-blue-700">Word</span>
              </button>
            </div>
            
            <p className="text-[10px] text-center text-slate-400 italic">Selecciona un formato para abrir el explorador de archivos.</p>
          </div>
        </div>
      )}

      {/* Modal de Detalle de Actividad */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-12 space-y-8">
                 <div className="flex justify-between items-start">
                    <div>
                       <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">{selectedActivity.type}</span>
                       <h3 className="text-4xl font-black text-slate-800 tracking-tight mt-6">{selectedActivity.time}</h3>
                       <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-widest">{selectedActivity.community}</p>
                    </div>
                    <button onClick={() => setSelectedActivity(null)} className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:text-red-500 border border-slate-100 transition-all">
                       <i className="fa-solid fa-xmark text-2xl"></i>
                    </button>
                 </div>

                 <div className="space-y-6">
                    <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Objetivo</p>
                       <p className="text-lg font-bold text-slate-800 leading-relaxed italic">"{selectedActivity.objective}"</p>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                       <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Responsable</p>
                          <p className="text-sm font-bold text-slate-700">{selectedActivity.attendeeName}</p>
                       </div>
                       <div className="p-6 bg-white border border-slate-100 rounded-3xl">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest mb-1">Estado</p>
                          <p className={`text-sm font-black uppercase ${selectedActivity.status === ActivityStatus.COMPLETED ? 'text-emerald-500' : 'text-amber-500'}`}>{selectedActivity.status}</p>
                       </div>
                    </div>
                 </div>

                 <button onClick={() => setSelectedActivity(null)} className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-widest shadow-2xl active:scale-95 transition-all">Cerrar Detalle</button>
              </div>
           </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default ProgramModule;
