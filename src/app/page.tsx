import HealthRunnersApp from "@/components/gymrats/app";
import { dateKey } from "@/lib/gymrats";

export const dynamic = "force-dynamic";

export default function HomePage() {
  return <HealthRunnersApp initialDate={dateKey()} />;
}
