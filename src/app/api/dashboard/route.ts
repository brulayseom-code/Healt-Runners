import { cookies } from "next/headers";
import { getDashboard, validDate } from "@/lib/dashboard";
import { resolveProfile } from "@/lib/session";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const date = validDate(new URL(request.url).searchParams.get("date"));
    const jar = await cookies();
    const profile = await resolveProfile(request, jar);
    return Response.json(await getDashboard(profile.id, date), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Dashboard:", error);
    return Response.json({ error: error instanceof Error && error.message.startsWith("Escolha") ? error.message : "Não foi possível carregar seu dia. Tente novamente." }, { status: 500 });
  }
}
