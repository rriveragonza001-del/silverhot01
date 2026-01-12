
import React, { useState } from 'react';
import { Activity, Promoter } from '../types';
import { generatePerformanceSummary } from '../services/gemini';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface PerformanceReportProps {
  activities: Activity[];
  promoters: Promoter[];
}

const PerformanceReport: React.FC<PerformanceReportProps> = ({ activities, promoters }) => {
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simple aggregation for charts
  const performanceData = promoters.map(p => {
    const pActivities = activities.filter(a => a.promoterId === p.id);
    const completed = pActivities.filter(a => a.status === 'Completado').length;
    return {
      name: p.name.split(' ')[0],
      total: pActivities.length,
      completed,
      efficiency: pActivities.length > 0 ? (completed / pActivities.length) * 100 : 0
    };
  });

  const handleGenerateAISummary = async () => {
    setLoading(true);
    try {
      const summary = await generatePerformanceSummary(activities, promoters);
      setAiSummary(summary);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Statistics Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="mb-4">
            <h3 className="text-lg font-bold text-slate-800">Desempeño por Promotor</h3>
            <p className="text-sm text-slate-500">Actividades completadas vs totales</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={12} axisLine={false} tickLine={false} />
                <YAxis fontSize={12} axisLine={false} tickLine={false} />
                <Tooltip 
                  cursor={{fill: '#f8fafc'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="completed" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} name="Completadas" />
                <Bar dataKey="total" fill="#e2e8f0" radius={[4, 4, 0, 0]} barSize={40} name="Totales" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Global Summary Cards */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-indigo-600 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <i className="fa-solid fa-list-check text-2xl opacity-50"></i>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">Total</span>
            </div>
            <div>
              <p className="text-3xl font-bold">{activities.length}</p>
              <p className="text-indigo-100 text-xs uppercase tracking-wider font-semibold">Labores Registradas</p>
            </div>
          </div>
          
          <div className="bg-emerald-500 text-white p-6 rounded-xl shadow-lg flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <i className="fa-solid fa-circle-check text-2xl opacity-50"></i>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs">Rate</span>
            </div>
            <div>
              <p className="text-3xl font-bold">
                {activities.length > 0 
                  ? Math.round((activities.filter(a => a.status === 'Completado').length / activities.length) * 100) 
                  : 0}%
              </p>
              <p className="text-emerald-50 text-xs uppercase tracking-wider font-semibold">Eficacia Global</p>
            </div>
          </div>

          <div className="col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-800">Análisis Inteligente (Gemini AI)</h4>
                <p className="text-xs text-slate-400">Genera un resumen ejecutivo del mes/semana actual</p>
              </div>
              <button 
                onClick={handleGenerateAISummary}
                disabled={loading}
                className="bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center transition-all shadow-md active:scale-95"
              >
                {loading ? (
                  <>
                    <i className="fa-solid fa-circle-notch animate-spin mr-2"></i>
                    Procesando...
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                    Analizar Labores
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* AI Summary Content */}
      {aiSummary && (
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
              <i className="fa-solid fa-robot text-lg"></i>
            </div>
            <h3 className="text-xl font-bold text-slate-800">Reporte Ejecutivo de Desempeño</h3>
          </div>
          <div className="prose prose-slate max-w-none text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
            {aiSummary}
          </div>
        </div>
      )}
    </div>
  );
};

export default PerformanceReport;
