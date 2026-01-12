
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

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    setReportResult(null);
    try {
      const result = await generateFinalReport(activities, selectedPeriod, promoter.name);
      setReportResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <i className="fa-solid fa-file-export"></i>
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Descargar Informe Final</h2>
            <p className="text-sm text-slate-500">Genera reportes oficiales apoyados por IA</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          {Object.values(ReportPeriod).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                selectedPeriod === period 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-inner' 
                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200'
              }`}
            >
              <i className={`fa-solid ${
                period === ReportPeriod.DAILY ? 'fa-calendar-day' : 
                period === ReportPeriod.WEEKLY ? 'fa-calendar-week' : 
                period === ReportPeriod.MONTHLY ? 'fa-calendar' : 'fa-calendar-check'
              } text-xl`}></i>
              <span className="font-bold text-xs uppercase">{period}</span>
            </button>
          ))}
        </div>

        <button 
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-lg"
        >
          {isGenerating ? (
            <>
              <i className="fa-solid fa-gear animate-spin"></i>
              Analizando Datos con Gemini AI...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles"></i>
              Generar Informe {selectedPeriod}
            </>
          )}
        </button>
      </div>

      {reportResult && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <i className="fa-solid fa-check-circle text-emerald-500"></i>
              Informe Generado Correctamente
            </h3>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2">
                <i className="fa-solid fa-file-pdf"></i> PDF
              </button>
              <button className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center gap-2">
                <i className="fa-solid fa-print"></i> Imprimir
              </button>
            </div>
          </div>
          <div className="prose prose-slate max-w-none text-sm leading-relaxed whitespace-pre-wrap text-slate-700 p-6 bg-slate-50 rounded-lg border border-slate-100 font-mono">
            {reportResult}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingModule;
