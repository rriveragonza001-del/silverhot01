
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
      setErrorMessage("No existen actividades registradas para procesar en el informe.");
      return;
    }

    setIsGenerating(true);
    setReportResult(null);
    setErrorMessage(null);

    try {
      // Llamada real a Gemini
      const result = await generateFinalReport(activities, selectedPeriod, promoter.name);
      setReportResult(result);
    } catch (e: any) {
      console.error(e);
      setErrorMessage(e.message || "Error al procesar el informe final con IA. Verifique su conexión.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!reportResult) return;
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert("Habilite las ventanas emergentes para descargar su PDF.");
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>INFORME GESTIÓN - ${promoter.name}</title>
          <style>
            body { font-family: 'Helvetica', sans-serif; padding: 50px; color: #1e293b; line-height: 1.6; background: #fff; }
            .header-doc { margin-bottom: 50px; border-bottom: 2px solid #4f46e5; padding-bottom: 20px; }
            .header-doc h1 { color: #4f46e5; text-transform: uppercase; font-size: 20px; letter-spacing: 1px; }
            .info-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; font-size: 11px; margin-top: 20px; background: #f8fafc; padding: 15px; border-radius: 8px; }
            .content-body { margin-top: 40px; white-space: pre-wrap; font-size: 13px; text-align: justify; }
            .signature { margin-top: 100px; border-top: 1px solid #cbd5e1; width: 300px; text-align: center; padding-top: 10px; font-size: 12px; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header-doc">
            <h1>Informe Institucional de Gestión</h1>
            <div class="info-grid">
              <div><strong>Gestor:</strong> ${promoter.name}</div>
              <div><strong>Periodo:</strong> ${selectedPeriod}</div>
              <div><strong>Fecha de Generación:</strong> ${new Date().toLocaleDateString()}</div>
              <div><strong>Sistema:</strong> PromoterFlow v6.0</div>
            </div>
          </div>
          <div class="content-body">${reportResult.replace(/\n/g, '<br/>')}</div>
          <div class="signature">Firma del Gestor Responsable</div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(() => { window.close(); }, 700);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 p-8 md:p-10">
        <div className="flex items-center gap-5 mb-10">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-100">
            <i className="fa-solid fa-file-export text-2xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Exportar Informe Final</h2>
            <p className="text-sm text-slate-400 font-medium tracking-tight">Seleccione el periodo para análisis por IA</p>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {Object.values(ReportPeriod).map(period => (
            <button
              key={period}
              onClick={() => setSelectedPeriod(period)}
              className={`p-6 rounded-2xl border-2 transition-all flex flex-col items-center gap-3 active:scale-95 ${
                selectedPeriod === period 
                ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm' 
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
              <i className="fa-solid fa-spinner animate-spin text-lg"></i>
              Sincronizando con IA...
            </>
          ) : (
            <>
              <i className="fa-solid fa-wand-magic-sparkles text-lg text-indigo-400"></i>
              Generar y Exportar Informe {selectedPeriod}
            </>
          )}
        </button>
      </div>

      {errorMessage && (
        <div className="bg-red-50 p-10 rounded-[2.5rem] border border-red-100 animate-in slide-in-from-top-4">
          <div className="flex items-center gap-4 text-red-600 mb-4">
            <i className="fa-solid fa-circle-exclamation text-2xl"></i>
            <h3 className="font-black text-lg">Error Detectado</h3>
          </div>
          <p className="text-red-900 text-sm font-bold uppercase tracking-widest">{errorMessage}</p>
        </div>
      )}

      {reportResult && (
        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200 animate-in fade-in duration-500">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-6 border-b border-slate-100 pb-8">
            <div>
              <h3 className="text-xl font-black text-slate-800 flex items-center gap-3">
                <i className="fa-solid fa-circle-check text-emerald-500"></i>
                Borrador del Informe Listo
              </h3>
              <p className="text-xs text-slate-400 mt-1 uppercase font-bold tracking-widest">Haga clic abajo para descargar la versión oficial en PDF</p>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={handleExportPDF}
                className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all"
              >
                <i className="fa-solid fa-file-pdf"></i> DESCARGAR PDF OFICIAL
              </button>
            </div>
          </div>
          
          <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100">
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed font-sans text-sm whitespace-pre-wrap">
              {reportResult}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportingModule;
