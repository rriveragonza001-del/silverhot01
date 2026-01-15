
import React, { useState } from 'react';
import { Activity, Promoter, ActivityType } from '../types';
import { generateFinalReport } from '../services/gemini';

interface AdminReportGeneratorProps {
  activities: Activity[];
  promoters: Promoter[];
}

const AdminReportGenerator: React.FC<AdminReportGeneratorProps> = ({ activities, promoters }) => {
  const [filterPromoter, setFilterPromoter] = useState<string>('ALL');
  const [filterZone, setFilterZone] = useState<string>('ALL');
  const [filterType, setFilterType] = useState<string>('ALL');
  const [isGenerating, setIsGenerating] = useState(false);
  const [report, setReport] = useState<string | null>(null);

  const zones = Array.from(new Set(promoters.map(p => p.zone || 'Sin Zona')));

  const handleGenerate = async () => {
    setIsGenerating(true);
    setReport(null);

    let filtered = [...activities];
    if (filterPromoter !== 'ALL') filtered = filtered.filter(a => a.promoterId === filterPromoter);
    if (filterType !== 'ALL') filtered = filtered.filter(a => a.type === filterType);
    if (filterZone !== 'ALL') {
      const zonePromoterIds = promoters.filter(p => p.zone === filterZone).map(p => p.id);
      filtered = filtered.filter(a => zonePromoterIds.includes(a.promoterId));
    }

    const promoterName = filterPromoter !== 'ALL' ? promoters.find(p => p.id === filterPromoter)?.name : 'General';
    const filterDesc = `Filtros aplicados - Zona: ${filterZone}, Tipo: ${filterType}`;

    try {
      const result = await generateFinalReport(filtered, 'Reporte Personalizado Admin', promoterName, filterDesc);
      setReport(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExportPDF = () => {
    if (!report) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Reporte Estratégico Admin</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #1e293b; }
            h1 { color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 10px; }
            .meta { margin-bottom: 30px; padding: 15px; background: #f1f5f9; border-radius: 8px; font-size: 13px; }
            .content { white-space: pre-wrap; line-height: 1.6; }
          </style>
        </head>
        <body>
          <h1>Reporte Consolidado de Gestión</h1>
          <div class="meta">
            <p><strong>Filtros:</strong> Zona: ${filterZone}, Tipo: ${filterType}</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <div class="content">${report.replace(/\n/g, '<br/>')}</div>
          <script>
            window.onload = function() { window.print(); setTimeout(() => { window.close(); }, 500); };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg">
            <i className="fa-solid fa-file-invoice-dollar text-xl"></i>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Generador de Informes Estratégicos</h2>
            <p className="text-sm text-slate-500">Crea reportes personalizados filtrando por gestor, zona o actividad</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtrar por Gestor</label>
            <select 
              value={filterPromoter}
              onChange={(e) => setFilterPromoter(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="ALL">Todos los Gestores</option>
              {promoters.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Filtrar por Zona</label>
            <select 
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="ALL">Todas las Zonas</option>
              {zones.map(z => <option key={z} value={z}>{z}</option>)}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tipo de Actividad</label>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
            >
              <option value="ALL">Todas las Actividades</option>
              {Object.values(ActivityType).map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>

        <button 
          onClick={handleGenerate}
          disabled={isGenerating}
          className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-3 shadow-xl shadow-indigo-200 transition-all active:scale-95"
        >
          {isGenerating ? (
            <><i className="fa-solid fa-spinner animate-spin"></i> Generando con IA...</>
          ) : (
            <><i className="fa-solid fa-wand-sparkles"></i> Generar Reporte Consolidado</>
          )}
        </button>
      </div>

      {report && (
        <div className="bg-white p-10 rounded-2xl shadow-xl border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex justify-between items-center mb-8 pb-4 border-b border-slate-100">
            <h3 className="text-xl font-bold text-slate-800">Resultado del Análisis</h3>
            <div className="flex gap-3">
              <button 
                onClick={handleExportPDF}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              >
                <i className="fa-solid fa-file-pdf"></i> EXPORTAR PDF
              </button>
            </div>
          </div>
          <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed bg-slate-50 p-8 rounded-2xl border border-slate-100 whitespace-pre-wrap font-sans">
            {report}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReportGenerator;
