// services/gemini.ts
// FRONT-SAFE: NO imports de SDKs aquí. Solo fetch al backend.

export type GeminiRequest = {
  prompt: string;
  // opcional: contexto adicional
  context?: string;
};

export type GeminiResponse = {
  ok: boolean;
  text?: string;
  error?: string;
};

export async function generateWithGemini(body: GeminiRequest): Promise<GeminiResponse> {
  const r = await fetch("/api/gemini", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, error: data?.error || "Error calling /api/gemini" };

  return { ok: true, text: data?.text ?? "" };
}
