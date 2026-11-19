import { db } from "@/db";
import { profiles, dailyLogs, meals, activities, groups, groupMembers, challengeAwards, customChallenges } from "@/db/schema";
import { and, eq, gte, lte, asc, inArray, sql } from "drizzle-orm";
import { APP_NAME, DEFAULT_GROUP_CODE, LEGACY_GROUP_CODE, publicGroupCode } from "@/lib/brand";
import { randomUUID } from "node:crypto";
import { allChallenges, calculateDay, challengeProgress, CHALLENGE_METRICS, dateKey, offsetDate, type Challenge, type ChallengeMetricId, type DashboardData, type Day, type Meal, type Activity, type HistoryDay, type Leader } from "@/lib/gymrats";

export function serializeCustomChallenge(row: typeof customChallenges.$inferSelect): Challenge {
  const metric = CHALLENGE_METRICS.find(m => m.id === row.metric) ?? CHALLENGE_METRICS[0];
  const description = row.description || `Meta pessoal de ${row.target} ${metric.unit}.`;
  return {
    id: `custom-${row.id}`,
    name: row.name,
    description,
    long: `${description} O progresso considera seus registros dos últimos ${row.windowDays} dias. Este é um desafio criado por você, no seu ritmo.`,
    category: metric.category,
    color: metric.color,
    icon: metric.icon,
    target: row.target,
    unit: metric.unit,
    reward: row.reward,
    people: 1,
    duration: `${row.windowDays} dias`,
    metric: row.metric as ChallengeMetricId,
    windowDays: row.windowDays,
    custom: true,
  };
}

const serializeMeal = (row: typeof meals.$inferSelect): Meal => ({ id: row.id, type: row.type, components: row.components, colors: row.colors, note: row.note, createdAt: row.createdAt.toISOString() });
const serializeActivity = (row: typeof activities.$inferSelect): Activity => ({ id: row.id, type: row.type, duration: row.duration, note: row.note, createdAt: row.createdAt.toISOString() });

export function validDate(value: unknown): string {
  const today = dateKey();
  if (value === undefined || value === null || value === "") return today;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value || value > today || value < offsetDate(today, -365)) throw new Error("Escolha uma data válida, entre hoje e os últimos 12 meses.");
  return value;
}

export async function ensureProfile(cookieId?: string) {
  if (cookieId && /^[a-f0-9-]{36}$/i.test(cookieId)) {
    const [profile] = await db.select().from(profiles).where(eq(profiles.id, cookieId));
    if (profile) return profile;
  }
  return db.transaction(async tx => {
    const newGroup = await tx.insert(groups).values({ code: LEGACY_GROUP_CODE, name: APP_NAME, category: "friends" }).onConflictDoNothing().returning();
    if (newGroup.length) await tx.insert(groupMembers).values([
      { groupCode: LEGACY_GROUP_CODE, name: "Ana Beatriz", avatar: "ana", weeklyPoints: 420 },
      { groupCode: LEGACY_GROUP_CODE, name: "Lucas Martins", avatar: "lucas", weeklyPoints: 395 },
      { groupCode: LEGACY_GROUP_CODE, name: "Mariana Silva", avatar: "maria", weeklyPoints: 380 },
      { groupCode: LEGACY_GROUP_CODE, name: "Pedro Santos", avatar: "pedro", weeklyPoints: 245 },
    ]);
    const [profile] = await tx.insert(profiles).values({ id: randomUUID() }).returning();
    const today = dateKey();
    const seedDays = Array.from({ length: 14 }, (_, index) => {
      const ago = 13 - index;
      const isToday = ago === 0;
      const hasActivity = [0, 1, 3, 4, 5, 8, 10, 12].includes(ago);
      return { profileId: profile.id, date: offsetDate(today, -ago), habits: isToday ? [] : ago === 7 ? [] : ["breakfast", "fruit", ...(hasActivity ? ["workout"] : [])], waterMl: isToday ? 1500 : ago === 7 ? 750 : ago < 7 ? 2000 + (ago % 3) * 250 : 1000 + (ago % 4) * 250, sleepHours: isToday ? 7.5 : ago === 7 ? 6 : [7.2, 7.5, 6.5, 8, 7, 7.3][ago % 6], sleepQuality: isToday ? 4 : 3 + ago % 2, mood: isToday ? null : "Bem", energy: 60 + (ago % 3) * 10, stress: isToday ? null : "Baixo", checkIn: !isToday && ago !== 7, note: "" };
    });
    await tx.insert(dailyLogs).values(seedDays);
    await tx.insert(meals).values([
      { profileId: profile.id, date: today, type: "Café da manhã", components: ["protein", "fruit", "carbohydrate"], colors: ["orange", "white"], note: "Iogurte natural, banana e granola", createdAt: new Date(`${today}T08:00:00`) },
      { profileId: profile.id, date: today, type: "Lanche", components: ["fruit", "fat"], colors: ["red"], note: "Maçã e castanhas", createdAt: new Date(`${today}T10:30:00`) },
      ...seedDays.filter(d => d.date !== today && d.habits.length).map(d => ({ profileId: profile.id, date: d.date, type: "Café da manhã", components: ["protein", "fruit", "carbohydrate"], colors: ["orange", "white"], note: "Café da manhã equilibrado", createdAt: new Date(`${d.date}T08:00:00`) })),
    ]);
    await tx.insert(activities).values(seedDays.filter(d => d.date === today || d.habits.includes("workout")).map((d, i) => ({ profileId: profile.id, date: d.date, type: d.date === today ? "Musculação" : i % 2 ? "Caminhada" : "Musculação", duration: d.date === today ? 45 : [30, 40, 45, 35][i % 4], note: d.date === today ? "Um tempo para cuidar de mim" : "", createdAt: new Date(`${d.date}T07:00:00`) })));
    return profile;
  });
}

export async function ensureDay(profileId: string, date: string) {
  await db.insert(dailyLogs).values({ profileId, date }).onConflictDoNothing();
  const [day] = await db.select().from(dailyLogs).where(and(eq(dailyLogs.profileId, profileId), eq(dailyLogs.date, date)));
  return day;
}

export async function getDashboard(profileId: string, selectedDate: string): Promise<DashboardData> {
  const [profile] = await db.select().from(profiles).where(eq(profiles.id, profileId));
  if (!profile) throw new Error("Seu perfil não foi encontrado. Atualize a página para continuar.");
  // Rename previously saved demo group names without changing group IDs or memberships.
  await db.update(groups).set({ name: APP_NAME }).where(sql`lower(trim(${groups.name})) = ${"rats do bem"}`);
  await ensureDay(profileId, selectedDate);
  const [allDays, allMeals, allActivities, awards, groupRows, demoMembers, otherProfiles, customRows] = await Promise.all([
    db.select().from(dailyLogs).where(eq(dailyLogs.profileId, profileId)).orderBy(asc(dailyLogs.date)),
    db.select().from(meals).where(eq(meals.profileId, profileId)).orderBy(asc(meals.createdAt)),
    db.select().from(activities).where(eq(activities.profileId, profileId)).orderBy(asc(activities.createdAt)),
    db.select().from(challengeAwards).where(eq(challengeAwards.profileId, profileId)),
    db.select().from(groups).where(eq(groups.code, profile.groupCode)),
    db.select().from(groupMembers).where(eq(groupMembers.groupCode, profile.groupCode)),
    db.select().from(profiles).where(eq(profiles.groupCode, profile.groupCode)).limit(50),
    db.select().from(customChallenges).where(eq(customChallenges.profileId, profileId)).orderBy(asc(customChallenges.createdAt)),
  ]);
  const allHistory: HistoryDay[] = allDays.map(day => {
    const dayMeals = allMeals.filter(m => m.date === day.date).map(serializeMeal);
    const dayActivities = allActivities.filter(a => a.date === day.date).map(serializeActivity);
    const calculated = calculateDay(day, dayMeals, dayActivities, profile.waterGoal);
    return { date: day.date, waterMl: day.waterMl, sleepHours: day.sleepHours, activityMinutes: calculated.activityMinutes, mealsCount: dayMeals.length, points: calculated.points, progress: calculated.progress, completed: calculated.completed, checkIn: day.checkIn, colors: [...new Set(dayMeals.flatMap(m => m.colors))] };
  });
  const day = allDays.find(d => d.date === selectedDate)!;
  const today = dateKey();
  const weeklyXp = allHistory.filter(d => d.date >= offsetDate(today, -6) && d.date <= today).reduce((sum, d) => sum + d.points, 0) + awards.filter(a => dateKey(a.createdAt) >= offsetDate(today, -6)).reduce((sum, a) => sum + a.points, 0);
  function streakFor(predicate: (d: HistoryDay) => boolean) {
    let current = today;
    if (!allHistory.some(d => d.date === current && predicate(d))) current = offsetDate(current, -1);
    let count = 0;
    while (allHistory.some(d => d.date === current && predicate(d))) { count++; current = offsetDate(current, -1); }
    return count;
  }
  const leaderboard: Leader[] = demoMembers.map(m => ({ id: `demo-${m.id}`, name: m.name, avatar: m.avatar, points: m.weeklyPoints }));
  const others = otherProfiles.filter(p => p.id !== profileId);
  if (others.length) {
    const ids = others.map(p => p.id);
    const since = offsetDate(today, -6);
    const [friendDays, friendMeals, friendActivities, friendAwards] = await Promise.all([
      db.select().from(dailyLogs).where(and(inArray(dailyLogs.profileId, ids), gte(dailyLogs.date, since), lte(dailyLogs.date, today))),
      db.select().from(meals).where(and(inArray(meals.profileId, ids), gte(meals.date, since), lte(meals.date, today))),
      db.select().from(activities).where(and(inArray(activities.profileId, ids), gte(activities.date, since), lte(activities.date, today))),
      db.select().from(challengeAwards).where(inArray(challengeAwards.profileId, ids)),
    ]);
    for (const friend of others) {
      const points = friendDays.filter(d => d.profileId === friend.id).reduce((sum, d) => sum + calculateDay(d, friendMeals.filter(m => m.profileId === friend.id && m.date === d.date).map(serializeMeal), friendActivities.filter(a => a.profileId === friend.id && a.date === d.date).map(serializeActivity), friend.waterGoal).points, 0) + friendAwards.filter(a => a.profileId === friend.id && dateKey(a.createdAt) >= since).reduce((sum, a) => sum + a.points, 0);
      leaderboard.push({ id: friend.id, name: friend.name, avatar: friend.avatar, points });
    }
  }
  leaderboard.push({ id: profileId, name: profile.name, avatar: profile.avatar, points: weeklyXp, isYou: true });
  leaderboard.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));
  return {
    profile: { id: profile.id, name: profile.name, email: profile.email, avatar: profile.avatar, waterGoal: profile.waterGoal, joinedChallenges: profile.joinedChallenges, completedChallenges: awards.map(a => a.challengeId), reminders: profile.reminders, groupCode: publicGroupCode(profile.groupCode), registered: Boolean(profile.authEmail) },
    day: day as Day,
    meals: allMeals.filter(m => m.date === selectedDate).map(serializeMeal),
    activities: allActivities.filter(a => a.date === selectedDate).map(serializeActivity),
    history: allHistory.filter(d => d.date <= selectedDate && d.date >= offsetDate(selectedDate, -29)),
    customChallenges: customRows.map(serializeCustomChallenge),
    totalXp: profile.baseXp + allHistory.reduce((sum, d) => sum + d.points, 0) + awards.reduce((sum, a) => sum + a.points, 0),
    weeklyXp,
    streak: streakFor(d => d.progress >= 50),
    hydrationStreak: streakFor(d => d.waterMl >= profile.waterGoal),
    leaderboard,
    group: groupRows[0] ? { ...groupRows[0], code: publicGroupCode(groupRows[0].code) } : { code: DEFAULT_GROUP_CODE, name: APP_NAME, category: "friends" },
  };
}

export async function awardCompletedChallenges(profileId: string, date: string) {
  const data = await getDashboard(profileId, date);
  const completed = allChallenges(data).filter(c => data.profile.joinedChallenges.includes(c.id) && !data.profile.completedChallenges.includes(c.id) && challengeProgress(c.id, data) >= c.target);
  if (completed.length) {
    await db.insert(challengeAwards).values(completed.map(c => ({ profileId, challengeId: c.id, points: c.reward }))).onConflictDoNothing();
    return getDashboard(profileId, date);
  }
  return data;
}
