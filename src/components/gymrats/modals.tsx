"use client";
import { useRef, useState, type FormEvent } from "react";
import { ArrowRight, ArrowUpRight, Award, Bell, Check, CheckCheck, ChevronRight, Clock3, Copy, Droplets, Dumbbell, Flame, Heart, Info, Leaf, Link, LoaderCircle, LogOut, Minus, Moon, Plus, Send, ShieldCheck, Sparkles, Star, Target, Trash2, Trophy, Users } from "lucide-react";
import { useGym, type ModalState } from "./context";
import { AvatarStack, CheckBox, HabitIcon, Modal, Progress, WaterGlass, XP } from "./ui";
import { allChallenges, calculateDay, CHALLENGES, CHALLENGE_METRICS, challengeProgress, challengeView, COMPONENTS, FOOD_COLORS, metricReward, metricWindow, number, type ChallengeMetricId } from "@/lib/gymrats";
import { getAchievements } from "@/lib/achievements";
import { DEFAULT_GROUP_CODE } from "@/lib/brand";
import { ProfilePhotoEditor } from "./profile-photo";

type ActiveModal = NonNullable<ModalState>;
function SubmitButton({ label = "Salvar registro", icon = true }: { label?: string; icon?: boolean }) { const { busy } = useGym(); return <button type="submit" className="button primary full-width" disabled={busy}>{busy ? <><LoaderCircle size={16} className="spin" />Salvando...</> : <>{icon && <Check size={16} />}{label}</>}</button>; }

function WaterForm({ close }: { close: () => void }) {
  const { data, mutate, busy } = useGym();
  const [amount, setAmount] = useState(250);
  async function submit(e: FormEvent) { e.preventDefault(); if (await mutate({ action: "water", amount }, `${number(amount)} ml registrados. Um gole de cada vez!`)) close(); }
  return <form className="modal-form" onSubmit={submit}><div className="water-modal-summary"><WaterGlass percent={Math.round(data.day.waterMl / data.profile.waterGoal * 100)} /><div><strong>{number(data.day.waterMl)} <small>ml</small></strong><p>de {number(data.profile.waterGoal)} ml da sua meta</p><span className="label-pill blue"><Flame size={12} />{data.hydrationStreak} dias de constância</span></div></div><label className="field-label">Quanto você bebeu?</label><div className="amount-options">{[150, 250, 350, 500, 750].map(n => <button type="button" className={amount === n ? "selected" : ""} onClick={() => setAmount(n)} key={n}>{n}<small>ml</small></button>)}</div><div className="form-field"><label htmlFor="water-amount">Ou informe outra quantidade</label><div className="input-unit"><input id="water-amount" type="number" min={50} max={2000} step={1} value={amount || ""} onChange={e => setAmount(Number(e.target.value))} required /><span>ml</span></div></div><div className="form-reward"><Droplets size={17} /><span>Após registrar: <strong>{number(data.day.waterMl + amount)} ml</strong> de cuidado hoje.</span></div><SubmitButton label="Registrar minha água" /><button type="button" className="text-link centered" disabled={busy || data.day.waterMl === 0} onClick={async () => { if (await mutate({ action: "water", amount: -250 }, "250 ml removidos do registro.")) close(); }}><Minus size={14} />Corrigir registro: remover 250 ml</button></form>;
}

function MealForm({ close, initialType }: { close: () => void; initialType?: string }) {
  const { mutate } = useGym();
  const [type, setType] = useState(initialType || "Café da manhã");
  const [components, setComponents] = useState<string[]>([]);
  const [colors, setColors] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  function toggle(id: string, list: string[], setter: (v: string[]) => void) { setter(list.includes(id) ? list.filter(x => x !== id) : [...list, id]); }
  async function submit(e: FormEvent) { e.preventDefault(); if (!components.length) { setError("Selecione pelo menos um componente da sua refeição."); return; } if (await mutate({ action: "meal", type, components, colors, note }, "Refeição registrada. Mais qualidade para o seu dia!")) close(); }
  return <form className="modal-form" onSubmit={submit}><div className="meal-type-options">{[{ name: "Café da manhã", emoji: "🍳" }, { name: "Almoço", emoji: "🥗" }, { name: "Lanche", emoji: "🥪" }, { name: "Jantar", emoji: "🍲" }].map(t => <button type="button" className={type === t.name ? "selected" : ""} key={t.name} onClick={() => setType(t.name)}><span>{t.emoji}</span>{t.name}</button>)}</div><div><label className="field-label">O que fez parte da sua refeição?</label><p className="field-help">Sem pesar alimentos. Sem contar calorias.</p></div><div className="components-options">{COMPONENTS.map(c => <label key={c.id} className={components.includes(c.id) ? "selected" : ""}><input type="checkbox" checked={components.includes(c.id)} onChange={() => { toggle(c.id, components, setComponents); setError(""); }} /><span>{c.emoji}</span><span>{c.label}</span><CheckBox checked={components.includes(c.id)} /></label>)}</div>{error && <p className="form-error" role="alert">{error}</p>}<div><label className="field-label">Quais cores apareceram no prato? <small>opcional</small></label><div className="color-options">{FOOD_COLORS.map(c => <button type="button" key={c.id} className={colors.includes(c.id) ? "selected" : ""} onClick={() => toggle(c.id, colors, setColors)} title={c.example}><span style={{ backgroundColor: c.color }}>{colors.includes(c.id) && <Check size={17} />}</span><small>{c.label}</small></button>)}</div></div><div className="form-field"><label htmlFor="meal-note">Quer contar um pouco mais? <span>opcional</span></label><textarea id="meal-note" maxLength={400} rows={2} value={note} onChange={e => setNote(e.target.value)} placeholder="Ex.: arroz, feijão, frango e salada colorida" /></div><div className="form-reward"><Sparkles size={15} /><span>+3 XP por refeição, até 4 registros pontuados por dia.</span></div><SubmitButton label="Salvar minha refeição" /></form>;
}

function ActivityForm({ close, initialType }: { close: () => void; initialType?: string }) {
  const { mutate } = useGym();
  const [type, setType] = useState(initialType || "Musculação");
  const [duration, setDuration] = useState(45);
  const [note, setNote] = useState("");
  async function submit(e: FormEvent) { e.preventDefault(); if (await mutate({ action: "activity", type, duration, note }, type === "Descanso" ? "Descanso registrado. Recuperar também é evoluir." : "Movimento registrado. Seu corpo agradece!")) close(); }
  return <form className="modal-form" onSubmit={submit}><label className="field-label">Qual foi o seu movimento?</label><div className="activity-options">{["Musculação", "Cardio", "Corrida", "Caminhada", "Esporte", "Yoga", "Dança", "Descanso"].map(t => <button key={t} type="button" className={type === t ? "selected" : ""} onClick={() => setType(t)}>{t === "Descanso" ? <Leaf size={17} /> : <Dumbbell size={17} />}{t}</button>)}</div>{type !== "Descanso" ? <div className="form-field"><label htmlFor="activity-duration">Por quanto tempo?</label><div className="duration-control"><button type="button" className="icon-button" onClick={() => setDuration(Math.max(1, duration - 5))} aria-label="Diminuir cinco minutos"><Minus size={18} /></button><input id="activity-duration" type="number" value={duration || ""} onChange={e => setDuration(Number(e.target.value))} min={1} max={600} required /><span>minutos</span><button type="button" className="icon-button" onClick={() => setDuration(Math.min(600, duration + 5))} aria-label="Adicionar cinco minutos"><Plus size={18} /></button></div></div> : <div className="soft-notice"><Leaf size={18} />Descansar é parte do processo. Respeite seu tempo de recuperação.</div>}<div className="form-field"><label htmlFor="activity-note">Como foi? <span>opcional</span></label><textarea id="activity-note" rows={3} value={note} onChange={e => setNote(e.target.value)} maxLength={400} placeholder="Um tempo para mim. No meu ritmo." /></div><div className="form-reward"><Sparkles size={15} /><span>{type === "Descanso" ? "O descanso entra no seu diário, sem cobrança de pontos." : "+15 XP pelo primeiro movimento do dia. Cada minuto conta!"}</span></div><SubmitButton label={type === "Descanso" ? "Registrar meu descanso" : "Registrar meu movimento"} /></form>;
}

function SleepForm({ close }: { close: () => void }) {
  const { data, mutate } = useGym();
  const [hours, setHours] = useState(data.day.sleepHours ?? 7.5);
  const [quality, setQuality] = useState(data.day.sleepQuality || 4);
  async function submit(e: FormEvent) { e.preventDefault(); if (await mutate({ action: "sleep", hours, quality }, "Sono registrado. Descansar também é cuidar de você.")) close(); }
  return <form className="modal-form" onSubmit={submit}><div className="sleep-modal-art"><Moon size={47} strokeWidth={1.2} /><Star size={13} /><Sparkles size={22} /></div><div className="form-field"><label htmlFor="sleep-hours">Quantas horas você dormiu?</label><div className="input-unit"><input type="number" id="sleep-hours" step={0.25} min={0} max={16} value={hours} onChange={e => setHours(Number(e.target.value))} required /><span>horas</span></div><small>Exemplo: 7,5 horas equivale a 7 horas e 30 minutos.</small></div><div className="sleep-hour-options">{[{ value: 4.5, label: "Menos de 5h" }, { value: 5.5, label: "5–6h" }, { value: 6.5, label: "6–7h" }, { value: 8, label: "7–9h" }, { value: 9.5, label: "Mais de 9h" }].map(o => <button type="button" key={o.value} className={hours === o.value ? "selected" : ""} onClick={() => setHours(o.value)}>{o.label}</button>)}</div><div className="quality-field"><label className="field-label">E como foi a qualidade do seu sono?</label><div className="star-options">{[1, 2, 3, 4, 5].map(n => <button type="button" key={n} className={n <= quality ? "selected" : ""} onClick={() => setQuality(n)} aria-label={`${n} ${n === 1 ? "estrela" : "estrelas"}`}><Star size={31} fill={n <= quality ? "currentColor" : "none"} strokeWidth={1.4} /></button>)}</div><span className="field-help">{["", "Foi uma noite difícil", "Poderia ter sido melhor", "Foi uma noite razoável", "Dormi bem", "Acordei renovado(a)"][quality]}</span></div><div className="form-reward"><Moon size={15} /><span>+10 XP ao registrar pelo menos 7 horas de sono.</span></div><SubmitButton label="Salvar meu sono" /></form>;
}

function CheckinForm({ close, initialMood }: { close: () => void; initialMood?: string }) {
  const { data, mutate } = useGym();
  const [mood, setMood] = useState(initialMood || data.day.mood || "Bem");
  const [energy, setEnergy] = useState(data.day.energy);
  const [stress, setStress] = useState(data.day.stress || "Baixo");
  const [note, setNote] = useState(data.day.note);
  async function submit(e: FormEvent) { e.preventDefault(); if (await mutate({ action: "checkin", mood, energy, stress, note }, "Check-in salvo. Obrigado por reservar esse tempo para você.")) close(); }
  return <form className="modal-form" onSubmit={submit}><label className="field-label">Como você está hoje?</label><div className="mood-options">{[{ emoji: "😄", name: "Muito bem" }, { emoji: "🙂", name: "Bem" }, { emoji: "😐", name: "Normal" }, { emoji: "🙁", name: "Cansado" }, { emoji: "😞", name: "Muito mal" }].map(m => <button key={m.name} type="button" className={mood === m.name ? "selected" : ""} onClick={() => setMood(m.name)}><span>{m.emoji}</span><small>{m.name}</small></button>)}</div><div className="energy-field"><div><label className="field-label" htmlFor="energy">Seu nível de energia</label><strong>{energy}%</strong></div><input id="energy" type="range" min={20} max={100} step={10} value={energy} onChange={e => setEnergy(Number(e.target.value))} /><div className="range-labels"><span>Preciso de uma pausa</span><span>Pronto(a) para o dia</span></div></div><label className="field-label">E o estresse, como está?</label><div className="stress-options">{[{ name: "Baixo", color: "green" }, { name: "Moderado", color: "yellow" }, { name: "Alto", color: "pink" }].map(s => <button type="button" key={s.name} className={`${s.color} ${stress === s.name ? "selected" : ""}`} onClick={() => setStress(s.name)}><span />{s.name}{stress === s.name && <Check size={13} />}</button>)}</div><div className="form-field"><label htmlFor="checkin-note">Algo que você quer guardar sobre hoje? <span>opcional</span></label><textarea id="checkin-note" value={note} onChange={e => setNote(e.target.value)} rows={3} maxLength={500} placeholder="Este é um espaço de acolhimento, não de cobrança." /></div><div className="form-reward"><Heart size={15} /><span>+3 XP por olhar para você. Uma vez por dia, com carinho.</span></div><SubmitButton label={data.day.checkIn ? "Atualizar meu check-in" : "Concluir meu check-in"} /><p className="privacy-note"><ShieldCheck size={12} />Seu humor e suas anotações não aparecem no ranking.</p></form>;
}

function ChallengeDetail({ id, close }: { id?: string; close: () => void }) {
  const { data, mutate, navigate, busy, openModal } = useGym();
  const challenge = allChallenges(data).find(c => c.id === id);
  if (!challenge) return null;
  const joined = data.profile.joinedChallenges.includes(challenge.id);
  const complete = data.profile.completedChallenges.includes(challenge.id);
  const progress = complete ? challenge.target : challengeProgress(challenge.id, data);
  return <div className="challenge-detail"><div className={`challenge-detail-hero ${challenge.color}`}><span className={`challenge-icon ${challenge.color}`}><HabitIcon name={challenge.icon} size={40} /></span><XP points={challenge.reward} /><span className="label-pill">{challenge.custom ? "Desafio pessoal" : challenge.duration}</span></div><p>{challenge.long}</p><div className="challenge-detail-progress"><div><strong>Seu progresso</strong><span>{progress} / {challenge.target} {challenge.unit}</span></div><Progress value={progress / challenge.target * 100} color={challenge.color} /></div><div className="challenge-rules"><span><CheckCheck size={16} />Seus registros dos últimos {challenge.windowDays} dias já contam.</span><span><Sparkles size={16} />Recompensa única de {challenge.reward} HealthPoints ao concluir.</span><span><Heart size={16} />Sem pressão. Cuidar de você é o que importa.</span></div>{complete ? <div className="challenge-complete"><Trophy size={24} /><div><strong>Essa conquista é sua!</strong><span>Os {challenge.reward} XP já fazem parte da sua evolução.</span></div></div> : joined ? <><button className="button primary full-width" onClick={() => { navigate(challengeView(challenge.metric)); close(); }}>Continuar meu desafio<ArrowRight size={16} /></button><button className="text-link centered muted" disabled={busy} onClick={async () => { if (await mutate({ action: "challenge", id: challenge.id, join: false }, "Você saiu do desafio. Seus hábitos continuam com você.")) close(); }}>Sair deste desafio</button></> : <button className="button primary full-width" disabled={busy} onClick={async () => { if (await mutate({ action: "challenge", id: challenge.id, join: true }, "Você está no desafio! Vamos dar o próximo passo juntos.")) close(); }}><Plus size={16} />{busy ? "Entrando..." : "Quero participar"}</button>}{challenge.custom && <button className="text-link centered delete-challenge-link" disabled={busy} onClick={() => openModal({ kind: "confirm", title: "Excluir este desafio?", description: `O desafio "${challenge.name}" será removido e os pontos ganhos com ele serão recalculados. Esta ação não pode ser desfeita.`, action: { action: "delete-challenge", id: challenge.id }, confirmLabel: "Sim, excluir desafio", cancelLabel: "Manter desafio", successMessage: "Desafio excluído." })}><Trash2 size={13} />Excluir este desafio</button>}</div>;
}

function CreateChallengeForm({ close }: { close: () => void }) {
  const { data, mutate } = useGym();
  const [metric, setMetric] = useState<ChallengeMetricId>("water");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const selected = CHALLENGE_METRICS.find(m => m.id === metric)!;
  const [target, setTarget] = useState(selected.defaultTarget);
  const [error, setError] = useState("");
  function pickMetric(id: ChallengeMetricId) { const def = CHALLENGE_METRICS.find(m => m.id === id)!; setMetric(id); setTarget(def.defaultTarget); setError(""); }
  const windowDays = metricWindow(metric, target);
  const reward = metricReward(metric, target);
  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Dê um nome para o seu desafio."); return; }
    if (!Number.isInteger(target) || target < 1 || target > selected.maxTarget) { setError(`Escolha uma meta entre 1 e ${selected.maxTarget} ${selected.unit}.`); return; }
    if (await mutate({ action: "create-challenge", name, description, metric, target }, "Desafio criado! Você já está participando dele.")) close();
  }
  return <form className="modal-form" onSubmit={submit}>
    <div className="form-field"><label htmlFor="challenge-name">Nome do desafio</label><input id="challenge-name" value={name} onChange={e => { setName(e.target.value); setError(""); }} maxLength={60} placeholder="Ex.: Semana sem esquecer a água" required autoFocus /></div>
    <div><label className="field-label">O que você quer acompanhar?</label><div className="challenge-metric-options">{CHALLENGE_METRICS.map(m => <button type="button" key={m.id} className={`${m.color} ${metric === m.id ? "selected" : ""}`} onClick={() => pickMetric(m.id)}><span className={`challenge-metric-icon ${m.color}`}><HabitIcon name={m.icon} size={19} /></span><span className="challenge-metric-label">{m.label}</span>{metric === m.id && <Check size={15} />}</button>)}</div></div>
    <div className="form-field"><label htmlFor="challenge-target">Sua meta <span>({selected.unit})</span></label><div className="duration-control"><button type="button" className="icon-button" onClick={() => setTarget(Math.max(1, target - 1))} aria-label="Diminuir meta"><Minus size={18} /></button><input id="challenge-target" type="number" min={1} max={selected.maxTarget} value={target || ""} onChange={e => { setTarget(Number(e.target.value)); setError(""); }} required /><span>{selected.unit}</span><button type="button" className="icon-button" onClick={() => setTarget(Math.min(selected.maxTarget, target + (metric === "movement" ? 10 : 1)))} aria-label="Aumentar meta"><Plus size={18} /></button></div></div>
    <div className="form-field"><label htmlFor="challenge-desc">Uma motivação <span>opcional</span></label><textarea id="challenge-desc" value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={200} placeholder="Por que esse desafio é importante para você?" /></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="form-reward"><Sparkles size={15} /><span>Acompanha seus registros dos últimos <strong>{windowDays} dias</strong> · Recompensa de <strong>{reward} HealthPoints</strong> ao concluir.</span></div>
    <SubmitButton label="Criar desafio" />
    <p className="privacy-note"><Info size={12} />Desafios pessoais ajudam a manter o foco. Eles aparecem só para você.</p>
  </form>;
}

function InviteContent() {
  const { data, notify, openModal } = useGym();
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const inviteUrl = typeof window !== "undefined" ? `${window.location.origin}/?invite=${data.group.code}` : "";
  async function copy() { try { await navigator.clipboard.writeText(inviteUrl); setCopied(true); notify("Convite copiado! Agora é só compartilhar com seus amigos."); } catch { inputRef.current?.select(); notify("Selecione e copie o link do convite.", "error"); } }
  return <div className="invite-content"><div className="invite-art"><Users size={40} strokeWidth={1.4} /><Sparkles size={23} /></div><h3>O cuidado fica melhor com companhia.</h3><p>Convide alguém para o <strong>{data.group.name}</strong>. Vocês poderão acompanhar seus pontos e evoluir juntos.</p><div className="invite-link"><Link size={17} /><input ref={inputRef} readOnly value={inviteUrl} aria-label="Link do convite para o grupo" onFocus={e => e.target.select()} /><button className="icon-button" aria-label="Copiar convite" onClick={copy}>{copied ? <Check size={18} /> : <Copy size={18} />}</button></div><button className="button primary full-width" onClick={copy}>{copied ? <Check size={16} /> : <Copy size={16} />}{copied ? "Link copiado!" : "Copiar link do convite"}</button><div className="invite-code"><span>Ou compartilhe o código do grupo</span><strong>{data.group.code}</strong></div><button className="text-link centered" onClick={() => openModal({ kind: "group" })}>Criar meu próprio grupo<ArrowUpRight size={15} /></button><p className="privacy-note"><ShieldCheck size={12} />Apenas nome e pontuação aparecem no ranking do grupo.</p></div>;
}

function GroupForm({ close, code }: { close: () => void; code?: string }) {
  const { data, mutate, openModal } = useGym();
  const [mode, setMode] = useState(code ? "join" : "create");
  const [name, setName] = useState("");
  const [category, setCategory] = useState("friends");
  const [joinCode, setJoinCode] = useState(code || "");
  async function submit(e: FormEvent) { e.preventDefault(); const success = await mutate(mode === "create" ? { action: "create-group", name, category } : { action: "join-group", code: joinCode.trim() }, mode === "create" ? "Seu grupo foi criado. Que tal convidar a primeira pessoa?" : "Você entrou no grupo. Juntos, vamos mais longe!"); if (success) { if (mode === "create") openModal({ kind: "invite" }); else close(); } }
  return <form className="modal-form" onSubmit={submit}><div className="segmented-control full-width"><button type="button" className={mode === "create" ? "active" : ""} onClick={() => setMode("create")}>Criar um grupo</button><button type="button" className={mode === "join" ? "active" : ""} onClick={() => setMode("join")}>Entrar com código</button></div>{mode === "create" ? <><div className="form-field"><label htmlFor="group-name">Como vai se chamar o seu grupo?</label><input id="group-name" placeholder="Ex.: Galera do bem-estar" value={name} onChange={e => setName(e.target.value)} maxLength={60} minLength={2} required autoFocus /></div><label className="field-label">Quem vai participar?</label><div className="group-type-options">{[{ id: "friends", name: "Amigos", emoji: "🤝" }, { id: "university", name: "Universidade", emoji: "🎓" }, { id: "work", name: "Trabalho", emoji: "💼" }].map(t => <button type="button" className={category === t.id ? "selected" : ""} key={t.id} onClick={() => setCategory(t.id)}><span>{t.emoji}</span>{t.name}</button>)}</div></> : <div className="form-field"><label htmlFor="group-code">Código do grupo</label><input id="group-code" placeholder={`Ex.: ${DEFAULT_GROUP_CODE}`} value={joinCode} onChange={e => setJoinCode(e.target.value.toUpperCase())} required maxLength={40} autoFocus className="code-input" /><small>Peça o código para quem convidou você.</small></div>}<div className="soft-notice"><Info size={17} /><span>Você participa de um grupo por vez. Ao continuar, sairá de <strong>{data.group.name}</strong>. Seus pontos e registros são mantidos.</span></div><SubmitButton label={mode === "create" ? "Criar meu grupo" : "Entrar no grupo"} /></form>;
}

function Notifications({ close }: { close: () => void }) {
  const { data, openModal, navigate } = useGym();
  const remaining = Math.max(0, data.profile.waterGoal - data.day.waterMl);
  const stats = calculateDay(data.day, data.meals, data.activities, data.profile.waterGoal);
  return <div className="notifications-list">{remaining > 0 && <button onClick={() => openModal({ kind: "water" })}><span className="icon-tile blue"><Droplets size={20} /></span><span><strong>Que tal uma pausa para a água?</strong><p>Faltam {number(remaining)} ml para a sua meta de hoje.</p><small>Um gole de cada vez</small></span><ChevronRight size={17} /></button>}{!data.day.checkIn && <button onClick={() => openModal({ kind: "checkin" })}><span className="icon-tile pink"><Heart size={20} /></span><span><strong>Um minutinho para você</strong><p>Como você está se sentindo hoje? Seu check-in está esperando.</p><small>Seu bem-estar importa</small></span><ChevronRight size={17} /></button>}<button onClick={() => { navigate("progress"); close(); }}><span className="icon-tile green"><Leaf size={20} /></span><span><strong>{stats.progress}% dos hábitos já estão no seu dia</strong><p>Cada escolha importa. Você já somou {stats.points} XP hoje.</p><small>Comemore os pequenos passos</small></span><ChevronRight size={17} /></button><button onClick={() => { navigate("challenges"); close(); }}><span className="icon-tile yellow"><Target size={20} /></span><span><strong>Seu próximo desafio está aqui</strong><p>Explore novas formas de cuidar de você e desbloqueie conquistas.</p><small>No seu ritmo, sempre</small></span><ChevronRight size={17} /></button><div className="soft-notice"><Bell size={15} />Os lembretes aparecem apenas dentro do aplicativo.</div></div>;
}

function AchievementDetail({ id }: { id?: string }) {
  const { data } = useGym();
  const achievement = getAchievements(data).find(a => a.id === id);
  if (!achievement) return null;
  return <div className={`achievement-detail ${achievement.earned ? "earned" : ""}`}><span className={`medal ${achievement.color}`}><HabitIcon name={achievement.icon} size={52} /></span><span className={`label-pill ${achievement.earned ? "green" : ""}`}>{achievement.earned ? "CONQUISTA DESBLOQUEADA" : "SEU PRÓXIMO PASSO"}</span><h3>{achievement.name}</h3><p>{achievement.description}</p><Progress value={achievement.current / achievement.target * 100} color={achievement.color} /><strong>{number(achievement.current)} / {number(achievement.target)} {achievement.unit}</strong><div className="soft-notice"><Heart size={16} />{achievement.earned ? "Essa conquista conta uma parte da sua história. Celebre!" : "Não existe prazo para cuidar de você. Continue no seu ritmo."}</div></div>;
}

function AccountForm({ close }: { close: () => void }) {
  const { data, auth, busy, openModal } = useGym();
  const registered = data.profile.registered;
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState(data.profile.name === "Isabella Costa" ? "" : data.profile.name);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (registered) {
    return <div className="account-panel">
      <div className="account-status"><span className="icon-tile green"><ShieldCheck size={23} /></span><div><strong>Conta ativa</strong><p>{data.profile.email}</p></div></div>
      <div className="soft-notice"><Info size={16} /><span>Seus dados estão salvos nesta conta. Entre com o mesmo e-mail e senha em qualquer aparelho para continuar de onde parou.</span></div>
      <button className="button secondary full-width" disabled={busy} onClick={() => openModal({ kind: "confirm", title: "Sair da conta?", description: "Você vai sair da sua conta neste aparelho. Seus dados continuam salvos e voltam quando você entrar de novo. O app abrirá um perfil visitante.", action: { action: "auth", authAction: "logout" }, confirmLabel: "Sim, sair da conta", cancelLabel: "Continuar conectado", tone: "neutral", successMessage: "Você saiu da conta. Até breve!" })}><LogOut size={16} />Sair da conta</button>
    </div>;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (mode === "signup" && !name.trim()) { setError("Informe seu nome."); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Informe um e-mail válido."); return; }
    if (mode === "signup" && password.length < 6) { setError("Crie uma senha com pelo menos 6 caracteres."); return; }
    if (!password) { setError("Informe sua senha."); return; }
    const result = await auth(
      mode === "signup" ? { action: "signup", name: name.trim(), email: email.trim(), password } : { action: "login", email: email.trim(), password },
      mode === "signup" ? "Conta criada! Seus dados agora acompanham você em qualquer aparelho." : "Bem-vinda de volta! Seus dados foram carregados."
    );
    if (result.ok) close();
    else setError(result.error || "Não foi possível concluir agora.");
  }

  return <form className="modal-form" onSubmit={submit}>
    <div className="segmented-control full-width"><button type="button" className={mode === "signup" ? "active" : ""} onClick={() => { setMode("signup"); setError(""); }}>Criar conta</button><button type="button" className={mode === "login" ? "active" : ""} onClick={() => { setMode("login"); setError(""); }}>Entrar</button></div>
    <div className="soft-notice"><Info size={16} /><span>{mode === "signup" ? "Crie uma conta para salvar seus registros e acessá-los em outros aparelhos. Seus dados atuais serão mantidos." : "Entre com seu e-mail e senha para carregar seus dados neste aparelho."}</span></div>
    {mode === "signup" && <div className="form-field"><label htmlFor="account-name">Seu nome</label><input id="account-name" value={name} onChange={e => setName(e.target.value)} maxLength={80} autoComplete="name" placeholder="Como podemos chamar você?" /></div>}
    <div className="form-field"><label htmlFor="account-email">E-mail</label><input id="account-email" type="email" value={email} onChange={e => setEmail(e.target.value)} maxLength={150} autoComplete="email" placeholder="voce@exemplo.com" required /></div>
    <div className="form-field"><label htmlFor="account-password">Senha</label><input id="account-password" type="password" value={password} onChange={e => setPassword(e.target.value)} minLength={6} maxLength={128} autoComplete={mode === "signup" ? "new-password" : "current-password"} placeholder={mode === "signup" ? "Mínimo de 6 caracteres" : "Sua senha"} required /></div>
    {error && <p className="form-error" role="alert">{error}</p>}
    <SubmitButton label={mode === "signup" ? "Criar minha conta" : "Entrar na minha conta"} icon={false} />
    <p className="privacy-note"><ShieldCheck size={12} />Guardamos sua senha de forma criptografada. Seu e-mail não aparece no ranking.</p>
  </form>;
}

function ConfirmContent({ modal, close }: { modal: ActiveModal; close: () => void }) {
  const { mutate, auth, busy } = useGym();
  const neutral = modal.tone === "neutral";
  const isAuth = modal.action?.action === "auth";
  const defaultMessage = modal.action?.action === "reset-data" ? "Uma nova jornada começa agora. Estamos com você!" : "Registro excluído e progresso atualizado.";
  async function confirm() {
    if (!modal.action) return;
    if (isAuth) { const r = await auth({ action: modal.action.authAction }, modal.successMessage ?? "Pronto!"); if (r.ok) close(); }
    else if (await mutate(modal.action, modal.successMessage ?? defaultMessage)) close();
  }
  return <div className="confirm-content"><span className={`icon-tile ${neutral ? "green" : "pink"}`}>{neutral ? <LogOut size={24} /> : <Trash2 size={25} />}</span><p>{modal.description}</p><div className="confirm-actions"><button className="button secondary" onClick={close}>{modal.cancelLabel ?? "Manter meus registros"}</button><button className={neutral ? "button primary" : "button danger"} disabled={busy} onClick={confirm}>{busy ? "Aguarde..." : (modal.confirmLabel ?? "Sim, excluir")}</button></div></div>;
}

export function AppModals({ modal, close }: { modal: ModalState; close: () => void }) {
  if (!modal) return null;
  const titles: Record<ActiveModal["kind"], [string, string]> = {
    photo: ["Sua foto, do seu jeito", "Escolha uma imagem para deixar o perfil com a sua cara."],
    water: ["Um gole de cuidado", "Mantenha a hidratação em dia, no seu ritmo."],
    meal: ["Como foi sua refeição?", "Vamos valorizar o que faz parte do seu prato."],
    activity: ["Seu corpo em movimento", "Todo movimento é uma forma de cuidar de você."],
    sleep: ["Uma pausa para recarregar", "Conte como foi o seu descanso."],
    checkin: ["Um momento só seu", "Respire fundo. Como você está, de verdade?"],
    challenge: ["Seu desafio", "Pequenos compromissos. Grandes possibilidades."],
    "create-challenge": ["Crie o seu desafio", "Defina uma meta que faça sentido para a sua rotina."],
    account: ["Sua conta", "Acesse seus dados em qualquer aparelho."],
    invite: ["Juntos, vamos mais longe", "Mais companhia, mais incentivo, mais bem-estar."],
    group: ["Encontre a sua turma", "Compartilhe a jornada, não a cobrança."],
    notifications: ["Um incentivo para o seu dia", "Lembretes leves para continuar cuidando de você."],
    achievement: ["Sua evolução merece ser celebrada", "Cada conquista carrega um pouco do seu cuidado."],
    confirm: [modal.title || "Excluir este registro?", "Esta ação não pode ser desfeita."],
  };
  const [title, subtitle] = titles[modal.kind];
  return <Modal key={`${modal.kind}-${modal.id || ""}`} title={title} subtitle={subtitle} onClose={close} className={modal.kind === "meal" ? "meal-modal" : ""}>{modal.kind === "photo" && <ProfilePhotoEditor close={close} />}{modal.kind === "water" && <WaterForm close={close} />}{modal.kind === "meal" && <MealForm close={close} initialType={modal.value} />}{modal.kind === "activity" && <ActivityForm close={close} initialType={modal.value} />}{modal.kind === "sleep" && <SleepForm close={close} />}{modal.kind === "checkin" && <CheckinForm close={close} initialMood={modal.value} />}{modal.kind === "challenge" && <ChallengeDetail id={modal.id} close={close} />}{modal.kind === "create-challenge" && <CreateChallengeForm close={close} />}{modal.kind === "account" && <AccountForm close={close} />}{modal.kind === "invite" && <InviteContent />}{modal.kind === "group" && <GroupForm close={close} code={modal.value} />}{modal.kind === "notifications" && <Notifications close={close} />}{modal.kind === "achievement" && <AchievementDetail id={modal.id} />}{modal.kind === "confirm" && <ConfirmContent modal={modal} close={close} />}</Modal>;
}
