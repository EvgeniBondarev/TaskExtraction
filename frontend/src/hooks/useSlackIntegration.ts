import { useEffect, useState } from "react";
import { fetchSlackStatus, SlackStatus } from "../api/integrations/slack";

export function useSlackIntegration(ready: boolean) {
  const [status, setStatus] = useState<SlackStatus | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetchSlackStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [ready]);

  const configured = Boolean(status?.is_configured);
  const enabled = Boolean(status?.enabled && configured);
  const active = Boolean(status && (status.has_token || configured));

  return { enabled, configured, active, status };
}
