import { APP_NAME, DEFAULT_GROUP_CODE } from "@/lib/brand";

export type View = "day" | "nutrition" | "hydration" | "activity" | "wellbeing" | "challenges" | "ranking" | "achievements" | "progress" | "settings";
export type Day = { date: string; habits: string[]; waterMl: number; sleepHours: number | null; sleepQuality: number; mood: string | null; energy: number; stress: string | null; checkIn: boolean; note: string };
export type Meal = { id: number; type: string; components: string[]; colors: string[]; note: string; createdAt: string };
export type Activity = { id: number; type: string; duration: number; note: string; createdAt: string };
export type Profile = { id: string; name: string; email: string; avatar: string; waterGoal: number; joinedChallenges: string[]; completedChallenges: string[]; reminders: boolean; groupCode: string; registered: boolean };
export type HistoryDay = { date: string; waterMl: number; sleepHours: number | null; activityMinutes: number; mealsCount: number; points: number; progress: number; completed: string[]; checkIn: boolean; colors: string[] };
export type Leader = { id: string; name: string; avatar: string; points: number; isYou?: boolean };
export type ChallengeMetricId = "water" | "colors" | "movement" | "breakfast" | "sleep" | "checkin";
export type Challenge = { id: string; name: string; description: string; long: string; category: string; color: string; icon: string; target: number; unit: string; reward: number; people: number; duration: string; metric: ChallengeMetricId; windowDays: number; custom?: boolean };
export type DashboardData = { profile: Profile; day: Day; meals: Meal[]; activities: Activity[]; history: HistoryDay[]; customChallenges: Challenge[]; totalXp: number; weeklyXp: number; streak: number; hydrationStreak: number; leaderboard: Leader[]; group: { code: string; name: string; category: string } };

export const HABITS = [
  { id: "breakfast", label: "Começar com um bom café da manhã", short: "Café da manhã", points: 5, icon: "breakfast", category: "Nutrição" },
  { id: "fruit", label: "Comer uma fruta", short: "Uma fruta no dia", points: 5, icon: "fruit", category: "Nutrição" },
  { id: "workout", label: "Colocar o corpo em movimento", short: "Atividade física", points: 15, icon: "workout", category: "Movimento" },
  { id: "water", label: "Alcançar minha meta de água", short: "Hidratação em dia", points: 10, icon: "water", category: "Hidratação" },
  { id: "sleep", label: "Dormir pelo menos 7 horas", short: "Uma boa noite de sono", points: 10, icon: "sleep", category: "Sono" },
  { id: "vegetables", label: "Incluir verduras e legumes no prato", short: "Mais cor no prato", points: 5, icon: "vegetables", category: "Nutrição" },
];
export const MISSIONS = ["fruit", "water", "workout", "vegetables"];
export const CHALLENGES: Challenge[] = [
  { id: "water-week", name: "Hidratação em dia", description: "7 dias cuidando de você, um copo de cada vez.", long: "Alcance sua meta diária de água em 7 dias. A quantidade ideal varia para cada pessoa: ajuste sua meta nas configurações, respeitando a orientação do seu profissional de saúde.", category: "Hidratação", color: "blue", icon: "water", target: 7, unit: "dias", reward: 100, people: 128, duration: "7 dias", metric: "water", windowDays: 7 },
  { id: "colorful-plate", name: "Mais cor, mais saúde", description: "Um prato colorido. Um mundo de possibilidades.", long: "Registre refeições com os cinco grupos de cores: verde, vermelho, amarelo/laranja, roxo e branco. Vale explorar novos alimentos no seu próprio ritmo. Marque as cores ao registrar uma refeição.", category: "Nutrição", color: "green", icon: "vegetables", target: 5, unit: "cores", reward: 80, people: 94, duration: "Nesta semana", metric: "colors", windowDays: 7 },
  { id: "movement-week", name: "Movimento que transforma", description: "Encontre seu ritmo e some 150 minutos na semana.", long: "Some 150 minutos de atividade física nos últimos 7 dias. Caminhada, dança, esporte e musculação contam. Respeite seus limites e lembre-se: descanso também faz parte da rotina.", category: "Movimento", color: "orange", icon: "workout", target: 150, unit: "min", reward: 120, people: 216, duration: "7 dias", metric: "movement", windowDays: 7 },
  { id: "breakfast-week", name: "Bom dia, bons hábitos", description: "Reserve um momento para o seu café da manhã.", long: "Registre um café da manhã ou marque esse hábito em 5 dias. Não existe prato perfeito: o importante é encontrar uma rotina que funcione para você.", category: "Nutrição", color: "yellow", icon: "breakfast", target: 5, unit: "dias", reward: 75, people: 67, duration: "5 dias", metric: "breakfast", windowDays: 7 },
];
export const CHALLENGE_METRICS: { id: ChallengeMetricId; label: string; short: string; unit: string; icon: string; color: string; category: string; maxTarget: number; defaultTarget: number }[] = [
  { id: "water", label: "Dias batendo a meta de água", short: "Hidratação", unit: "dias", icon: "water", color: "blue", category: "Hidratação", maxTarget: 30, defaultTarget: 7 },
  { id: "movement", label: "Minutos de atividade física", short: "Movimento", unit: "min", icon: "workout", color: "orange", category: "Movimento", maxTarget: 1500, defaultTarget: 150 },
  { id: "breakfast", label: "Dias com café da manhã", short: "Café da manhã", unit: "dias", icon: "breakfast", color: "yellow", category: "Nutrição", maxTarget: 30, defaultTarget: 5 },
  { id: "colors", label: "Cores diferentes no prato", short: "Prato colorido", unit: "cores", icon: "vegetables", color: "green", category: "Nutrição", maxTarget: 5, defaultTarget: 5 },
  { id: "sleep", label: "Dias dormindo 7h ou mais", short: "Sono", unit: "dias", icon: "sleep", color: "purple", category: "Sono", maxTarget: 30, defaultTarget: 7 },
  { id: "checkin", label: "Dias de check-in de bem-estar", short: "Bem-estar", unit: "dias", icon: "wellbeing", color: "pink", category: "Bem-estar", maxTarget: 30, defaultTarget: 7 },
];
export function metricWindow(metric: ChallengeMetricId, target: number) {
  return metric === "colors" || metric === "movement" ? 7 : Math.min(30, Math.max(7, target));
}
export function metricReward(metric: ChallengeMetricId, target: number) {
  const raw = metric === "colors" ? 80 : metric === "movement" ? target * 0.8 : metric === "checkin" ? target * 10 : target * 12;
  return Math.max(40, Math.min(120, Math.round(raw)));
}
export function challengeView(metric: ChallengeMetricId): View {
  if (metric === "water") return "hydration";
  if (metric === "movement") return "activity";
  if (metric === "sleep" || metric === "checkin") return "wellbeing";
  return "nutrition";
}
export const COMPONENTS = [
  { id: "protein", label: "Fonte de proteína", emoji: "🥚" },
  { id: "fruit", label: "Fruta", emoji: "🍎" },
  { id: "vegetable", label: "Verdura ou legume", emoji: "🥦" },
  { id: "carbohydrate", label: "Carboidrato", emoji: "🍚" },
  { id: "fat", label: "Gordura boa", emoji: "🥑" },
  { id: "water", label: "Água", emoji: "💧" },
];
export const FOOD_COLORS = [
  { id: "green", label: "Verde", color: "#7c9a62", example: "Folhas, brócolis, abacate" },
  { id: "red", label: "Vermelho", color: "#db7770", example: "Tomate, morango, maçã" },
  { id: "orange", label: "Amarelo / laranja", color: "#e9b45e", example: "Banana, cenoura, manga" },
  { id: "purple", label: "Roxo", color: "#a78abb", example: "Uva, berinjela, beterraba" },
  { id: "white", label: "Branco", color: "#d5c9b4", example: "Couve-flor, alho, aveia" },
];
export const AVATARS: Record<string, string> = {
  isabella: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces&auto=format",
  ana: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces&auto=format",
  lucas: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=faces&auto=format",
  maria: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&h=100&fit=crop&crop=faces&auto=format",
};
export function dateKey(date = new Date()) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
export function offsetDate(date: string, amount: number) { const d = new Date(`${date}T12:00:00`); d.setDate(d.getDate() + amount); return dateKey(d); }
export function number(value: number) { return new Intl.NumberFormat("pt-BR").format(value); }
export function sleepLabel(hours: number | null) { if (hours === null) return "Não registrado"; const mins = Math.round(hours * 60); return `${Math.floor(mins / 60)}h${mins % 60 ? ` ${String(mins % 60).padStart(2, "0")}min` : ""}`; }
export function calculateDay(day: Day, meals: Meal[], activities: Activity[], goal: number) {
  const completed = new Set(day.habits.filter(id => !id.startsWith("!")));
  if (meals.some(m => m.type === "Café da manhã")) completed.add("breakfast");
  if (meals.some(m => m.components.includes("fruit"))) completed.add("fruit");
  if (meals.some(m => m.components.includes("vegetable"))) completed.add("vegetables");
  const activityMinutes = activities.filter(a => a.type !== "Descanso").reduce((sum, a) => sum + a.duration, 0);
  if (activityMinutes > 0) completed.add("workout");
  if (day.waterMl >= goal) completed.add("water"); else completed.delete("water");
  if (day.sleepHours !== null && day.sleepHours >= 7) completed.add("sleep"); else completed.delete("sleep");
  for (const override of day.habits.filter(id => id.startsWith("!"))) completed.delete(override.slice(1));
  const missionCount = MISSIONS.filter(id => completed.has(id)).length;
  const points = HABITS.filter(h => completed.has(h.id)).reduce((sum, h) => sum + h.points, 0) + Math.min(meals.length, 4) * 3 + (day.checkIn ? 3 : 0) + (missionCount === 4 ? 50 : 0);
  const progress = Math.round(HABITS.filter(h => completed.has(h.id)).length / HABITS.length * 100);
  return { completed: [...completed], missionCount, points, progress, activityMinutes };
}
export function allChallenges(data: DashboardData): Challenge[] { return [...CHALLENGES, ...data.customChallenges]; }
export function challengeMetricProgress(metric: ChallengeMetricId, target: number, windowDays: number, data: DashboardData) {
  const history = data.history.filter(day => day.date >= offsetDate(data.day.date, -(windowDays - 1)) && day.date <= data.day.date);
  if (metric === "water") return Math.min(target, history.filter(d => d.waterMl >= data.profile.waterGoal).length);
  if (metric === "colors") return Math.min(target, new Set(history.flatMap(d => d.colors)).size);
  if (metric === "movement") return Math.min(target, history.reduce((sum, d) => sum + d.activityMinutes, 0));
  if (metric === "breakfast") return Math.min(target, history.filter(d => d.completed.includes("breakfast")).length);
  if (metric === "sleep") return Math.min(target, history.filter(d => d.completed.includes("sleep")).length);
  if (metric === "checkin") return Math.min(target, history.filter(d => d.checkIn).length);
  return 0;
}
export function challengeProgress(id: string, data: DashboardData) {
  const challenge = allChallenges(data).find(c => c.id === id);
  if (!challenge) return 0;
  return challengeMetricProgress(challenge.metric, challenge.target, challenge.windowDays, data);
}
export function challengeBonus(data: DashboardData) { return allChallenges(data).filter(c => data.profile.joinedChallenges.includes(c.id) && challengeProgress(c.id, data) >= c.target).reduce((sum, c) => sum + c.reward, 0); }
export function previewData(today: string = dateKey()): DashboardData {
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

  const day: Day = { date: today, habits: [], waterMl: 1500, sleepHours: 7.5, sleepQuality: 4, mood: null, energy: 60, stress: null, checkIn: false, note: "" };
  const meals: Meal[] = [
    { id: -1, type: "Café da manhã", components: ["protein", "fruit", "carbohydrate"], colors: ["orange", "white"], note: "Iogurte natural, banana e granola", createdAt: `${today}T08:00:00` },
    { id: -2, type: "Lanche", components: ["fruit", "fat"], colors: ["red"], note: "Maçã e castanhas", createdAt: `${today}T10:30:00` }
  ];
  const activities: Activity[] = [
    { id: -1, type: "Musculação", duration: 45, note: "Um tempo para cuidar de mim", createdAt: `${today}T07:00:00` }
  ];
  const weeklyXp = seedDays.filter(d => d.date >= offsetDate(today, -6)).reduce((sum, d) => sum + d.points, 0);
  const totalXp = 1000 + seedDays.reduce((sum, d) => sum + d.points, 0);
  return {
    profile: { id: "preview", name: "Isabella Costa", email: "", avatar: "isabella", waterGoal: goal, joinedChallenges: ["water-week", "colorful-plate"], completedChallenges: [], reminders: true, groupCode: DEFAULT_GROUP_CODE, registered: false },
    day,
    meals,
    activities,
    history: seedDays,
    customChallenges: [],
    totalXp,
    weeklyXp,
    streak: 6,
    hydrationStreak: 6,
    leaderboard: [
      { id: "ana", name: "Ana Beatriz", avatar: "ana", points: 420 },
      { id: "lucas", name: "Lucas Martins", avatar: "lucas", points: 395 },
      { id: "maria", name: "Mariana Silva", avatar: "maria", points: 380 },
      { id: "you", name: "Isabella Costa", avatar: "isabella", points: weeklyXp, isYou: true },
      { id: "pedro", name: "Pedro Santos", avatar: "pedro", points: 245 },
    ],
    group: { code: DEFAULT_GROUP_CODE, name: APP_NAME, category: "friends" }
  };
}
