import { useEffect, useState } from "react";
import { fetchTelegramSetupRequired, fetchTelegramStatus } from "../api/telegram";

/** Режим как на сервере: TELEGRAM_API_ID/HASH в env бэкенда, в UI только QR. */
export function useHostedApp(): boolean | null {
  const [hosted, setHosted] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchTelegramSetupRequired(),
      fetchTelegramStatus().catch(() => null),
    ])
      .then(([setup, status]) => {
        if (cancelled) return;
        if (typeof setup.hosted_app === "boolean") {
          setHosted(setup.hosted_app);
          return;
        }
        if (typeof status?.hosted_app === "boolean") {
          setHosted(status.hosted_app);
          return;
        }
        setHosted(false);
      })
      .catch(() => {
        if (!cancelled) setHosted(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return hosted;
}

export function isHostedMode(
  serverHosted: boolean | null,
  statusHosted?: boolean
): boolean {
  return serverHosted === true || Boolean(statusHosted);
}
