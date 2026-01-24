import type { VercelRequest, VercelResponse } from "@vercel/node";
import { Client } from "pg";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

function getClient() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("Missing DATABASE_URL");
  return new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!JWT_SECRET) {
    return res.status(500).json({ error: "Missing JWT_SECRET" });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const email = String(body?.email ?? "");
  const password = String(body?.password ?? "");

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password required" });
  }

  const client = getClient();

  try {
    await client.connect();

    const r = await client.query(
      "select id, email, password_hash, role from users where email = $1 limit 1",
      [email]
    );

    if (r.rowCount === 0) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const user = r.rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);

    if (!ok) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.status(200).json({
      ok: true,
      token,
      user: { email: user.email, role: user.role },
    });
  } catch (e: any) {
    return res.status(500).json({ error: e?.message ?? "Server error" });
  } finally {
    try { await client.end(); } catch {}
  }
}
