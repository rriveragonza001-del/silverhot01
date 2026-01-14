
import React, { useState } from 'react';
import { Activity, ReportPeriod, Promoter } from '../types';
import { generateFinalReport } from '../services/gemini';

interface ReportingModuleProps {
  activities: Activity[];
  promoter: Promoter;
}

const ReportingModule: React.FC<ReportingModuleProps> = ({ activities, promoter }) => {
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>(ReportPeriod.DAILY);
  const [isGenerating, setIsGenerating] = useState(false);
  const [reportResult, setReportResult] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGenerateReport = async () => {
    if (activities.length === 0) {
      setErrorMessage("No existen actividades registradas para el periodo seleccionado.");
      return;
    }

    setIsGenerating(true);
    setReportResult(null);
    setErrorMessage(null);

    try {
      const result = await generateFinalReport(activities, selectedPeriod, promoter.name);
      setReportResult(result);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Error al procesar el informe final. Intente nuevamente.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-10">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <i className="fa-solid fa-file-export text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Descargar Informe Final</h2>
            <p className="text-sm text-slate-400 font-medium">Generación automática de reportes con IA</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {Object.values(ReportPeriod).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 ${
                selectedPeriod === period 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-inner' 
                : 'border-slate-50 bg-white text-slate-400 hover:border-slate-200'
              }`}
            >
              <i className={`fa-solid ${
                period === ReportPeriod.DAILY ? 'fa-calendar-day' : 
                period === ReportPeriod.WEEKLY ? 'fa-calendar-week' : 
                period === ReportPeriod.MONTHLY ? 'fa-calendar' : 'fa-calendar-check'
              } text-2xl`}></i>
              <span className="font-black text-[10px] uppercase tracking-widest">{period}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-xl active:scale-95 disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-circle-notch animate-spin text-lg"></i>
              Analizando Datos con Gemini AI...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-lg"></i>
              Generar Informe {selectedPeriod}
            </>
          )}
        </button>
      </div>

      {/* Mensaje de Error (Si ocurre) */}
      {errorMessage && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border-2 border-red-50 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4 text-red-600 mb-6">
            <i className="fa-solid fa-circle-exclamation text-2xl"></i>
            <h3 className="font-black text-lg">Error en Generación</h3>
          </div>
          <div className="bg-red-50/50 p-8 rounded-2xl border border-red-100 text-red-900 font-mono text-sm leading-relaxed">
            {errorMessage}
          </div>
          <button 
            onClick={handleGenerateReport}
            className="mt-6 text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline"
          >
            Reintentar proceso ahora
          </button>
        </div>
      )}

      {/* Resultado Exitoso (Como en tu captura) */}
      {reportResult && (
        <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
              <i className="fa-solid fa-circle-check text-emerald-500 text-2xl"></i>
              Informe Generado Correctamente
            </h3>
            <div className="flex gap-3 w-full md:w-auto">
              <button className="flex-1 md:flex-none px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100">
                <i className="fa-solid fa-file-pdf"></i> PDF
              </button>
              <button className="flex-1 md:flex-none px-6 py-3 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-slate-100">
                <i className="fa-solid fa-print"></i> Imprimir
              </button>
            </div>
          </div>
          
          <div className="prose prose-slate max-w-none p-8 bg-slate-50/50 rounded-2xl border border-slate-100 text-slate-700 leading-relaxed overflow-x-auto">
            <div className="whitespace-pre-wrap font-sans text-sm">
              {reportResult}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingModule;
