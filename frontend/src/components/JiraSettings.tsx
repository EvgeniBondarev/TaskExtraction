import { useCallback, useEffect, useState } from "react";
import {
  fetchJiraIssueTypes,
  fetchJiraProjects,
  fetchJiraStatus,
  JiraCredentials,
  JiraIssueType,
  JiraProject,
  JiraStatus,
  saveJiraSettings,
  testJiraConnection,
} from "../api/integrations/jira";
import { IntegrationFormStep } from "./integrations/IntegrationFormStep";
import type { IntegrationSettingsProps } from "./integrations/integrationSettingsProps";
import { IntegrationCardHeader, integrationState } from "./IntegrationCardHeader";
import { useI18n } from "../i18n";

export function JiraSettings({ embedded, hideHeader, onSaved }: IntegrationSettingsProps = {}) {
  const { messages: t } = useI18n();
  const j = t.settings.integrations.jira;
  const c = t.settings.common;
  const intl = t.settings.integrations;
  const hub = Boolean(hideHeader);
  const [status, setStatus] = useState<JiraStatus | null>(null);
  const [baseUrl, setBaseUrl] = useState("");
  const [email, setEmail] = useState("");
  const [apiToken, setApiToken] = useState("");
  const [projects, setProjects] = useState<JiraProject[]>([]);
  const [issueTypes, setIssueTypes] = useState<JiraIssueType[]>([]);
  const [projectKey, setProjectKey] = useState("");
  const [issueTypeId, setIssueTypeId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [autoPush, setAutoPush] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const creds = (): JiraCredentials => ({
    base_url: baseUrl.trim() || undefined,
    email: email.trim() || undefined,
    api_token: apiToken.trim() || undefined,
  });

  const reload = useCallback(async () => {
    const s = await fetchJiraStatus();
    setStatus(s);
    if (s.base_url) setBaseUrl(s.base_url);
    if (s.email) setEmail(s.email);
    if (s.project_key) setProjectKey(s.project_key);
    if (s.issue_type_id) setIssueTypeId(s.issue_type_id);
    setEnabled(s.enabled);
    setAutoPush(s.auto_push);
    setIncludeMedia(s.include_media);
    setIncludeLinks(s.include_message_links);
  }, []);

  useEffect(() => {
    reload().catch(() => setError(j.loadFailed));
  }, [reload]);

  const loadProjects = async () => {
    setError("");
    setLoading(true);
    try {
      const list = await fetchJiraProjects(creds());
      setProjects(list);
      if (list.length && !projectKey) setProjectKey(list[0].key);
      setInfo(`${j.projectsFound} ${list.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : j.loadProjectsError);
    } finally {
      setLoading(false);
    }
  };

  const loadIssueTypes = async (key: string) => {
    if (!key) return;
    setLoading(true);
    setError("");
    try {
      const list = await fetchJiraIssueTypes(key, creds());
      setIssueTypes(list);
      if (list.length && !issueTypeId) setIssueTypeId(list[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : j.issueTypesError);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (projectKey && projects.length) {
      loadIssueTypes(projectKey).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectKey]);

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setInfo("");
    try {
      const r = await testJiraConnection(creds());
      if (r.success) {
        setInfo(r.account_name ? `Подключено: ${r.account_name}` : r.message);
      } else {
        setError(r.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");
    try {
      const proj = projects.find((p) => p.key === projectKey);
      const it = issueTypes.find((t) => t.id === issueTypeId);
      const body: Record<string, unknown> = {
        base_url: baseUrl.trim(),
        email: email.trim(),
        project_key: projectKey || null,
        project_name: proj?.name || null,
        issue_type_id: issueTypeId || null,
        issue_type_name: it?.name || null,
        enabled,
        auto_push: autoPush,
        include_media: includeMedia,
        include_message_links: includeLinks,
      };
      if (apiToken.trim()) body.api_token = apiToken.trim();
      const s = await saveJiraSettings(body);
      setStatus(s);
      setApiToken("");
      setInfo(j.saved);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : j.saveError);
    } finally {
      setLoading(false);
    }
  };

  const selectedProject = projects.find((p) => p.key === projectKey);

  const credentialsFields = (
    <>
      <label>
        URL сайта Jira
        <input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://your-domain.atlassian.net" />
      </label>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" />
      </label>
      <label>
        API Token
        <input
          type="password"
          value={apiToken}
          onChange={(e) => setApiToken(e.target.value)}
          placeholder={status?.has_token ? "Новый токен (оставьте пустым)" : "ATATT..."}
        />
      </label>
      {status?.has_token && status.token_masked && (
        <p className={hub ? "int-step-hint" : "hint"}>Токен сохранён: {status.token_masked}</p>
      )}
      <div className="row-btns">
        <button type="button" onClick={handleTest} disabled={testing || loading}>
          {testing ? c.testing : intl.testConnection}
        </button>
        {!hub && (
          <button type="button" onClick={loadProjects} disabled={loading}>
            Загрузить проекты
          </button>
        )}
      </div>
    </>
  );

  const destinationFields = (
    <>
      {hub && (
        <div className="row-btns">
          <button type="button" onClick={loadProjects} disabled={loading}>
            {loading ? c.loading : j.loadProjects}
          </button>
        </div>
      )}
      {projects.length > 0 && (
        <label>
          Проект
          <select
            value={projectKey}
            onChange={(e) => {
              setProjectKey(e.target.value);
              setIssueTypeId("");
              setIssueTypes([]);
            }}
          >
            {projects.map((p) => (
              <option key={p.id} value={p.key}>
                {p.name} ({p.key})
              </option>
            ))}
          </select>
        </label>
      )}
      {selectedProject && issueTypes.length > 0 && (
        <label>
          {j.issueType}
          <select value={issueTypeId} onChange={(e) => setIssueTypeId(e.target.value)}>
            {issueTypes.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </label>
      )}
    </>
  );

  const toggleFields = (
    <div className="toggles">
      <label className="check">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>{hub ? intl.enableHub : intl.enableFull}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={autoPush} onChange={(e) => setAutoPush(e.target.checked)} />
        <span>
          {hub ? j.autoCreateHub : j.autoCreateFull}
        </span>
      </label>
      <label className="check">
        <input type="checkbox" checked={includeMedia} onChange={(e) => setIncludeMedia(e.target.checked)} />
        <span>{hub ? j.includeMediaHub : j.includeMediaFull}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={includeLinks} onChange={(e) => setIncludeLinks(e.target.checked)} />
        <span>{hub ? j.includeLinksHub : j.includeLinksFull}</span>
      </label>
    </div>
  );

  return (
    <div className={`jira-settings${embedded ? " embedded" : ""}${hub ? " int-form--hub" : ""}`}>
      <section className="card">
        {!hub && (
          <>
            <IntegrationCardHeader
              provider="jira"
              title="Jira Cloud"
              subtitle={
                status?.is_configured
                  ? `${status.project_name || status.project_key} · ${status.issue_type_name || j.issueType}`
                  : "REST API v3 · проект и тип задачи"
              }
              state={integrationState(status || {})}
              autoPush={status?.auto_push}
              serviceUrl={status?.base_url || null}
            />
            <p className="hint">
              Подключение через REST API v3. Создайте API token в{" "}
              <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">
                Atlassian Account
              </a>
              . Email — адрес аккаунта Atlassian.
            </p>
            {status?.is_configured && (
              <p className="ok-line">
                Настроено: {status.project_key} / {status.issue_type_name || status.issue_type_id}
                {status.enabled && status.auto_push && " · автосоздание включено"}
              </p>
            )}
          </>
        )}

        {hub && status?.is_configured && (
          <p className="int-ok">
            Сейчас: {status.project_key} / {status.issue_type_name || status.issue_type_id}
            {status.enabled && status.auto_push && " · авто включено"}
          </p>
        )}

        {hub && (
          <details className="int-help">
            <summary>Где взять API token?</summary>
            <p>
              Создайте токен в{" "}
              <a href="https://id.atlassian.com/manage-profile/security/api-tokens" target="_blank" rel="noreferrer">
                Atlassian Account
              </a>
              . Email — адрес аккаунта Atlassian.
            </p>
          </details>
        )}

        <form onSubmit={handleSave}>
          {hub ? (
            <>
              <IntegrationFormStep step={1} title={j.step1Title} hint={j.step1Hint}>
                {credentialsFields}
              </IntegrationFormStep>
              <IntegrationFormStep step={2} title={j.step2Title} hint={j.step2Hint}>
                {destinationFields}
              </IntegrationFormStep>
              <IntegrationFormStep step={3} title={intl.stepEnable}>
                {toggleFields}
                <button type="submit" className="primary" disabled={loading} style={{ background: "var(--accent)" }}>
                  {loading ? c.saving : c.save}
                </button>
              </IntegrationFormStep>
            </>
          ) : (
            <>
              {credentialsFields}
              {destinationFields}
              {toggleFields}
              <button type="submit" className="primary" disabled={loading}>
                Сохранить настройки Jira
              </button>
            </>
          )}
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      {!hub && (
        <style>{`
        .jira-settings .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem 1.15rem;
        }
        .jira-settings .hint { font-size: 0.82rem; color: var(--muted); margin: 0 0 0.75rem; line-height: 1.4; }
        .jira-settings .ok-line { color: #4ade80; font-size: 0.85rem; margin: 0 0 0.5rem; }
        .jira-settings label { display: block; margin-bottom: 0.65rem; font-size: 0.78rem; color: var(--muted); }
        .jira-settings input, .jira-settings select {
          display: block; width: 100%; margin-top: 0.2rem;
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); border-radius: 8px; padding: 0.45rem 0.55rem; font: inherit;
        }
        .row-btns { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; }
        .row-btns button {
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); padding: 0.4rem 0.75rem; border-radius: 8px;
        }
        .toggles { display: flex; flex-direction: column; gap: 0.35rem; margin: 0.75rem 0; }
        .check { display: flex; align-items: center; gap: 0.5rem; color: var(--text); font-size: 0.85rem; }
        .check input { width: auto; margin: 0; }
        .primary {
          background: var(--accent); color: #fff; border: none;
          padding: 0.5rem 1rem; border-radius: 8px; margin-top: 0.25rem;
        }
        .error { color: #f87171; font-size: 0.85rem; }
        .info { color: #4ade80; font-size: 0.85rem; }
      `}</style>
      )}
    </div>
  );
}
