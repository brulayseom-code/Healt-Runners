import { type DashboardData, challengeProgress } from "./gymrats";
export function getAchievements(data: DashboardData) {
  const activeDays = data.history.filter(d => d.completed.includes("workout")).length;
  return [
    { id: "first", name: "Primeiro passo", description: "Todo caminho começa com uma escolha. Complete seu primeiro hábito.", icon: "movement", color: "green", current: data.history.some(d => d.progress > 0) ? 1 : 0, target: 1, unit: "hábito" },
    { id: "water", name: "Hidratação em dia", description: "Atinja sua meta de água em 7 dias ou conclua o desafio de hidratação.", icon: "water", color: "blue", current: data.profile.completedChallenges.includes("water-week") ? 7 : challengeProgress("water-week", data), target: 7, unit: "dias" },
    { id: "color", name: "Prato colorido", description: "Explore os 5 grupos de cores nas suas refeições durante a semana.", icon: "vegetables", color: "green", current: data.profile.completedChallenges.includes("colorful-plate") ? 5 : challengeProgress("colorful-plate", data), target: 5, unit: "cores" },
    { id: "streak", name: "Na constância", description: "Complete ao menos metade dos seus hábitos por 7 dias seguidos.", icon: "streak", color: "orange", current: Math.min(7, data.streak), target: 7, unit: "dias seguidos" },
    { id: "starter", name: "Runner iniciante", description: "Movimente seu corpo em 10 dias nos últimos 30 dias. No seu ritmo!", icon: "workout", color: "purple", current: Math.min(10, activeDays), target: 10, unit: "dias ativos" },
    { id: "master", name: "Runner Master", description: "Some 5.000 HealthPoints cuidando de você e celebrando cada pequeno passo.", icon: "trophy", color: "yellow", current: Math.min(5000, data.totalXp), target: 5000, unit: "HealthPoints" },
  ].map(a => ({ ...a, earned: a.current >= a.target }));
}
