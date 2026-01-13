import { Activity, Promoter, ReportPeriod } from "../types";

export const generatePerformanceSummary = async (activities: Activity[], promoters: Promoter[]) => {
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'summary', activities, promoters })
  });
  const data = await resp.json();
  return data.text || 'No se pudo generar el resumen en este momento.';
};

export const generateFinalReport = async (activities: Activity[], period: ReportPeriod | string, promoterName?: string, filterInfo?: string) => {
  const resp = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'report', activities, period, promoterName, filterInfo })
  });
  const data = await resp.json();
  return data.text || 'Informe no generado.';
};
