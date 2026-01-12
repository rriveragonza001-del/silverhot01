
import { GoogleGenAI } from "@google/genai";
import { Activity, Promoter, ReportPeriod } from "../types";

export const generatePerformanceSummary = async (activities: Activity[], promoters: Promoter[]) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  const model = 'gemini-3-flash-preview';

  const prompt = `
    Analiza las siguientes actividades de promotores de campo y genera un resumen ejecutivo profesional en español.
    
    Promotores: ${JSON.stringify(promoters.map(p => ({ id: p.id, name: p.name })))}
    Actividades: ${JSON.stringify(activities)}
    
    El resumen debe incluir:
    1. Un análisis general de la ejecución de labores.
    2. Identificación de áreas de oportunidad.
    3. Recomendaciones para mejorar la eficiencia del equipo.
    4. Un breve veredicto sobre el estado actual de las operaciones.
    
    Responde en formato Markdown limpio.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "No se pudo generar el resumen en este momento.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error al conectar con la inteligencia artificial para el análisis.";
  }
};

export const generateFinalReport = async (activities: Activity[], period: ReportPeriod | string, promoterName?: string, filterInfo?: string) => {
  const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_API_KEY });
  const model = 'gemini-3-pro-preview';

  const prompt = `
    Genera un INFORME DE ACTIVIDADES DETALLADO.
    Periodo/Filtro: ${period}.
    ${promoterName ? `Gestor: ${promoterName}.` : ''}
    ${filterInfo ? `Contexto del filtro: ${filterInfo}.` : ''}
    Datos de actividades: ${JSON.stringify(activities)}
    
    El informe debe estructurarse así:
    1. Portada Institucional.
    2. Resumen Ejecutivo de Labores.
    3. Desglose detallado por tipo de acción y cumplimiento de objetivos.
    4. Análisis territorial y de impacto (Zonas impactadas).
    5. Conclusiones estratégicas y firmas de responsabilidad.
    
    Usa un tono formal, administrativo y profesional. Responde en Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Informe no generado.";
  } catch (error) {
    console.error("Gemini Report Error:", error);
    return "Error al procesar el informe final.";
  }
};
