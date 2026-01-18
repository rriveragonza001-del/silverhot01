import type { VercelRequest, VercelResponse } from "@vercel/node";
import { sql } from "@vercel/postgres";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    const { rows } = await sql`select now() as server_time`;
    return res.status(200).json({
      ok: true,
      rows,
    });
  } catch (error: any) {
    return res.status(500).json({
      ok: false,
      error: String(error),
    });
  }
}
