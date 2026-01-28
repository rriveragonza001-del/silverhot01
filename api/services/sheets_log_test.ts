export default async function handler(_req: any, res: any) {
  const url = process.env.SHEETS_WEBHOOK_URL || "";
  const secret = process.env.SHEETS_WEBHOOK_SECRET || "";

  return res.status(200).json({
    ok: true,
    url,
    secretLen: secret.length,
    secretPreview: secret ? secret.slice(0, 2) + "***" + secret.slice(-2) : "",
  });
}
