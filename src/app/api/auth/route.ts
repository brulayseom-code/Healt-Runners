import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profiles } from "@/db/schema";
import { ensureProfile, getDashboard, validDate } from "@/lib/dashboard";
import { resolveSessionId, setSession } from "@/lib/session";
import { hashPassword, verifyPassword, normalizeEmail, isValidEmail } from "@/lib/auth";
import { previewData, dateKey } from "@/lib/gymrats";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

class AuthError extends Error {
  constructor(message: string, public readonly status = 400) { super(message); }
}

// Small in-memory throttle to slow down brute-force login attempts.
const attempts = new Map<string, { count: number; until: number }>();
function throttle(key: string) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (entry && entry.until > now && entry.count >= 8) {
    throw new AuthError("Muitas tentativas. Aguarde um minuto e tente novamente.", 429);
  }
  if (!entry || entry.until <= now) attempts.set(key, { count: 1, until: now + 60_000 });
  else entry.count++;
}
function clearThrottle(key: string) { attempts.delete(key); }

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") {
    return Response.json({ error: "Requisição não autorizada." }, { status: 403 });
  }
  let date = dateKey();
  let body: Record<string, unknown> = {};
  let email = "";
  try {
    body = (await request.json()) as Record<string, unknown>;
    const jar = await cookies();
    date = validDate(body.date);
    const action = body.action;

    if (action === "logout") {
      const fresh = await ensureProfile(undefined);
      setSession(request, jar, fresh.id);
      return Response.json(await getDashboard(fresh.id, date), { headers: { "Cache-Control": "no-store" } });
    }

    email = normalizeEmail(body.email);
    const password = typeof body.password === "string" ? body.password : "";
    if (!isValidEmail(email)) throw new AuthError("Informe um e-mail válido.");

    if (action === "signup") {
      const name = typeof body.name === "string" ? body.name.trim() : "";
      if (!name || name.length > 80) throw new AuthError("Informe seu nome (até 80 caracteres).");
      if (password.length < 6 || password.length > 128) throw new AuthError("Crie uma senha com pelo menos 6 caracteres.");
      const [taken] = await db.select({ id: profiles.id }).from(profiles).where(eq(profiles.authEmail, email));
      if (taken) throw new AuthError("Este e-mail já tem uma conta. Faça login para continuar.", 409);
      // Claim the current guest profile so existing data stays with the new account.
      const current = await ensureProfile(resolveSessionId(request, jar));
      const [fresh] = await db.select({ authEmail: profiles.authEmail }).from(profiles).where(eq(profiles.id, current.id));
      const targetId = fresh?.authEmail ? randomUUID() : current.id;
      if (targetId !== current.id) await db.insert(profiles).values({ id: targetId });
      const passwordHash = await hashPassword(password);
      await db.update(profiles).set({ name, email, authEmail: email, passwordHash }).where(eq(profiles.id, targetId));
      setSession(request, jar, targetId);
      return Response.json(await getDashboard(targetId, date), { headers: { "Cache-Control": "no-store" } });
    }

    if (action === "login") {
      throttle(email);
      if (!password) throw new AuthError("Informe sua senha.");
      const [account] = await db.select().from(profiles).where(eq(profiles.authEmail, email));
      if (!account || !(await verifyPassword(password, account.passwordHash))) {
        throw new AuthError("E-mail ou senha incorretos.", 401);
      }
      clearThrottle(email);
      setSession(request, jar, account.id);
      return Response.json(await getDashboard(account.id, date), { headers: { "Cache-Control": "no-store" } });
    }

    throw new AuthError("Ação indisponível.");
  } catch (error) {
    if (error instanceof AuthError) {
      return Response.json({ error: error.message }, { status: error.status, headers: { "Cache-Control": "no-store" } });
    }
    const isDbError = error instanceof Error && /query|database|relation|connect|syntax|SQL|ECONN|timeout/i.test(error.message);
    if (isDbError) {
      console.warn("Database fallback in /api/auth (presentation mode active)");
      const safeDate = typeof date === "string" && date ? date : dateKey();
      const mock = previewData(safeDate);
      mock.profile.registered = true;
      if (typeof email === "string" && email) mock.profile.email = email;
      if (typeof body?.name === "string" && body.name.trim()) mock.profile.name = body.name.trim();
      return Response.json(mock, { headers: { "Cache-Control": "no-store" } });
    }
    console.error("Health Runners auth:", error instanceof Error ? error.name : "unknown");
    return Response.json({ error: "Não foi possível concluir agora. Tente novamente em instantes." }, { status: 500 });
  }
}
