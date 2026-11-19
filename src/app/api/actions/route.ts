import { cookies } from "next/headers";
import { db } from "@/db";
import { profiles, dailyLogs, meals, activities, groups, challengeAwards, customChallenges } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { randomBytes } from "node:crypto";
import { ensureDay, awardCompletedChallenges, validDate } from "@/lib/dashboard";
import { resolveProfile } from "@/lib/session";
import { CHALLENGES, CHALLENGE_METRICS, HABITS, COMPONENTS, FOOD_COLORS, metricWindow, metricReward } from "@/lib/gymrats";
import { storedGroupCode, LEGACY_GROUP_CODE } from "@/lib/brand";

export const dynamic = "force-dynamic";
function text(value: unknown, max: number, required = false) {
  if (typeof value !== "string" || value.trim().length > max || (required && !value.trim())) throw new Error("Confira os campos do formulário e tente novamente.");
  return value.trim();
}
function numeric(value: unknown, min: number, max: number) { if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) throw new Error(`Informe um valor entre ${min} e ${max}.`); return value; }
function list(value: unknown, allowed: string[]) { if (!Array.isArray(value) || value.some(v => typeof v !== "string" || !allowed.includes(v))) throw new Error("Selecione opções válidas."); return [...new Set(value)] as string[]; }

export async function POST(request: Request) {
  if (request.headers.get("sec-fetch-site") === "cross-site") return Response.json({ error: "Requisição não autorizada." }, { status: 403 });
  try {
    const body = await request.json();
    const jar = await cookies();
    const profile = await resolveProfile(request, jar);
    const date = validDate(body.date);
    const day = await ensureDay(profile.id, date);
    const dayWhere = and(eq(dailyLogs.profileId, profile.id), eq(dailyLogs.date, date));
    switch (body.action) {
      case "habit": {
        const id = text(body.habit, 30, true);
        if (!HABITS.some(h => h.id === id) || typeof body.checked !== "boolean") throw new Error("Hábito inválido.");
        const nextHabits = [...day.habits.filter(h => h !== id && h !== `!${id}`), body.checked ? id : `!${id}`];
        await db.update(dailyLogs).set({ habits: nextHabits, ...(id === "water" ? { waterMl: body.checked ? Math.max(day.waterMl, profile.waterGoal) : Math.min(day.waterMl, profile.waterGoal - 250) } : {}), ...(id === "sleep" ? { sleepHours: body.checked ? 7.5 : null, sleepQuality: body.checked ? 4 : 0 } : {}) }).where(dayWhere);
        break;
      }
      case "water": {
        const amount = numeric(body.amount, -2000, 2000);
        if (!Number.isInteger(amount) || amount === 0) throw new Error("Informe uma quantidade válida em ml.");
        await db.update(dailyLogs).set({ waterMl: sql`greatest(0, least(20000, ${dailyLogs.waterMl} + ${amount}))`, habits: day.habits.filter(h => h !== "!water") }).where(dayWhere);
        break;
      }
      case "meal": {
        const type = text(body.type, 30, true);
        if (!["Café da manhã", "Almoço", "Lanche", "Jantar"].includes(type)) throw new Error("Escolha o tipo de refeição.");
        const components = list(body.components, COMPONENTS.map(c => c.id));
        const colors = list(body.colors, FOOD_COLORS.map(c => c.id));
        if (!components.length) throw new Error("Marque pelo menos um componente da sua refeição.");
        await db.transaction(async tx => {
          await tx.insert(meals).values({ profileId: profile.id, date, type, components, colors, note: text(body.note ?? "", 400) });
          const cleared = [type === "Café da manhã" ? "!breakfast" : "", components.includes("fruit") ? "!fruit" : "", components.includes("vegetable") ? "!vegetables" : ""];
          await tx.update(dailyLogs).set({ habits: day.habits.filter(h => !cleared.includes(h)) }).where(dayWhere);
        });
        break;
      }
      case "delete-meal":
        await db.delete(meals).where(and(eq(meals.id, numeric(body.id, 1, 2147483647)), eq(meals.profileId, profile.id), eq(meals.date, date)));
        break;
      case "activity": {
        const type = text(body.type, 30, true);
        if (!["Musculação", "Cardio", "Corrida", "Caminhada", "Esporte", "Yoga", "Dança", "Descanso"].includes(type)) throw new Error("Escolha uma atividade válida.");
        const duration = type === "Descanso" ? 0 : numeric(body.duration, 1, 600);
        if (!Number.isInteger(duration)) throw new Error("Informe a duração em minutos inteiros.");
        await db.transaction(async tx => {
          await tx.insert(activities).values({ profileId: profile.id, date, type, duration, note: text(body.note ?? "", 400) });
          await tx.update(dailyLogs).set({ habits: day.habits.filter(h => h !== "!workout") }).where(dayWhere);
        });
        break;
      }
      case "delete-activity":
        await db.delete(activities).where(and(eq(activities.id, numeric(body.id, 1, 2147483647)), eq(activities.profileId, profile.id), eq(activities.date, date)));
        break;
      case "sleep": {
        const hours = numeric(body.hours, 0, 16);
        const quality = numeric(body.quality, 1, 5);
        if (!Number.isInteger(quality)) throw new Error("Escolha uma qualidade entre 1 e 5 estrelas.");
        await db.update(dailyLogs).set({ sleepHours: hours, sleepQuality: quality, habits: day.habits.filter(h => h !== "!sleep") }).where(dayWhere);
        break;
      }
      case "checkin": {
        const mood = text(body.mood, 30, true);
        const stress = text(body.stress, 30, true);
        if (!["Muito bem", "Bem", "Normal", "Cansado", "Muito mal"].includes(mood) || !["Baixo", "Moderado", "Alto"].includes(stress)) throw new Error("Selecione seu humor e seu nível de estresse.");
        await db.update(dailyLogs).set({ mood, stress, energy: numeric(body.energy, 20, 100), checkIn: true, note: text(body.note ?? "", 500) }).where(dayWhere);
        break;
      }
      case "challenge": {
        const id = text(body.id, 40, true);
        let valid = CHALLENGES.some(c => c.id === id);
        if (!valid && id.startsWith("custom-")) {
          const customId = Number(id.slice(7));
          if (Number.isInteger(customId)) {
            const [row] = await db.select({ id: customChallenges.id }).from(customChallenges).where(and(eq(customChallenges.id, customId), eq(customChallenges.profileId, profile.id)));
            valid = Boolean(row);
          }
        }
        if (!valid) throw new Error("Desafio não encontrado.");
        const joined = body.join !== false;
        await db.update(profiles).set({ joinedChallenges: joined ? [...new Set([...profile.joinedChallenges, id])] : profile.joinedChallenges.filter(c => c !== id) }).where(eq(profiles.id, profile.id));
        break;
      }
      case "create-challenge": {
        const name = text(body.name, 60, true);
        const description = text(body.description ?? "", 200);
        const metricId = text(body.metric, 20, true);
        const metric = CHALLENGE_METRICS.find(m => m.id === metricId);
        if (!metric) throw new Error("Escolha o que você quer acompanhar neste desafio.");
        const target = numeric(body.target, 1, metric.maxTarget);
        if (!Number.isInteger(target)) throw new Error("Informe uma meta em número inteiro.");
        const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(customChallenges).where(eq(customChallenges.profileId, profile.id));
        if (count >= 20) throw new Error("Você atingiu o limite de 20 desafios personalizados. Exclua algum para criar outro.");
        const windowDays = metricWindow(metric.id, target);
        const reward = metricReward(metric.id, target);
        await db.transaction(async tx => {
          const [row] = await tx.insert(customChallenges).values({ profileId: profile.id, name, description, metric: metric.id, target, windowDays, reward }).returning({ id: customChallenges.id });
          await tx.update(profiles).set({ joinedChallenges: [...new Set([...profile.joinedChallenges, `custom-${row.id}`])] }).where(eq(profiles.id, profile.id));
        });
        break;
      }
      case "delete-challenge": {
        const id = text(body.id, 40, true);
        if (!id.startsWith("custom-")) throw new Error("Este desafio não pode ser excluído.");
        const customId = Number(id.slice(7));
        if (!Number.isInteger(customId)) throw new Error("Desafio não encontrado.");
        await db.transaction(async tx => {
          const deleted = await tx.delete(customChallenges).where(and(eq(customChallenges.id, customId), eq(customChallenges.profileId, profile.id))).returning({ id: customChallenges.id });
          if (!deleted.length) throw new Error("Desafio não encontrado.");
          await tx.delete(challengeAwards).where(and(eq(challengeAwards.profileId, profile.id), eq(challengeAwards.challengeId, id)));
          await tx.update(profiles).set({ joinedChallenges: profile.joinedChallenges.filter(c => c !== id) }).where(eq(profiles.id, profile.id));
        });
        break;
      }
      case "profile": {
        const name = text(body.name, 80, true);
        const email = text(body.email ?? "", 150);
        if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Informe um e-mail válido.");
        const waterGoal = numeric(body.waterGoal, 500, 6000);
        if (!Number.isInteger(waterGoal)) throw new Error("Informe a meta em ml inteiros.");
        await db.update(profiles).set({ name, email, waterGoal, reminders: Boolean(body.reminders) }).where(eq(profiles.id, profile.id));
        break;
      }
      case "create-group": {
        const name = text(body.name, 60, true);
        const category = text(body.category ?? "friends", 20);
        if (!["friends", "university", "work"].includes(category)) throw new Error("Escolha um tipo de grupo válido.");
        const code = randomBytes(4).toString("hex").toUpperCase();
        await db.transaction(async tx => {
          await tx.insert(groups).values({ code, name, ownerId: profile.id, category });
          await tx.update(profiles).set({ groupCode: code }).where(eq(profiles.id, profile.id));
        });
        break;
      }
      case "join-group": {
        const code = storedGroupCode(text(body.code, 40, true).toUpperCase());
        const [group] = await db.select().from(groups).where(eq(groups.code, code));
        if (!group) throw new Error("Este código de grupo não foi encontrado. Confira o convite.");
        await db.update(profiles).set({ groupCode: code }).where(eq(profiles.id, profile.id));
        break;
      }
      case "leave-group": {
        if (profile.groupCode === LEGACY_GROUP_CODE) throw new Error("Você já está na comunidade Health Runners.");
        await db.update(profiles).set({ groupCode: LEGACY_GROUP_CODE }).where(eq(profiles.id, profile.id));
        break;
      }
      case "reset-data": {
        await db.transaction(async tx => {
          await tx.delete(meals).where(eq(meals.profileId, profile.id));
          await tx.delete(activities).where(eq(activities.profileId, profile.id));
          await tx.delete(dailyLogs).where(eq(dailyLogs.profileId, profile.id));
          await tx.delete(challengeAwards).where(eq(challengeAwards.profileId, profile.id));
          await tx.update(profiles).set({ baseXp: 0, joinedChallenges: [] }).where(eq(profiles.id, profile.id));
        });
        break;
      }
      default: throw new Error("Essa ação não está disponível.");
    }
    return Response.json(await awardCompletedChallenges(profile.id, date), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Health Runners action:", error);
    const known = error instanceof Error && !/query|database|relation|connect|syntax|SQL|ECONN/i.test(error.message);
    return Response.json({ error: known ? error.message : "Não foi possível salvar. Tente novamente em instantes." }, { status: 400 });
  }
}
