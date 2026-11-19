import { APP_NAME } from "@/lib/brand";
import { LOGO_DATA_URI } from "@/lib/logo-data-uri";

export function BrandLogo() {
  return (
    <span className="brand-lockup" role="img" aria-label={APP_NAME}>
      <span className="brand-mark" aria-hidden="true">
        <img
          src={LOGO_DATA_URI}
          alt={APP_NAME}
          width={40}
          height={40}
          loading="eager"
          decoding="sync"
          onError={(e) => {
            // Fallback to static public image if data URI somehow fails
            if (e.currentTarget.src !== "/images/health-runners-logo.png") {
              e.currentTarget.src = "/images/health-runners-logo.png";
            }
          }}
        />
      </span>
      <span className="brand-name" aria-hidden="true">
        <span>Health</span>
        <span>Runners</span>
      </span>
    </span>
  );
}
