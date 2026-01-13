async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function generateWithRetry(ai: any, prompt: string, maxRetries = 3) {
  let lastErr: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await ai.models.generateContent({
        model: "gemini-1.5-flash",
        contents: prompt,
      });
    } catch (e: any) {
      lastErr = e;
      const msg = String(e?.message ?? "");
      const is429 = msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED") || msg.includes("exceeded");
      if (!is429 || i === maxRetries) break;

      // backoff simple: 2s, 5s, 10s...
      const delay = [2000, 5000, 10000][i] ?? 15000;
      await sleep(delay);
    }
  }
  throw lastErr;
}
