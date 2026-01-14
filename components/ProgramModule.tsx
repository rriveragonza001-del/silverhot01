
import React, { useState, useMemo } from 'react';
import { Activity, ActivityType, ActivityStatus, Location, ProblemType } from '../types';

interface ProgramModuleProps {
  activities: Activity[];
  onProgramLoaded: (activities: Activity[]) => void;
  currentLocation: Location;
}

const ProgramModule: React.FC<ProgramModuleProps> = ({ activities, onProgramLoaded, currentLocation }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'agenda' | 'import'>('agenda');

  // Filtrar actividades por fecha seleccionada
  const dayActivities = useMemo(() => {
    return activities
      .filter(a => a.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [activities, selectedDate]);

  // Generar los próximos 14 días para el selector de fecha superior
  const dateRange = useMemo(() => {
    const dates = [];
    for (let i = -2; i < 12; i++) {
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
          promoterId: 'current',
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
        },
        {
          id: `p-${Date.now()}-2`,
          promoterId: 'current',
          date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
          time: '10:30',
          community: 'Comunidad El Milagro',
          objective: 'Carga Masiva: Entrega de Material Didáctico',
          attendeeName: 'Prof. Mario Quintanilla',
          attendeeRole: 'Director Centro Escolar',
          attendeePhone: '2233-1122',
          proposals: 'Abastecer kits de papelería para 150 alumnos.',
          problemsIdentified: ProblemType.OTRAS,
          type: ActivityType.SOCIAL_ACTIVITY,
          agreements: 'Firma de acta de recepción.',
          additionalObservations: 'Prioridad alta - Evento con medios',
          driveLinks: '',
          referral: 'Desarrollo Social',
          companions: 'Equipo Comunicación',
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
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Selector de Vista */}
      <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full max-w-sm mx-auto shadow-inner">
        <button 
          onClick={() => setViewMode('agenda')}
          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'agenda' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <i className="fa-solid fa-calendar-check mr-2"></i> Mi Agenda
        </button>
        <button 
          onClick={() => setViewMode('import')}
          className={`flex-1 py-3 px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'import' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
        >
          <i className="fa-solid fa-file-import mr-2"></i> Importar
        </button>
      </div>

      {viewMode === 'agenda' ? (
        <div className="space-y-8">
          {/* Calendario Horizontal (Selector de Fecha) */}
          <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100">
            <div className="flex overflow-x-auto no-scrollbar gap-4 pb-2">
              {dateRange.map((date) => (
                <button
                  key={date.full}
                  onClick={() => setSelectedDate(date.full)}
                  className={`flex-shrink-0 w-16 h-24 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-2 ${
                    selectedDate === date.full
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md scale-105'
                    : 'border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200'
                  }`}
                >
                  <span className="text-[10px] font-black uppercase">{date.day}</span>
                  <span className="text-xl font-black leading-none">{date.num}</span>
                  {activities.some(a => a.date === date.full) && (
                    <div className="w-1.5 h-1.5 bg-indigo-600 rounded-full"></div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Listado de Actividades del Día */}
          <div className="space-y-6">
            <div className="px-4">
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Actividades Programadas</h3>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
            </div>

            {dayActivities.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {dayActivities.map(activity => (
                  <div key={activity.id} className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-8 flex flex-col md:flex-row gap-8 hover:shadow-md transition-all">
                    {/* Time & Type */}
                    <div className="md:w-32 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pb-6 md:pb-0 md:pr-6">
                      <p className="text-3xl font-black text-slate-800 tracking-tighter">{activity.time}</p>
                      <span className="text-[9px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full mt-2 text-center">
                        {activity.type}
                      </span>
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 space-y-4">
                      <div className="flex items-center gap-2">
                        <i className="fa-solid fa-location-dot text-red-500"></i>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">{activity.community}</span>
                      </div>
                      <h4 className="text-2xl font-black text-slate-800 leading-tight">{activity.objective}</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Contacto</p>
                          <p className="text-sm font-bold text-slate-700">{activity.attendeeName}</p>
                          <p className="text-xs text-slate-400">{activity.attendeeRole} • {activity.attendeePhone}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Referido a</p>
                          <p className="text-sm font-bold text-slate-700">{activity.referral || '---'}</p>
                        </div>
                      </div>

                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 mt-2">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Propuestas Previas</p>
                        <p className="text-xs text-slate-600 leading-relaxed italic">"{activity.proposals || 'Sin propuestas registradas.'}"</p>
                      </div>
                    </div>

                    {/* Status Button (Desktop Right) */}
                    <div className="flex items-center">
                       <div className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${
                         activity.status === ActivityStatus.COMPLETED 
                         ? 'bg-emerald-50 border-emerald-100 text-emerald-600' 
                         : 'bg-amber-50 border-amber-100 text-amber-600 animate-pulse'
                       }`}>
                         {activity.status === ActivityStatus.COMPLETED ? (
                           <><i className="fa-solid fa-check-double mr-2"></i> Ejecutado</>
                         ) : (
                           <><i className="fa-solid fa-clock mr-2"></i> Pendiente</>
                         )}
                       </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-[2.5rem] border border-dashed border-slate-200 p-20 text-center space-y-4">
                <div className="w-20 h-20 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto text-3xl">
                  <i className="fa-solid fa-calendar-xmark"></i>
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg">No hay programación para este día</h4>
                  <p className="text-sm text-slate-400">Puedes importar nuevas actividades desde el botón de arriba</p>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* VISTA DE IMPORTACIÓN */
        <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 p-12 space-y-10 animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-[1.5rem] flex items-center justify-center text-3xl shadow-inner">
              <i className="fa-solid fa-file-excel"></i>
            </div>
            <div>
              <h2 className="text-2xl font-black text-slate-800 tracking-tight">Cargar Programación Semanal</h2>
              <p className="text-sm text-slate-400 font-medium">Sincroniza tu agenda directamente desde Google Sheets</p>
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">URL de la Hoja de Cálculo (Google Sheets)</label>
            <div className="flex flex-col md:flex-row gap-4">
              <input 
                type="text" 
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm focus:border-emerald-500 outline-none transition-all font-medium"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
              />
              <button 
                onClick={simulateGoogleSheetImport}
                disabled={isImporting || !sheetUrl}
                className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center transition-all shadow-xl shadow-emerald-100 active:scale-95"
              >
                {isImporting ? (
                  <><i className="fa-solid fa-circle-notch animate-spin mr-3 text-lg"></i> Procesando...</>
                ) : (
                  <><i className="fa-solid fa-cloud-arrow-up mr-3 text-lg"></i> Importar Agenda</>
                )}
              </button>
            </div>
          </div>
          
          <div className="p-6 bg-slate-50 rounded-3xl border border-dashed border-slate-200 flex gap-5 items-start">
            <i className="fa-solid fa-circle-info text-2xl text-indigo-500 mt-1"></i>
            <div className="text-xs text-slate-500 leading-relaxed">
              <p className="font-black text-slate-700 uppercase tracking-widest mb-1">Instrucciones de Formato:</p>
              Asegúrate de que la hoja sea pública o compartida con el correo institucional. El archivo debe contener las columnas: <span className="font-bold text-indigo-600 italic">Fecha, Hora, Comunidad, Objetivo y Contacto</span> para una sincronización correcta.
            </div>
          </div>

          <div className="pt-6">
            <button 
              onClick={() => setViewMode('agenda')}
              className="text-[10px] font-black text-slate-400 hover:text-slate-800 uppercase tracking-widest flex items-center gap-2 transition-colors"
            >
              <i className="fa-solid fa-arrow-left"></i> Volver a mi agenda
            </button>
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
