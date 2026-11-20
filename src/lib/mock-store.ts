import {
  APP_NAME,
  DEFAULT_GROUP_CODE,
  LEGACY_GROUP_CODE,
} from "@/lib/brand";
import {
  calculateDay,
  challengeProgress,
  dateKey,
  offsetDate,
  CHALLENGES,
  CHALLENGE_METRICS,
  HABITS,
  MISSIONS,
  metricReward,
  metricWindow,
  type Challenge,
  type ChallengeMetricId,
  type DashboardData,
  type Day,
  type HistoryDay,
  type Leader,
  type Meal,
  type Activity,
} from "@/lib/gymrats";

const LOCAL_STORAGE_KEY = "health_runners_local_presentation_v2";

export function createRichMockDashboard(today: string = dateKey()): DashboardData {
  const goal = 2000;
  const seedDays: HistoryDay[] = Array.from({ length: 14 }, (_, index) => {
    const ago = 13 - index;
    const date = offsetDate(today, -ago);
    const isToday = ago === 0;
    const hasActivity = [0, 1, 3, 4, 5, 8, 10, 12].includes(ago);
    const habits = isToday ? [] : ago === 7 ? [] : ["breakfast", "fruit", ...(hasActivity ? ["workout"] : [])];
    const waterMl = isToday ? 1500 : ago === 7 ? 750 : ago < 7 ? 2000 + (ago % 3) * 250 : 1000 + (ago % 4) * 250;
    const sleepHours = isToday ? 7.5 : ago === 7 ? 6 : [7.2, 7.5, 6.5, 8, 7, 7.3][ago % 6];
    const checkIn = !isToday && ago !== 7;
    const colors = isToday ? ["orange", "white", "red"] : habits.length ? ["green", "orange", "red"] : [];
    const completed = new Set(habits);
    if (waterMl >= goal) completed.add("water");
    if (sleepHours >= 7) completed.add("sleep");
    if (hasActivity) completed.add("workout");
    if (colors.length) { completed.add("fruit"); completed.add("vegetables"); }
    const activityMinutes = hasActivity ? (isToday ? 45 : [30, 40, 45, 35][ago % 4]) : 0;
    const mealsCount = isToday ? 2 : habits.length ? 3 : 0;
    const missionCount = MISSIONS.filter(id => completed.has(id)).length;
    const points = HABITS.filter(h => completed.has(h.id)).reduce((sum, h) => sum + h.points, 0) + Math.min(mealsCount, 4) * 3 + (checkIn ? 3 : 0) + (missionCount === 4 ? 50 : 0);
    const progress = Math.round(HABITS.filter(h => completed.has(h.id)).length / HABITS.length * 100);
    return {
      date,
      waterMl,
      sleepHours,
      activityMinutes,
      mealsCount,
      points,
      progress,
      completed: [...completed],
      checkIn,
      colors,
    };
  });

  const day: Day = {
    date: today,
    habits: [],
    waterMl: 1500,
    sleepHours: 7.5,
    sleepQuality: 4,
    mood: null,
    energy: 60,
    stress: null,
    checkIn: false,
    note: "",
  };

  const meals: Meal[] = [
    { id: -1, type: "Café da manhã", components: ["protein", "fruit", "carbohydrate"], colors: ["orange", "white"], note: "Iogurte natural, banana e granola", createdAt: `${today}T08:00:00` },
    { id: -2, type: "Lanche", components: ["fruit", "fat"], colors: ["red"], note: "Maçã e castanhas", createdAt: `${today}T10:30:00` }
  ];

  const activities: Activity[] = [
    { id: -1, type: "Musculação", duration: 45, note: "Um tempo para cuidar de mim", createdAt: `${today}T07:00:00` }
  ];

  const weeklyXp = seedDays.filter(d => d.date >= offsetDate(today, -6)).reduce((sum, d) => sum + d.points, 0);
  const totalXp = 1000 + seedDays.reduce((sum, d) => sum + d.points, 0);

  const leaderboard: Leader[] = [
    { id: "ana", name: "Ana Beatriz", avatar: "ana", points: 420 },
    { id: "lucas", name: "Lucas Martins", avatar: "lucas", points: 395 },
    { id: "maria", name: "Mariana Silva", avatar: "maria", points: 380 },
    { id: "you", name: "Isabella Costa", avatar: "isabella", points: weeklyXp, isYou: true },
    { id: "pedro", name: "Pedro Santos", avatar: "pedro", points: 245 },
  ];
  leaderboard.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  return {
    profile: {
      id: "local-profile-presentation",
      name: "Isabella Costa",
      email: "isabella@exemplo.com",
      avatar: "isabella",
      waterGoal: goal,
      joinedChallenges: ["water-week", "colorful-plate"],
      completedChallenges: [],
      reminders: true,
      groupCode: DEFAULT_GROUP_CODE,
      registered: false,
    },
    day,
    meals,
    activities,
    history: seedDays,
    customChallenges: [],
    totalXp,
    weeklyXp,
    streak: 6,
    hydrationStreak: 6,
    leaderboard,
    group: { code: DEFAULT_GROUP_CODE, name: APP_NAME, category: "friends" },
  };
}

export function getLocalDashboard(selectedDate: string): DashboardData {
  if (typeof window === "undefined") {
    return createRichMockDashboard(selectedDate);
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DashboardData;
      if (parsed && parsed.profile && parsed.day && Array.isArray(parsed.history)) {
        return recomputeDashboard(parsed, selectedDate);
      }
    }
  } catch {
    /* fallback to initial */
  }

  const fresh = createRichMockDashboard(selectedDate);
  saveLocalDashboard(fresh);
  return fresh;
}

export function saveLocalDashboard(data: DashboardData) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data));
  } catch {
    /* ignore storage quota or private mode */
  }
}

export function recomputeDashboard(data: DashboardData, selectedDate: string): DashboardData {
  const today = dateKey();
  const goal = data.profile.waterGoal || 2000;

  // Make sure day matches selectedDate
  if (data.day.date !== selectedDate) {
    const historyMatch = data.history.find(d => d.date === selectedDate);
    data.day = {
      date: selectedDate,
      habits: historyMatch?.completed ? [...historyMatch.completed] : [],
      waterMl: historyMatch?.waterMl ?? 0,
      sleepHours: historyMatch?.sleepHours ?? null,
      sleepQuality: historyMatch?.sleepHours ? 4 : 0,
      mood: historyMatch?.checkIn ? "Bem" : null,
      energy: historyMatch?.checkIn ? 70 : 60,
      stress: historyMatch?.checkIn ? "Baixo" : null,
      checkIn: Boolean(historyMatch?.checkIn),
      note: "",
    };
  }

  const stats = calculateDay(data.day, data.meals, data.activities, goal);

  // Update or append history entry for selectedDate
  const existingIdx = data.history.findIndex(d => d.date === selectedDate);
  const dayColors = [...new Set(data.meals.flatMap(m => m.colors))];
  const historyEntry: HistoryDay = {
    date: selectedDate,
    waterMl: data.day.waterMl,
    sleepHours: data.day.sleepHours,
    activityMinutes: stats.activityMinutes,
    mealsCount: data.meals.length,
    points: stats.points,
    progress: stats.progress,
    completed: stats.completed,
    checkIn: data.day.checkIn,
    colors: dayColors,
  };

  if (existingIdx >= 0) {
    data.history[existingIdx] = historyEntry;
  } else {
    data.history.push(historyEntry);
    data.history.sort((a, b) => a.date.localeCompare(b.date));
  }

  // Check challenge awards
  const all = [...CHALLENGES, ...data.customChallenges];
  const newAwards: string[] = [...data.profile.completedChallenges];
  for (const challenge of all) {
    if (data.profile.joinedChallenges.includes(challenge.id) && !newAwards.includes(challenge.id)) {
      const progress = challengeProgress(challenge.id, data);
      if (progress >= challenge.target) {
        newAwards.push(challenge.id);
      }
    }
  }
  data.profile.completedChallenges = newAwards;

  const challengeBonusPoints = all
    .filter(c => newAwards.includes(c.id))
    .reduce((sum, c) => sum + c.reward, 0);

  // Recalculate weekly and total XP
  data.weeklyXp =
    data.history.filter(d => d.date >= offsetDate(today, -6) && d.date <= today).reduce((sum, d) => sum + d.points, 0) +
    challengeBonusPoints;
  data.totalXp = 1000 + data.history.reduce((sum, d) => sum + d.points, 0) + challengeBonusPoints;

  // Streaks
  function streakFor(predicate: (d: HistoryDay) => boolean) {
    let current = today;
    if (!data.history.some(d => d.date === current && predicate(d))) current = offsetDate(current, -1);
    let count = 0;
    while (data.history.some(d => d.date === current && predicate(d))) {
      count++;
      current = offsetDate(current, -1);
    }
    return count;
  }
  data.streak = streakFor(d => d.progress >= 50);
  data.hydrationStreak = streakFor(d => d.waterMl >= goal);

  // Update leaderboard
  const meIdx = data.leaderboard.findIndex(l => l.isYou);
  if (meIdx >= 0) {
    data.leaderboard[meIdx].points = data.weeklyXp;
    data.leaderboard[meIdx].name = data.profile.name;
    data.leaderboard[meIdx].avatar = data.profile.avatar;
  } else {
    data.leaderboard.push({
      id: data.profile.id,
      name: data.profile.name,
      avatar: data.profile.avatar,
      points: data.weeklyXp,
      isYou: true,
    });
  }
  data.leaderboard.sort((a, b) => b.points - a.points || a.name.localeCompare(b.name));

  saveLocalDashboard(data);
  return { ...data };
}

export function processLocalAction(
  current: DashboardData,
  body: Record<string, unknown>,
  selectedDate: string
): DashboardData {
  const clone: DashboardData = JSON.parse(JSON.stringify(current));
  const goal = clone.profile.waterGoal || 2000;
  const action = String(body.action || "");

  switch (action) {
    case "habit": {
      const id = String(body.habit || "");
      const checked = Boolean(body.checked);
      clone.day.habits = clone.day.habits.filter(h => h !== id && h !== `!${id}`);
      clone.day.habits.push(checked ? id : `!${id}`);
      if (id === "water") {
        clone.day.waterMl = checked ? Math.max(clone.day.waterMl, goal) : Math.min(clone.day.waterMl, goal - 250);
      }
      if (id === "sleep") {
        clone.day.sleepHours = checked ? 7.5 : null;
        clone.day.sleepQuality = checked ? 4 : 0;
      }
      break;
    }
    case "water": {
      const amount = Number(body.amount) || 0;
      clone.day.waterMl = Math.max(0, Math.min(20000, clone.day.waterMl + amount));
      clone.day.habits = clone.day.habits.filter(h => h !== "!water");
      break;
    }
    case "meal": {
      const type = String(body.type || "Café da manhã");
      const components = Array.isArray(body.components) ? body.components.map(String) : [];
      const colors = Array.isArray(body.colors) ? body.colors.map(String) : [];
      const note = String(body.note || "");
      const newMeal: Meal = {
        id: Date.now(),
        type,
        components,
        colors,
        note,
        createdAt: new Date().toISOString(),
      };
      clone.meals.push(newMeal);
      break;
    }
    case "delete-meal": {
      const id = Number(body.id);
      clone.meals = clone.meals.filter(m => m.id !== id);
      break;
    }
    case "activity": {
      const type = String(body.type || "Musculação");
      const duration = Number(body.duration) || 0;
      const note = String(body.note || "");
      const newActivity: Activity = {
        id: Date.now(),
        type,
        duration,
        note,
        createdAt: new Date().toISOString(),
      };
      clone.activities.push(newActivity);
      break;
    }
    case "delete-activity": {
      const id = Number(body.id);
      clone.activities = clone.activities.filter(a => a.id !== id);
      break;
    }
    case "sleep": {
      clone.day.sleepHours = Number(body.hours) || 7;
      clone.day.sleepQuality = Number(body.quality) || 4;
      break;
    }
    case "checkin": {
      clone.day.mood = String(body.mood || "Bem");
      clone.day.energy = Number(body.energy) || 70;
      clone.day.stress = String(body.stress || "Baixo");
      clone.day.note = String(body.note || "");
      clone.day.checkIn = true;
      break;
    }
    case "challenge": {
      const id = String(body.id || "");
      const join = body.join !== false;
      if (join) {
        if (!clone.profile.joinedChallenges.includes(id)) {
          clone.profile.joinedChallenges.push(id);
        }
      } else {
        clone.profile.joinedChallenges = clone.profile.joinedChallenges.filter(c => c !== id);
      }
      break;
    }
    case "create-challenge": {
      const name = String(body.name || "Novo desafio");
      const description = String(body.description || "");
      const metric = (body.metric as ChallengeMetricId) || "water";
      const target = Number(body.target) || 5;
      const metricInfo = CHALLENGE_METRICS.find(m => m.id === metric) || CHALLENGE_METRICS[0];
      const windowDays = metricWindow(metric, target);
      const reward = metricReward(metric, target);
      const customId = `custom-${Date.now()}`;
      const newCustom: Challenge = {
        id: customId,
        name,
        description: description || `Meta pessoal de ${target} ${metricInfo.unit}.`,
        long: `${description || `Meta pessoal de ${target} ${metricInfo.unit}.`} O progresso considera seus registros dos últimos ${windowDays} dias.`,
        category: metricInfo.category,
        color: metricInfo.color,
        icon: metricInfo.icon,
        target,
        unit: metricInfo.unit,
        reward,
        people: 1,
        duration: `${windowDays} dias`,
        metric,
        windowDays,
        custom: true,
      };
      clone.customChallenges.push(newCustom);
      clone.profile.joinedChallenges.push(customId);
      break;
    }
    case "delete-challenge": {
      const id = String(body.id || "");
      clone.customChallenges = clone.customChallenges.filter(c => c.id !== id);
      clone.profile.joinedChallenges = clone.profile.joinedChallenges.filter(c => c !== id);
      clone.profile.completedChallenges = clone.profile.completedChallenges.filter(c => c !== id);
      break;
    }
    case "create-group": {
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();
      const name = String(body.name || "Meu Grupo");
      const category = String(body.category || "friends");
      clone.group = { code, name, category };
      clone.profile.groupCode = code;
      clone.leaderboard = [
        { id: clone.profile.id, name: clone.profile.name, avatar: clone.profile.avatar, points: clone.weeklyXp, isYou: true }
      ];
      break;
    }
    case "join-group": {
      const code = String(body.code || "").toUpperCase();
      if (code === DEFAULT_GROUP_CODE || code === LEGACY_GROUP_CODE) {
        clone.group = { code: DEFAULT_GROUP_CODE, name: APP_NAME, category: "friends" };
        clone.profile.groupCode = DEFAULT_GROUP_CODE;
      } else {
        clone.group = { code, name: `Grupo ${code}`, category: "friends" };
        clone.profile.groupCode = code;
      }
      break;
    }
    case "leave-group": {
      clone.group = { code: DEFAULT_GROUP_CODE, name: APP_NAME, category: "friends" };
      clone.profile.groupCode = DEFAULT_GROUP_CODE;
      break;
    }
    case "profile": {
      clone.profile.name = String(body.name || clone.profile.name);
      clone.profile.email = String(body.email || "");
      clone.profile.waterGoal = Number(body.waterGoal) || 2000;
      clone.profile.reminders = Boolean(body.reminders);
      break;
    }
    case "reset-data": {
      clone.day.habits = [];
      clone.day.waterMl = 0;
      clone.day.sleepHours = null;
      clone.day.sleepQuality = 0;
      clone.day.checkIn = false;
      clone.meals = [];
      clone.activities = [];
      clone.customChallenges = [];
      clone.profile.joinedChallenges = [];
      clone.profile.completedChallenges = [];
      clone.history = [];
      clone.totalXp = 0;
      clone.weeklyXp = 0;
      clone.streak = 0;
      clone.hydrationStreak = 0;
      break;
    }
    case "restore-demo": {
      const freshDemo = createRichMockDashboard(selectedDate);
      freshDemo.profile.name = clone.profile.name || "Isabella Costa";
      freshDemo.profile.avatar = clone.profile.avatar || "isabella";
      saveLocalDashboard(freshDemo);
      return freshDemo;
    }
  }

  return recomputeDashboard(clone, selectedDate);
}

export async function processLocalPhoto(
  current: DashboardData,
  file: File | null
): Promise<DashboardData> {
  const clone: DashboardData = JSON.parse(JSON.stringify(current));
  if (!file) {
    clone.profile.avatar = "initials";
    return recomputeDashboard(clone, clone.day.date);
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      clone.profile.avatar = String(reader.result || "initials");
      resolve(recomputeDashboard(clone, clone.day.date));
    };
    reader.onerror = () => {
      resolve(clone);
    };
    reader.readAsDataURL(file);
  });
}

export function processLocalAuth(
  current: DashboardData,
  body: Record<string, unknown>
): DashboardData {
  const clone: DashboardData = JSON.parse(JSON.stringify(current));
  const action = String(body.action || "");

  if (action === "logout") {
    const fresh = createRichMockDashboard(clone.day.date);
    saveLocalDashboard(fresh);
    return fresh;
  }

  if (action === "signup") {
    clone.profile.name = String(body.name || clone.profile.name);
    clone.profile.email = String(body.email || "");
    clone.profile.registered = true;
  } else if (action === "login") {
    clone.profile.email = String(body.email || clone.profile.email);
    clone.profile.registered = true;
  }

  return recomputeDashboard(clone, clone.day.date);
}
