"use client";
import { createContext, useContext } from "react";
import type { DashboardData, View } from "@/lib/gymrats";
export type ModalState = { kind: "checkin" | "meal" | "water" | "activity" | "sleep" | "challenge" | "create-challenge" | "invite" | "group" | "notifications" | "achievement" | "confirm" | "photo" | "account"; id?: string; value?: string; action?: Record<string, unknown>; title?: string; description?: string; confirmLabel?: string; cancelLabel?: string; tone?: "danger" | "neutral"; successMessage?: string } | null;
export type GymContextType = {
  data: DashboardData;
  busy: boolean;
  ready: boolean;
  view: View;
  navigate: (view: View) => void;
  openModal: (modal: ModalState) => void;
  mutate: (body: Record<string, unknown>, message?: string) => Promise<boolean>;
  savePhoto: (file: File | null) => Promise<boolean>;
  auth: (body: Record<string, unknown>, message: string) => Promise<{ ok: boolean; error?: string }>;
  notify: (message: string, type?: "success" | "error") => void;
  selectedDate: string;
  setSelectedDate: (date: string) => void;
};
export const GymContext = createContext<GymContextType | null>(null);
export function useGym() { const context = useContext(GymContext); if (!context) throw new Error("GymContext is required"); return context; }
