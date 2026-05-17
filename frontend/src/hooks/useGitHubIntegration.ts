import { useEffect, useState } from "react";
import { fetchGitHubStatus, GitHubStatus } from "../api/integrations/github";

export function useGitHubIntegration(ready: boolean) {
  const [status, setStatus] = useState<GitHubStatus | null>(null);

  useEffect(() => {
    if (!ready) return;
    fetchGitHubStatus()
      .then(setStatus)
      .catch(() => setStatus(null));
  }, [ready]);

  const configured = Boolean(status?.is_configured);
  const enabled = Boolean(status?.enabled && configured);
  const active = Boolean(status && (status.has_token || configured));

  return { enabled, configured, active, status };
}
