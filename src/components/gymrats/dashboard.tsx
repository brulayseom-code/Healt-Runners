"use client";
import { ArrowRight, ArrowUpRight, Check, ChevronRight, Droplets, Flame, Heart, Leaf, MoreHorizontal, Plus, Sparkles, Target, Trophy, Users } from "lucide-react";
import { useGym } from "./context";
import { Avatar, AvatarStack, CheckBox, HabitIcon, Progress, Ring, SectionTitle, WaterGlass, XP } from "./ui";
import { calculateDay, CHALLENGES, challengeProgress, HABITS, MISSIONS, number, sleepLabel } from "@/lib/gymrats";

export function Hero() {
  const { data, openModal } = useGym();
  return <section className="hero-card"><img className="hero-image" src="/images/healthy-bowl.png" alt="Prato colorido com abacate, folhas, quinoa e vegetais frescos" fetchPriority="high" /><div className="hero-copy"><span className="hero-eyebrow"><Leaf size={13} /> BEM-ESTAR É UM ESTILO DE VIDA</span><h2>Pequenos hábitos.<br />Grandes mudanças.</h2><p>Não precisa ser perfeito.<br />Só precisa fazer sentido para você.</p><button className="button primary hero-button" onClick={() => openModal({ kind: "checkin" })}>{data.day.checkIn ? "Ver meu check-in" : "Fazer meu check-in"}<ArrowUpRight size={17} /></button></div><span className="hero-note"><span><Check size={12} /></span>100% no seu ritmo</span><span className="hero-sparkle"><Sparkles size={26} strokeWidth={1.2} /></span></section>;
}

export function DailyMission() {
  const { data, mutate, busy } = useGym();
  const stats = calculateDay(data.day, data.meals, data.activities, data.profile.waterGoal);
  const labels = ["Comer uma fruta", "Bater a meta de água", "Movimentar o corpo", "Colorir o prato"];
  return <section className="card mission-card"><div className="mission-heading"><h2><Target size={18} />Missão do dia</h2><XP points={50} /></div><p className="card-description">Seu próximo passo começa aqui.</p><div className="mission-list">{MISSIONS.map((id, i) => <button disabled={busy} key={id} className={`mission-item ${stats.completed.includes(id) ? "done" : ""}`} onClick={() => mutate({ action: "habit", habit: id, checked: !stats.completed.includes(id) }, stats.completed.includes(id) ? "Hábito atualizado." : "Mais um pequeno passo. Muito bem!")} aria-label={`${stats.completed.includes(id) ? "Desmarcar" : "Concluir"}: ${labels[i]}`}><CheckBox checked={stats.completed.includes(id)} /><span>{labels[i]}</span></button>)}</div><div className="mission-footer"><span><strong>{stats.missionCount} de 4</strong> concluídas</span><span>{stats.missionCount === 4 ? "Você conseguiu! 🎉" : "Você consegue!"}</span></div><div className="mission-segments">{MISSIONS.map((id, i) => <span key={id} className={i < stats.missionCount ? "filled" : ""} />)}</div></section>;
}

export function Pillars() {
  const { data, navigate, openModal } = useGym();
  const stats = calculateDay(data.day, data.meals, data.activities, data.profile.waterGoal);
  const nutrition = ["breakfast", "fruit", "vegetables"].filter(h => stats.completed.includes(h)).length;
  const pillars = [
    { name: "Nutrição", icon: "vegetables", color: "green", value: String(data.meals.length), unit: "refeições", caption: "Nutrir, não restringir", percent: nutrition / 3 * 100, action: () => navigate("nutrition") },
    { name: "Hidratação", icon: "water", color: "blue", value: number(data.day.waterMl), unit: "ml", caption: `Meta: ${number(data.profile.waterGoal)} ml`, percent: data.day.waterMl / data.profile.waterGoal * 100, action: () => navigate("hydration") },
    { name: "Movimento", icon: "workout", color: "orange", value: String(stats.activityMinutes), unit: "min", caption: "Seu corpo agradece", percent: stats.activityMinutes / 30 * 100, action: () => navigate("activity") },
    { name: "Sono", icon: "sleep", color: "purple", value: data.day.sleepHours === null ? "—" : sleepLabel(data.day.sleepHours).replace("min", ""), unit: "", caption: data.day.sleepHours === null ? "Como foi sua noite?" : "Descansar também é cuidar", percent: (data.day.sleepHours ?? 0) / 8 * 100, action: () => openModal({ kind: "sleep" }) },
    { name: "Bem-estar", icon: "wellbeing", color: "pink", value: data.day.checkIn ? data.day.mood ?? "Bem" : "Como você está?", unit: "", caption: data.day.checkIn ? `Energia em ${data.day.energy}%` : "Reserve um tempo para você", percent: data.day.checkIn ? 100 : 0, action: () => openModal({ kind: "checkin" }), small: true },
    { name: "Constância", icon: "streak", color: "yellow", value: String(data.streak), unit: "dias", caption: "Um hábito de cada vez", percent: data.streak / 7 * 100, action: () => navigate("progress") },
  ];
  return <section className="pillars-section"><div className="section-title"><h2>Seu dia, em equilíbrio</h2><span className="daily-progress"><Ring value={stats.progress} size={22} stroke={2.5} /><span>Seu progresso hoje: <strong>{stats.progress}%</strong></span></span></div><div className="pillars-grid">{pillars.map(p => <button className={`pillar-card ${p.color}`} key={p.name} onClick={p.action}><div className="pillar-top"><span className={`icon-tile ${p.color}`}><HabitIcon name={p.icon} size={18} /></span><ArrowUpRight size={13} className="pillar-arrow" /></div><span className="pillar-name">{p.name}</span><span className={`pillar-value ${p.small ? "small" : ""}`}>{p.value}<span>{p.unit}</span></span><span className="pillar-caption">{p.caption}</span><Progress value={p.percent} color={p.color} /></button>)}</div></section>;
}

export function Checklist() {
  const { data, mutate, busy } = useGym();
  const stats = calculateDay(data.day, data.meals, data.activities, data.profile.waterGoal);
  return <section className="card checklist-card"><div className="section-title"><div><h2>Pequenos passos para hoje</h2><p>Cada escolha conta. Celebre as suas.</p></div><span className="points-today"><Sparkles size={14} /><strong>{stats.points}</strong> XP hoje</span></div><div className="habit-list">{HABITS.map(habit => { const checked = stats.completed.includes(habit.id); return <button className={`habit-row ${checked ? "completed" : ""}`} key={habit.id} disabled={busy} onClick={() => mutate({ action: "habit", habit: habit.id, checked: !checked }, checked ? "Tudo bem mudar. Hábito atualizado." : "Hábito concluído. Um passo mais perto de você!")} role="checkbox" aria-checked={checked}><CheckBox checked={checked} /><span className="habit-label">{habit.label}</span><span className="habit-category">{habit.category}</span><span className="habit-points">+{habit.points} <span>XP</span></span></button>; })}</div><div className="checklist-footer"><span><Leaf size={13} />O importante não é fazer tudo. É continuar.</span><span>{stats.completed.filter(h => HABITS.some(x => x.id === h)).length}<span> / 6</span></span></div></section>;
}

export function HydrationCard({ large = false }: { large?: boolean }) {
  const { data, openModal, mutate, busy } = useGym();
  const percent = Math.round(data.day.waterMl / data.profile.waterGoal * 100);
  const remaining = Math.max(0, data.profile.waterGoal - data.day.waterMl);
  return <section className={`hydration-card ${large ? "large" : ""}`}><div className="section-title"><h2><Droplets size={18} />Um gole de cada vez</h2><button className="icon-button" onClick={() => openModal({ kind: "water" })} aria-label="Mais opções de hidratação"><MoreHorizontal size={20} /></button></div><p className="card-description">Uma pausa para cuidar de você.</p><div className="water-content"><WaterGlass percent={percent} /><div className="water-stats"><div className="water-number">{number(data.day.waterMl)}<span> ml</span></div><p>de {number(data.profile.waterGoal)} ml da sua meta</p><Progress value={percent} color="blue" /><span className="water-remaining">{remaining ? <>Faltam só <strong>{number(remaining)} ml.</strong><br />Você está indo bem!</> : <>Meta alcançada!<br /><strong>Seu cuidado faz a diferença.</strong></>}</span></div></div><div className="hydration-streak"><Flame size={14} /><span><strong>{data.hydrationStreak} dias</strong> de hidratação em dia</span></div><div className="water-actions"><button disabled={busy} onClick={() => mutate({ action: "water", amount: 250 }, "250 ml registrados. Um gole de cuidado!")}><Plus size={14} />250 ml</button><button disabled={busy} onClick={() => mutate({ action: "water", amount: 500 }, "500 ml registrados. Seu corpo agradece!")}><Plus size={14} />500 ml</button><button onClick={() => openModal({ kind: "water" })}>Outro <Plus size={14} /></button></div>{large && <button className="text-link water-undo" disabled={busy || data.day.waterMl === 0} onClick={() => mutate({ action: "water", amount: -250 }, "250 ml removidos do registro.")}>Remover 250 ml do registro</button>}</section>;
}

export function ChallengeCard({ challenge, compact = false }: { challenge: typeof CHALLENGES[number]; compact?: boolean }) {
  const { data, openModal } = useGym();
  const joined = data.profile.joinedChallenges.includes(challenge.id);
  const complete = data.profile.completedChallenges.includes(challenge.id);
  const progress = complete ? challenge.target : challengeProgress(challenge.id, data);
  return <button className={`challenge-card ${challenge.color} ${compact ? "compact" : ""}`} onClick={() => openModal({ kind: "challenge", id: challenge.id })}><div className="challenge-top"><span className={`challenge-icon ${challenge.color}`}><HabitIcon name={challenge.icon} size={compact ? 25 : 29} /></span><span className={`status-pill ${complete ? "complete" : ""}`}>{complete ? <><Check size={11} />Concluído</> : joined ? "Em andamento" : challenge.duration}</span></div><h3>{challenge.name}</h3><p>{challenge.description}</p><Progress value={progress / challenge.target * 100} color={challenge.color} /><div className="challenge-bottom"><span><strong>{progress}</strong> / {challenge.target} {challenge.unit}</span><XP points={challenge.reward} /></div>{!compact && <div className="challenge-people"><span><Users size={14} />{challenge.people} pessoas no desafio</span><span className="challenge-cta">{complete ? "Ver conquista" : joined ? "Continuar" : "Participar"}<ArrowUpRight size={15} /></span></div>}</button>;
}

export function RankingList({ compact = false }: { compact?: boolean }) {
  const { data } = useGym();
  const list = compact ? data.leaderboard.filter((l, i) => i < 3 || l.isYou) : data.leaderboard;
  return <div className={`ranking-list ${compact ? "compact" : ""}`}>{list.map(person => { const rank = data.leaderboard.findIndex(l => l.id === person.id) + 1; return <div key={person.id} className={`ranking-row ${person.isYou ? "is-you" : ""}`}><span className={`rank-position rank-${rank}`}>{rank < 4 ? <Trophy size={15} strokeWidth={1.7} /> : String(rank).padStart(2, "0")}</span><Avatar name={person.name} avatar={person.avatar} size={compact ? 31 : 42} /><div className="rank-name"><span>{person.name}{person.isYou && <small>você</small>}</span>{!compact && <small>{person.isYou ? "Cada pequeno passo conta" : "Construindo bons hábitos"}</small>}</div><strong>{number(person.points)}<small> XP</small></strong></div>; })}</div>;
}

export function Dashboard() {
  const { navigate, data, openModal } = useGym();
  return <div className="dashboard-sections"><div className="hero-grid"><Hero /><DailyMission /></div><Pillars /><div className="daily-grid"><Checklist /><HydrationCard /></div><div className="community-grid"><section className="card challenges-preview"><SectionTitle title="Juntos, o desafio fica melhor" subtitle="Um incentivo a mais para a sua rotina." action={() => navigate("challenges")} /><div className="challenge-preview-grid">{CHALLENGES.slice(0, 2).map(c => <ChallengeCard challenge={c} compact key={c.id} />)}</div><div className="challenge-preview-footer"><AvatarStack /><span>Pequenos hábitos, uma comunidade inteira.</span><Heart size={15} /></div></section><section className="card ranking-preview"><div className="section-title"><div><h2><Trophy size={17} className="gold-icon" />O grupo tá on!</h2><p>Ranking dos últimos 7 dias</p></div><button className="icon-button" aria-label="Abrir ranking completo" onClick={() => navigate("ranking")}><ArrowUpRight size={18} /></button></div><RankingList compact /><button className="ranking-group" onClick={() => openModal({ kind: "invite" })}><Users size={14} /><span>{data.group.name}</span><ChevronRight size={15} /></button></section></div><div className="dashboard-bottom-note"><Leaf size={15} /><span>Mais equilíbrio. Mais constância. <strong>Mais você.</strong></span><button onClick={() => navigate("progress")}>Acompanhar minha evolução<ArrowRight size={14} /></button></div></div>;
}
