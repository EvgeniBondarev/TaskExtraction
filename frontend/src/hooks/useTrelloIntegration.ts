import { useEffect, useState } from "react";
import { fetchTrelloStatus, TrelloStatus } from "../api/integrations/trello";

export function useTrelloIntegration(ready: boolean) {
  const [status, setStatus] = useState<TrelloStatus | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetchTrelloStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [ready]);

  const configured = Boolean(status?.is_configured);
  const enabled = Boolean(status?.enabled && configured);
  const active = Boolean(status && (status.has_token || configured));

  return { enabled, configured, active, status };
}
