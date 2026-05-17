import { useEffect, useState } from "react";
import { fetchJiraStatus, JiraStatus } from "../api/integrations/jira";

export function useJiraIntegration(ready: boolean) {
  const [status, setStatus] = useState<JiraStatus | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetchJiraStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [ready]);

  const configured = Boolean(status?.is_configured);
  const enabled = Boolean(status?.enabled && configured);
  /** Показывать значки/ссылки, если интеграция сохранена */
  const active = Boolean(status && (status.has_token || configured));

  return { enabled, configured, active, status };
}
