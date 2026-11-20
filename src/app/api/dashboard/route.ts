import { cookies } from "next/headers";
import { getDashboard, validDate } from "@/lib/dashboard";
import { resolveProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

import { previewData } from "@/lib/gymrats";

export async function GET(request: Request) {
  let date = "";
  try {
    date = validDate(new URL(request.url).searchParams.get("date"));
    const jar = await cookies();
    const profile = await resolveProfile(request, jar);
    return Response.json(await getDashboard(profile.id, date), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.warn("Database fallback in /api/dashboard (returning presentation data):", error instanceof Error ? error.message : "db offline");
    return Response.json(previewData(date || undefined), { headers: { "Cache-Control": "no-store" } });
  }
}
