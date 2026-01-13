import { GoogleGenAI } from "@google/genai";

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
    }

    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ error: "Prompt required" });
    }

    const ai = new GoogleGenAI({ apiKey });

    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
    });

    return res.status(200).json({ text: result.text ?? "" });
  } catch (e: any) {
    return res.status(500).json({
      error: "Generation failed",
      detail: e?.message ?? String(e),
    });
  }
}
