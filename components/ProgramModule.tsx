
import React, { useState } from 'react';
import { Activity, ActivityType, ActivityStatus, Location, ProblemType } from '../types';

interface ProgramModuleProps {
  onProgramLoaded: (activities: Activity[]) => void;
  currentLocation: Location;
}

const ProgramModule: React.FC<ProgramModuleProps> = ({ onProgramLoaded, currentLocation }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [sheetUrl, setSheetUrl] = useState('');

  const simulateGoogleSheetImport = () => {
    if (!sheetUrl.includes('docs.google.com/spreadsheets')) {
      alert("Por favor ingresa una URL válida de Google Sheets");
      return;
    }
    
    setIsImporting(true);
    
    // Simulate API delay
    setTimeout(() => {
      const today = new Date();
      const mockProgram: Activity[] = [
        {
          id: `p-${Date.now()}-1`,
          promoterId: 'p1',
          date: today.toISOString().split('T')[0],
          time: '08:00',
          community: 'Sector Norte',
          objective: 'Carga Masiva: Visita Sector Norte',
          attendeeName: 'Pendiente',
          attendeeRole: 'Líder Comunitario',
          attendeePhone: '',
          proposals: '',
          problemsIdentified: ProblemType.OTRAS,
          agreements: '',
          additionalObservations: 'Programación automática desde Hoja de Cálculo',
          driveLinks: '',
          referral: '',
          companions: '',
          status: ActivityStatus.PENDING,
          location: currentLocation
        },
        {
          id: `p-${Date.now()}-2`,
          promoterId: 'p1',
          date: new Date(today.getTime() + 86400000).toISOString().split('T')[0],
          time: '10:00',
          community: 'Comité de Agua',
          objective: 'Carga Masiva: Reunión Comité de Agua',
          attendeeName: 'Pendiente',
          attendeeRole: 'Representante Comité',
          attendeePhone: '',
          proposals: '',
          problemsIdentified: ProblemType.OTRAS,
          agreements: '',
          additionalObservations: 'Programación automática desde Hoja de Cálculo',
          driveLinks: '',
          referral: '',
          companions: '',
          status: ActivityStatus.PENDING,
          location: currentLocation
        }
      ];
      
      onProgramLoaded(mockProgram);
      setIsImporting(false);
      setSheetUrl('');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-file-excel"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Cargar Programación</h2>
            <p className="text-sm text-slate-500">Sincroniza tu agenda desde Google Sheets</p>
          </div>
        </div>

        <div className="flex gap-4">
          <input 
            type="text" 
            placeholder="Pega aquí la URL de tu Google Sheet..."
            className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
            value={sheetUrl}
            onChange={(e) => setSheetUrl(e.target.value)}
          />
          <button 
            onClick={simulateGoogleSheetImport}
            disabled={isImporting || !sheetUrl}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center transition-all shadow-md"
          >
            {isImporting ? (
              <i className="fa-solid fa-spinner animate-spin mr-2"></i>
            ) : (
              <i className="fa-solid fa-cloud-arrow-up mr-2"></i>
            )}
            Importar
          </button>
        </div>
        
        <div className="mt-4 p-4 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
          <p className="text-xs text-slate-500 flex items-center">
            <i className="fa-solid fa-circle-info mr-2 text-indigo-500"></i>
            Asegúrate de que la hoja sea pública o compartida con el correo de la institución. El sistema creará automáticamente tu agenda semanal.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProgramModule;
