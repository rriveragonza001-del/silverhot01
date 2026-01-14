
import { GoogleGenAI } from "@google/genai";
import { Activity, Promoter, ReportPeriod } from "../types";

export const generatePerformanceSummary = async (activities: Activity[], promoters: Promoter[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const model = 'gemini-3-flash-preview';

  if (activities.length === 0) return "No hay actividades registradas para analizar.";

  const prompt = `
    Analiza las siguientes actividades de promotores de campo y genera un resumen ejecutivo profesional en español.
    
    Promotores: ${JSON.stringify(promoters.map(p => ({ id: p.id, name: p.name })))}
    Actividades: ${JSON.stringify(activities.map(a => ({
      obj: a.objective,
      com: a.community,
      type: a.type, // Added type for better context
      prob: a.problemsIdentified,
      status: a.status
    })))}
    
    El resumen debe incluir:
    1. Un análisis general de la ejecución de labores.
    2. Identificación de áreas de oportunidad.
    3. Recomendaciones para mejorar la eficiencia.
    
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
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  // Usamos flash-preview para evitar timeouts en informes detallados
  const model = 'gemini-3-flash-preview';

  if (activities.length === 0) return "Error: No se encontraron actividades en el rango seleccionado para generar el informe.";

  const prompt = `
    Genera un INFORME DE ACTIVIDADES DETALLADO Y PROFESIONAL.
    Periodo: ${period}.
    ${promoterName ? `Gestor responsable: ${promoterName}.` : ''}
    ${filterInfo ? `Contexto adicional: ${filterInfo}.` : ''}
    
    Datos de actividades a procesar: ${JSON.stringify(activities.map(a => ({
      fecha: a.date,
      hora: a.time,
      comunidad: a.community,
      tipo: a.type, // Added type for better context
      objetivo: a.objective,
      atendio: a.attendeeName,
      problematica: a.problemsIdentified,
      acuerdos: a.agreements,
      estado: a.status
    })))}
    
    ESTRUCTURA DEL INFORME (Markdown):
    # INFORME OFICIAL DE GESTIÓN TERRITORIAL
    ## 1. RESUMEN EJECUTIVO
    (Breve descripción de los logros del periodo)
    
    ## 2. DETALLE DE INTERVENCIONES
    (Listado organizado de las visitas y resultados principales)
    
    ## 3. ANÁLISIS DE PROBLEMÁTICAS IDENTIFICADAS
    (Frecuencia de problemas como luminarias, calles, etc.)
    
    ## 4. CONCLUSIONES Y RECOMENDACIONES TÉCNICAS
    
    Usa un tono formal y administrativo.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });
    return response.text || "Informe no generado por falta de respuesta del modelo.";
  } catch (error) {
    console.error("Gemini Report Error:", error);
    throw new Error("Fallo en la conexión con el motor de informes. Por favor, reintente.");
  }
};