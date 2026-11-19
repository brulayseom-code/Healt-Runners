"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowUpRight, Bell, CalendarDays, Camera, ChartNoAxesCombined, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronsUpDown, CircleAlert, Dumbbell, Droplets, Flag, Flame, House, Leaf, LoaderCircle, Medal, Menu, MoonStar, Salad, Settings2, Sparkles, Sprout, Sun, Trophy, UserRound, Users, X } from "lucide-react";
import { GymContext, type ModalState } from "./context";
import { Avatar, AvatarStack, Progress } from "./ui";
import { Dashboard } from "./dashboard";
import { BrandLogo } from "./brand-logo";
import { AchievementsView, ActivityView, ChallengesView, HydrationView, NutritionView, ProgressView, RankingView, SettingsView, WellbeingView } from "./views";
import { AppModals } from "./modals";
import { calculateDay, dateKey, number, offsetDate, previewData, type DashboardData, type View } from "@/lib/gymrats";
import { sessionHeaders, storeSessionId } from "@/lib/client-session";

const primaryNav = [
  { id: "day" as View, label: "Meu dia", icon: House },
  { id: "nutrition" as View, label: "Nutrição", icon: Salad },
  { id: "hydration" as View, label: "Hidratação", icon: Droplets },
  { id: "activity" as View, label: "Atividade física", icon: Dumbbell },
  { id: "wellbeing" as View, label: "Sono & bem-estar", icon: MoonStar },
];
const growthNav = [
  { id: "challenges" as View, label: "Desafios", icon: Flag },
  { id: "ranking" as View, label: "Ranking", icon: Trophy },
  { id: "achievements" as View, label: "Conquistas", icon: Medal },
  { id: "progress" as View, label: "Meu progresso", icon: ChartNoAxesCombined },
];
const viewMeta: Record<View, { title: string; description: string }> = {
  day: { title: "Meu dia", description: "Um novo dia para cuidar de você. Sem pressa, no seu ritmo." },
  nutrition: { title: "Nutrição", description: "Mais qualidade no prato, mais leveza na sua rotina." },
  hydration: { title: "Hidratação", description: "Um pequeno gole. Um grande gesto de cuidado." },
  activity: { title: "Atividade física", description: "Encontre o seu movimento e celebre cada minuto." },
  wellbeing: { title: "Sono & bem-estar", description: "Uma pausa para escutar seu corpo e cuidar da sua mente." },
  challenges: { title: "Seus próximos desafios", description: "Uma motivação a mais para cultivar bons hábitos." },
  ranking: { title: "Evoluir fica melhor em boa companhia", description: "Competição leve, incentivo de verdade e conquistas compartilhadas." },
  achievements: { title: "Suas conquistas", description: "Lembretes de tudo o que você está construindo, um dia de cada vez." },
  progress: { title: "Seu caminho, sua evolução", description: "Olhe para trás com carinho. Olhe para frente com vontade." },
  settings: { title: "Do seu jeito, no seu ritmo", description: "Um espaço para ajustar seu perfil, suas metas e suas preferências." },
};

export default function HealthRunnersApp({ initialDate }: { initialDate: string }) {
  const [data, setData] = useState<DashboardData>(() => previewData(initialDate));
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [view, setView] = useState<View>("day");
  const [modal, setModal] = useState<ModalState>(null);
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileMenu, setProfileMenu] = useState(false);
  const [notificationsRead, setNotificationsRead] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error"; points?: number } | null>(null);
  const lock = useRef(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  const toastRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    try {
      if (toast && toastRef.current?.showPopover) toastRef.current.showPopover();
    } catch { /* popover fallback */ }
  }, [toast]);
  const firstName = data.profile.name.split(" ")[0];
  const level = Math.floor(data.totalXp / 500) + 1;

  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const nextView = url.searchParams.get("view");
      if (nextView && nextView in viewMeta) setView(nextView as View);
      const invite = url.searchParams.get("invite");
      if (invite) { setModal({ kind: "group", value: invite }); url.searchParams.delete("invite"); window.history.replaceState({}, "", url); }
    } catch { /* ignore url parse error */ }
    try {
      setNotificationsRead(window.localStorage?.getItem(`healthrunners-notifications-${initialDate}`) === "read");
    } catch { /* storage fallback */ }
    function popstate() {
      try {
        const target = new URL(window.location.href).searchParams.get("view");
        setView(target && target in viewMeta ? target as View : "day");
      } catch { /* fallback */ }
    }
    window.addEventListener("popstate", popstate);
    return () => window.removeEventListener("popstate", popstate);
  }, [initialDate]);

  useEffect(() => {
    const controller = new AbortController();
    setReady(false); setError("");
    fetch(`/api/dashboard?date=${selectedDate}`, { signal: controller.signal, cache: "no-store", headers: sessionHeaders() }).then(async response => { const result = await response.json(); if (!response.ok) throw new Error(result.error); return result as DashboardData; }).then(result => { storeSessionId(result.profile.id); setData(result); setReady(true); }).catch(err => { if (err.name !== "AbortError") setError(err.message || "Não foi possível carregar seus registros."); });
    return () => controller.abort();
  }, [selectedDate, retry]);

  useEffect(() => { if (!toast) return; const timer = setTimeout(() => setToast(null), 5500); return () => clearTimeout(timer); }, [toast]);
  useEffect(() => { function click(event: MouseEvent) { if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) setProfileMenu(false); } function escape(event: KeyboardEvent) { if (event.key === "Escape") { setSidebarOpen(false); setProfileMenu(false); } } document.addEventListener("mousedown", click); document.addEventListener("keydown", escape); return () => { document.removeEventListener("mousedown", click); document.removeEventListener("keydown", escape); }; }, []);

  const notify = useCallback((message: string, type: "success" | "error" = "success") => setToast({ message, type }), []);
  const navigate = useCallback((next: View) => { setView(next); setSidebarOpen(false); setProfileMenu(false); const url = new URL(window.location.href); if (next === "day") url.searchParams.delete("view"); else url.searchParams.set("view", next); window.history.pushState({}, "", url); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const openModal = useCallback((next: ModalState) => {
    setModal(next);
    setProfileMenu(false);
    if (next?.kind === "notifications") {
      setNotificationsRead(true);
      try { window.localStorage?.setItem(`healthrunners-notifications-${initialDate}`, "read"); } catch { /* ignore */ }
    }
  }, [initialDate]);
  const mutate = useCallback(async (body: Record<string, unknown>, message = "Seu registro foi salvo.") => {
    if (lock.current || !ready) return false;
    lock.current = true; setBusy(true);
    try {
      const response = await fetch("/api/actions", { method: "POST", headers: sessionHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ ...body, date: selectedDate }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível salvar este registro.");
      const updated = result as DashboardData;
      storeSessionId(updated.profile.id);
      const before = calculateDay(data.day, data.meals, data.activities, data.profile.waterGoal);
      const after = calculateDay(updated.day, updated.meals, updated.activities, updated.profile.waterGoal);
      const gain = updated.totalXp - data.totalXp;
      setData(updated);
      setToast({ message: before.missionCount < 4 && after.missionCount === 4 ? "Missão completa! Você escolheu cuidar de você. Celebre!" : message, type: "success", points: gain > 0 ? gain : undefined });
      return true;
    } catch (err) { notify(err instanceof Error ? err.message : "Não foi possível salvar. Tente novamente.", "error"); return false; }
    finally { lock.current = false; setBusy(false); }
  }, [ready, selectedDate, data, notify]);

  const savePhoto = useCallback(async (file: File | null) => {
    if (lock.current || !ready) return false;
    lock.current = true;
    setBusy(true);
    try {
      const form = new FormData();
      if (file) form.append("photo", file);
      const response = await fetch(`/api/profile/photo?date=${selectedDate}`, file ? { method: "POST", body: form, headers: sessionHeaders() } : { method: "DELETE", headers: sessionHeaders() });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Não foi possível atualizar sua foto.");
      storeSessionId((result as DashboardData).profile.id);
      setData(result as DashboardData);
      notify(file ? "Foto de perfil atualizada! Agora o Health Runners tem mais a sua cara." : "Foto removida. Suas iniciais agora aparecem no perfil.");
      return true;
    } catch (error) {
      notify(error instanceof Error ? error.message : "Não foi possível salvar a foto. Tente novamente.", "error");
      return false;
    } finally {
      lock.current = false;
      setBusy(false);
    }
  }, [ready, selectedDate, notify]);

  const auth = useCallback(async (body: Record<string, unknown>, message: string) => {
    if (lock.current) return { ok: false };
    lock.current = true; setBusy(true);
    try {
      const response = await fetch("/api/auth", { method: "POST", headers: sessionHeaders({ "Content-Type": "application/json" }), body: JSON.stringify({ ...body, date: selectedDate }) });
      const result = await response.json();
      if (!response.ok) return { ok: false, error: result.error || "Não foi possível concluir agora." };
      storeSessionId((result as DashboardData).profile.id);
      setData(result as DashboardData);
      setReady(true);
      notify(message);
      return { ok: true };
    } catch {
      return { ok: false, error: "Falha de conexão. Tente novamente." };
    } finally { lock.current = false; setBusy(false); }
  }, [selectedDate, notify]);

  const dailyView = ["day", "nutrition", "hydration", "activity", "wellbeing"].includes(view);
  const today = dateKey();
  const dateLabel = `${selectedDate === today ? "Hoje, " : ""}${new Date(`${selectedDate}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}`;
  const context = { data, busy: busy || !ready, ready, view, navigate, openModal, mutate, savePhoto, auth, notify, selectedDate, setSelectedDate };

  return <GymContext.Provider value={context}><div className="app-shell">{sidebarOpen && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setSidebarOpen(false)} />}<aside className={`sidebar ${sidebarOpen ? "open" : ""}`}><button className="brand" aria-label="Health Runners, ir para Meu dia" onClick={() => navigate("day")}><BrandLogo /></button><div className="sidebar-scroll"><nav aria-label="Navegação principal"><span className="nav-label">SUA ROTINA</span>{primaryNav.map(item => <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? "page" : undefined}><item.icon size={18} strokeWidth={1.7} /><span>{item.label}</span>{view === item.id && <span className="nav-active-dot" />}</button>)}<span className="nav-label growth-label">SUA EVOLUÇÃO</span>{growthNav.map(item => <button key={item.id} className={`nav-item ${view === item.id ? "active" : ""}`} onClick={() => navigate(item.id)} aria-current={view === item.id ? "page" : undefined}><item.icon size={18} strokeWidth={1.7} /><span>{item.label}</span>{item.id === "challenges" && <span className="nav-count">{data.profile.joinedChallenges.filter(id => !data.profile.completedChallenges.includes(id)).length}</span>}{item.id !== "challenges" && view === item.id && <span className="nav-active-dot" />}</button>)}</nav><div className="sidebar-invite"><span className="invite-small-icon"><Sprout size={20} strokeWidth={1.5} /></span><h3>Bons hábitos ficam<br />melhores juntos.</h3><p>Traga sua turma para o desafio.</p><AvatarStack /><button onClick={() => openModal({ kind: "invite" })}>Convidar amigos<ArrowUpRight size={14} /></button></div></div><div className="sidebar-bottom"><button className="nav-item" onClick={() => openModal({ kind: "account" })}><UserRound size={18} strokeWidth={1.7} /><span>{data.profile.registered ? "Minha conta" : "Entrar / Criar conta"}</span>{!data.profile.registered && <span className="nav-account-dot" aria-hidden="true" />}</button><button className={`nav-item ${view === "settings" ? "active" : ""}`} onClick={() => navigate("settings")}><Settings2 size={18} strokeWidth={1.7} /><span>Configurações</span></button><button className="sidebar-profile" onClick={() => navigate("settings")}><Avatar name={data.profile.name} avatar={data.profile.avatar} size={35} /><span><strong>{data.profile.name}</strong><small>Nível {level} · Em evolução</small></span><ChevronsUpDown size={14} /></button></div></aside><div className="main-shell"><header className="topbar"><div className="topbar-left"><button className="icon-button mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Abrir menu de navegação"><Menu size={22} /></button><span className="topbar-leaf"><Leaf size={17} strokeWidth={1.6} /></span><span className="topbar-tagline">Sua rotina, seu desafio, <strong>sua evolução.</strong></span></div><div className="topbar-right"><span className="streak-header"><Flame size={17} strokeWidth={1.8} /><strong>{data.streak}</strong> dias de sequência</span><span className="topbar-divider" /><button className="notification-button icon-button" onClick={() => openModal({ kind: "notifications" })} aria-label="Abrir notificações"><Bell size={19} strokeWidth={1.7} />{!notificationsRead && data.profile.reminders && <span />}</button><div className="top-profile" ref={profileMenuRef}><button className="top-profile-trigger" onClick={() => setProfileMenu(!profileMenu)} aria-expanded={profileMenu} aria-label="Abrir menu do perfil"><Avatar name={data.profile.name} avatar={data.profile.avatar} size={35} /><span><strong>{firstName}</strong><small>Runner em evolução</small></span><ChevronDown size={14} /></button>{profileMenu && <div className="profile-dropdown"><div><strong>{data.profile.name}</strong><span>Nível {level} · {number(data.totalXp)} HealthPoints</span></div><button onClick={() => openModal({ kind: "account" })}><UserRound size={16} />{data.profile.registered ? "Minha conta" : "Entrar / Criar conta"}</button><button onClick={() => navigate("settings")}><Settings2 size={16} />Meu perfil e minhas metas</button><button onClick={() => openModal({ kind: "photo" })}><Camera size={16} />Alterar foto</button><button onClick={() => navigate("progress")}><ChartNoAxesCombined size={16} />Minha evolução</button><button onClick={() => openModal({ kind: "invite" })}><Users size={16} />Convidar meus amigos</button></div>}</div></div></header><main className={`main-content view-${view}`}><div className="page-heading"><div>{view === "day" && <div className="home-brand"><BrandLogo /></div>}<span className="page-eyebrow">{view === "day" ? "MEU DIA" : "MEU ESPAÇO DE EVOLUÇÃO"}</span><h1>{view === "day" ? <>Vamos nessa, {firstName}!<Sun className="greeting-sun" size={27} strokeWidth={1.5} /></> : viewMeta[view].title}</h1><p>{viewMeta[view].description}</p></div>{dailyView ? <div className="date-navigation"><button className="icon-button" aria-label="Ver dia anterior" disabled={busy || !ready || selectedDate <= offsetDate(today, -365)} onClick={() => setSelectedDate(offsetDate(selectedDate, -1))}><ChevronLeft size={16} /></button><label className="date-picker"><CalendarDays size={15} /><span>{dateLabel}</span><input type="date" aria-label="Escolher data dos registros" value={selectedDate} max={today} min={offsetDate(today, -365)} disabled={busy || !ready} onChange={e => e.target.value && setSelectedDate(e.target.value)} /></label><button className="icon-button" aria-label="Ver próximo dia" disabled={busy || !ready || selectedDate >= today} onClick={() => setSelectedDate(offsetDate(selectedDate, 1))}><ChevronRight size={16} /></button></div> : <span className="total-points"><Sparkles size={16} /><strong>{number(data.totalXp)}</strong> HealthPoints</span>}</div>{error && <div className="error-banner" role="alert"><CircleAlert size={18} /><span>{error}</span><button onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></div>}{!ready && !error && <div className="loading-indicator" aria-label="Carregando registros"><span /></div>}{view === "day" && <Dashboard />}{view === "nutrition" && <NutritionView />}{view === "hydration" && <HydrationView />}{view === "activity" && <ActivityView />}{view === "wellbeing" && <WellbeingView />}{view === "challenges" && <ChallengesView />}{view === "ranking" && <RankingView />}{view === "achievements" && <AchievementsView />}{view === "progress" && <ProgressView />}{view === "settings" && <SettingsView />}<footer className="app-footer"><span><span className="footer-dot" />Feito para evoluir com você.</span><span>Health Runners © {new Date(initialDate).getFullYear()}<span className="footer-separator">·</span>Nutrição & bem-estar</span></footer></main></div>{toast && <div ref={toastRef} popover="manual" className={`toast ${toast.type}`} role="status"><span className="toast-icon">{toast.type === "success" ? <Check size={18} /> : <CircleAlert size={19} />}</span><p>{toast.message}</p>{toast.points && <span className="toast-points">+{toast.points} XP</span>}<button className="icon-button" aria-label="Fechar aviso" onClick={() => setToast(null)}><X size={15} /></button></div>}<AppModals modal={modal} close={() => setModal(null)} /></div></GymContext.Provider>;
}
