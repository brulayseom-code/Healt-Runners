import type { Metadata } from "next";
import type { ReactNode } from "react";
import { DM_Sans, Manrope } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({ subsets: ["latin"], variable: "--font-dm-sans", display: "swap" });
const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope", display: "swap" });

export const metadata: Metadata = {
  title: "Health Runners — Sua rotina, seu desafio, sua evolução",
  description: "Pequenos hábitos, grandes conquistas. Cuide da sua alimentação, hidratação, movimento e bem-estar com o Health Runners.",
  applicationName: "Health Runners",
  openGraph: {
    title: "Health Runners — Sua rotina, seu desafio, sua evolução",
    description: "Pequenos hábitos, grandes conquistas. Nutrição, movimento e bem-estar no seu ritmo.",
    siteName: "Health Runners",
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><body className={`${dmSans.variable} ${manrope.variable}`}>{children}</body></html>;
}
