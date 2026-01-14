
import React, { useState, useMemo } from 'react';
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
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'agenda' | 'import'>('agenda');
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  const dayActivities = useMemo(() => {
    return activities
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [activities, selectedDate]);

  const dateRange = useMemo(() => {
    const dates = [];
    for (let i = -3; i < 11; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      dates.push({
        full: d.toISOString().split('T')[0],
        day: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''),
        num: d.getDate()
      });
    }
    return dates;
  }, []);

  const simulateFileImport = (type: 'excel' | 'pdf' | 'word') => {
    setIsImporting(true);
    setTimeout(() => {
      const today = new Date();
      const mockProgram: Activity[] = [
        {
          id: `p-${Date.now()}-f1`,
          promoterId: promoterId,
          date: today.toISOString().split('T')[0],
          time: '14:00',
          community: 'Comunidad La Esperanza',
          objective: `Carga vía ${type.toUpperCase()}: Levantamiento Social`,
          attendeeName: 'Comité Local',
          attendeeRole: 'Varios',
          attendeePhone: 'N/A',
          proposals: 'Evaluar daños por lluvias recientes.',
          problemsIdentified: ProblemType.OTRAS,
          type: ActivityType.COMMUNITY_VISIT,
          agreements: 'Se entregará informe técnico el viernes.',
          additionalObservations: `Documento procesado: agenda_${type}.bin`,
          driveLinks: '',
          referral: 'Protección Civil',
          companions: 'Personal de Apoyo',
          status: ActivityStatus.PENDING,
          location: currentLocation
        }
      ];
      onProgramLoaded(mockProgram);
      setIsImporting(false);
      setViewMode('agenda');
      alert(`Programación desde ${type.toUpperCase()} cargada exitosamente.`);
    }, 2000);
  };

  const simulateGoogleSheetImport = () => {
    if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
      alert("Por favor ingresa una URL válida de Google Sheets");
      return;
    }
    
    setIsImporting(true);
    setTimeout(() => {
      const today = new Date();
      const mockProgram: Activity[] = [
        {
          id: `p-${Date.now()}-1`,
          promoterId: promoterId, // FIXED: Usar ID real del promotor
          date: today.toISOString().split('T')[0],
          time: '08:00',
          community: 'Colonia Flor Blanca',
          objective: 'Carga Masiva: Inspección de Drenajes',
          attendeeName: 'Ing. Roberto Alas',
          attendeeRole: 'Coordinador Técnico',
          attendeePhone: '77665544',
          proposals: 'Evaluar puntos de obstrucción detectados en reporte anterior.',
          problemsIdentified: ProblemType.OTRAS,
          type: ActivityType.WORK_FOLLOWUP,
          agreements: 'Se definirá calendario de limpiezas.',
          additionalObservations: 'Importado desde Google Sheets',
          driveLinks: '',
          referral: 'Unidad Técnica',
          companions: 'Janira A., Pedro G.',
          status: ActivityStatus.PENDING,
          location: currentLocation
        }
      ];
      onProgramLoaded(mockProgram);
      setIsImporting(false);
      setSheetUrl('');
      setViewMode('agenda');
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* Tab Selector */}
      <div className="flex bg-slate-200/50 p-1.5 rounded-[1.5rem] w-full max-w-sm mx-auto shadow-inner border border-slate-100">
        <button 
          onClick={() => setViewMode('agenda')}
          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'agenda' ? 'bg-white text-indigo-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <i className="fa-solid fa-calendar-check mr-2"></i> Mi Agenda
        </button>
        <button 
          onClick={() => setViewMode('import')}
          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'import' ? 'bg-white text-emerald-600 shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <i className="fa-solid fa-file-import mr-2"></i> Cargar
        </button>
      </div>

      {viewMode === 'agenda' ? (
        <div className="space-y-8">
          {/* Calendar Carousel */}
          <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden relative">
            <div className="flex overflow-x-auto no-scrollbar gap-5 pb-2 scroll-smooth">
              {dateRange.map((date) => (
                <button
                  key={date.full}
                  onClick={() => setSelectedDate(date.full)}
                  className={`flex-shrink-0 w-20 h-28 rounded-3xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    selectedDate === date.full
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-lg scale-110 z-10'
                    : 'border-slate-50 bg-slate-50 text-slate-300 hover:border-slate-200 hover:text-slate-500'
                  }`}
                >
                  <span className="text-[9px] font-black uppercase tracking-widest">{date.day}</span>
                  <span className="text-2xl font-black leading-none">{date.num}</span>
                  {activities.some(a => a.date === date.full) && (
                    <div className="w-2 h-2 bg-indigo-600 rounded-full animate-pulse"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Activities List */}
          <div className="space-y-6">
            <div className="flex justify-between items-end px-4">
              <div>
                <h3 className="text-2xl font-black text-slate-800 tracking-tight">Actividades Programadas</h3>
                <p className="text-xs text-slate-400 font-black uppercase tracking-widest mt-1">
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-xl uppercase tracking-widest border border-indigo-100">
                  {dayActivities.length} LABORES
                </span>
              </div>
            </div>

            {dayActivities.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {dayActivities.map(activity => (
                  <div 
                    key={activity.id} 
                    onClick={() => setSelectedActivity(activity)}
                    className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-10 flex flex-col md:flex-row gap-10 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer group"
                  >
                    <div className="md:w-32 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-8 md:pb-0 md:pr-10">
                      <p className="text-4xl font-black text-slate-800 tracking-tighter group-hover:text-indigo-600 transition-colors">{activity.time}</p>
                      <span className="text-[8px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-full mt-3 text-center border border-indigo-100">
                        {activity.type}
                      </span>
                    </div>

                    <div className="flex-1 space-y-5">
                      <div className="flex items-center gap-3">
                        <i className="fa-solid fa-location-dot text-red-500 text-lg"></i>
                        <span className="text-xs font-black uppercase text-slate-400 tracking-[0.2em]">{activity.community}</span>
                      </div>
                      <h4 className="text-3xl font-black text-slate-800 leading-tight tracking-tight">{activity.objective}</h4>
                      
                      <div className="flex flex-wrap gap-10 pt-4">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Responsable Local</p>
                          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
                            <i className="fa-solid fa-user-circle text-indigo-300"></i>
                            {activity.attendeeName}
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">Estado</p>
                          <p className={`text-xs font-black uppercase ${activity.status === ActivityStatus.COMPLETED ? 'text-emerald-500' : 'text-amber-500'}`}>
                            {activity.status}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[3rem] border-4 border-dashed border-slate-100 p-24 text-center space-y-6">
                <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto text-4xl shadow-inner">
                  <i className="fa-solid fa-calendar-xmark"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-2xl tracking-tight">Día libre de programación</h4>
                  <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto mt-2">No tienes actividades asignadas para esta fecha. ¡Buen trabajo!</p>
                </div>
                <button onClick={() => setViewMode('import')} className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-8 py-3 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all">Importar Nueva Carga</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* IMPORT VIEW */
        <div className="space-y-8">
          <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-12 space-y-12">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner">
                <i className="fa-solid fa-cloud-arrow-up"></i>
              </div>
              <div>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">Cargar Programación</h2>
                <p className="text-sm text-slate-400 font-medium">Sincroniza tu agenda desde diversas fuentes externas</p>
              </div>
            </div>

            {/* Google Sheets Section */}
            <div className="space-y-4">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Sincronizar Google Sheets</label>
              <div className="flex flex-col md:flex-row gap-4">
                <input 
                  type="text" 
                  placeholder="Pega el enlace de tu hoja de cálculo..."
                  className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-sm focus:border-emerald-500 outline-none transition-all font-bold"
                  value={sheetUrl}
                  onChange={(e) => setSheetUrl(e.target.value)}
                />
                <button 
                  onClick={simulateGoogleSheetImport}
                  disabled={isImporting || !sheetUrl}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-12 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all shadow-xl shadow-emerald-100"
                >
                  {isImporting ? <i className="fa-solid fa-circle-notch animate-spin text-lg"></i> : 'IMPORTAR'}
                </button>
              </div>
            </div>

            {/* File Format Section */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
               <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1 block">O cargar archivo institucional</label>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <button onClick={() => simulateFileImport('excel')} className="file-btn text-emerald-600 bg-emerald-50 border-emerald-100 hover:bg-emerald-100">
                    <i className="fa-solid fa-file-excel text-3xl mb-3"></i>
                    <span>Excel (.xlsx)</span>
                  </button>
                  <button onClick={() => simulateFileImport('word')} className="file-btn text-blue-600 bg-blue-50 border-blue-100 hover:bg-blue-100">
                    <i className="fa-solid fa-file-word text-3xl mb-3"></i>
                    <span>Word (.docx)</span>
                  </button>
                  <button onClick={() => simulateFileImport('pdf')} className="file-btn text-red-600 bg-red-50 border-red-100 hover:bg-red-100">
                    <i className="fa-solid fa-file-pdf text-3xl mb-3"></i>
                    <span>PDF (.pdf)</span>
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Activity Detail Modal */}
      {selectedActivity && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/80 backdrop-blur-md">
          <div className="bg-white rounded-[4rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-300">
             <div className="p-12 space-y-8">
                <div className="flex justify-between items-start">
                   <div className="space-y-2">
                      <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full uppercase tracking-widest">{selectedActivity.type}</span>
                      <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-none mt-4">{selectedActivity.time}</h3>
                   </div>
                   <button onClick={() => setSelectedActivity(null)} className="w-14 h-14 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 hover:text-red-500 transition-all border border-slate-100">
                      <i className="fa-solid fa-xmark text-2xl"></i>
                   </button>
                </div>

                <div className="space-y-6">
                   <div className="p-8 bg-slate-50 rounded-3xl border border-slate-100">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Objetivo Programado</p>
                      <p className="text-lg font-bold text-slate-800 leading-relaxed">{selectedActivity.objective}</p>
                   </div>

                   <div className="grid grid-cols-2 gap-6">
                      <div className="p-6 bg-white border border-slate-200 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Comunidad</p>
                        <p className="text-sm font-bold text-slate-800">{selectedActivity.community}</p>
                      </div>
                      <div className="p-6 bg-white border border-slate-200 rounded-3xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Contacto</p>
                        <p className="text-sm font-bold text-slate-800">{selectedActivity.attendeeName}</p>
                      </div>
                   </div>

                   {selectedActivity.assignedBy && (
                     <div className="flex items-center gap-3 px-2">
                        <i className="fa-solid fa-shield-check text-indigo-600"></i>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Actividad Asignada por Administración</p>
                     </div>
                   )}
                </div>

                <button 
                  onClick={() => setSelectedActivity(null)}
                  className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl hover:bg-black transition-all"
                >
                  Cerrar Detalle
                </button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .file-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 2rem;
          border-radius: 2.5rem;
          border-width: 2px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          font-size: 0.75rem;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.15em;
        }
        .file-btn:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px -10px currentColor;
        }
      `}</style>
    </div>
  );
};

export default ProgramModule;
