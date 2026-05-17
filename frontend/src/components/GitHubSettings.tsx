import { useCallback, useEffect, useState } from "react";
import {
  fetchGitHubLabels,
  fetchGitHubStatus,
  GitHubCredentials,
  GitHubLabel,
  GitHubStatus,
  saveGitHubSettings,
  testGitHubConnection,
} from "../api/integrations/github";
import { IntegrationCardHeader, integrationState } from "./IntegrationCardHeader";

export function GitHubSettings({ embedded }: { embedded?: boolean } = {}) {
  const [status, setStatus] = useState<GitHubStatus | null>(null);
  const [owner, setOwner] = useState("EvgeniBondarev");
  const [repo, setRepo] = useState("Studio2Prod");
  const [token, setToken] = useState("");
  const [labels, setLabels] = useState<GitHubLabel[]>([]);
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [enabled, setEnabled] = useState(false);
  const [autoPush, setAutoPush] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [useTypeLabels, setUseTypeLabels] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const creds = (): GitHubCredentials => ({
    owner: owner.trim() || undefined,
    repo: repo.trim() || undefined,
    token: token.trim() || undefined,
  });

  const reload = useCallback(async () => {
    const s = await fetchGitHubStatus();
    setStatus(s);
    if (s.owner) setOwner(s.owner);
    if (s.repo) setRepo(s.repo);
    setSelectedLabels(s.default_labels || []);
    setEnabled(s.enabled);
    setAutoPush(s.auto_push);
    setIncludeMedia(s.include_media);
    setIncludeLinks(s.include_message_links);
    setUseTypeLabels(s.use_type_labels);
  }, []);

  useEffect(() => {
    reload().catch(() => setError("Не удалось загрузить настройки GitHub"));
  }, [reload]);

  const loadLabels = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchGitHubLabels(creds());
      setLabels(list);
      setInfo(`Меток в репозитории: ${list.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки labels");
    } finally {
      setLoading(false);
    }
  };

  const toggleLabel = (name: string) => {
    setSelectedLabels((prev) =>
      prev.includes(name) ? prev.filter((l) => l !== name) : [...prev, name]
    );
  };

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setInfo("");
    try {
      const r = await testGitHubConnection(creds());
      if (r.success) {
        setInfo(r.account_name ? `Подключено: @${r.account_name}` : r.message);
      } else {
        setError(r.message);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка");
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
      const body: Record<string, unknown> = {
        owner: owner.trim(),
        repo: repo.trim(),
        default_labels: selectedLabels,
        enabled,
        auto_push: autoPush,
        include_media: includeMedia,
        include_message_links: includeLinks,
        use_type_labels: useTypeLabels,
      };
      if (token.trim()) body.token = token.trim();
      const s = await saveGitHubSettings(body);
      setStatus(s);
      setToken("");
      setInfo("Настройки GitHub сохранены");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const repoUrl =
    status?.repo_url ||
    (owner.trim() && repo.trim()
      ? `https://github.com/${owner.trim()}/${repo.trim()}`
      : null);

  return (
    <div className={`github-settings${embedded ? " embedded" : ""}`}>
      <section className="card">
        <IntegrationCardHeader
          provider="github"
          title="GitHub Issues"
          subtitle={
            status?.is_configured
              ? `${owner}/${repo} · Issues API`
              : "Fine-grained token · Issues Read & Write"
          }
          state={integrationState(status || {})}
          autoPush={status?.auto_push}
          serviceUrl={repoUrl}
        />
        <p className="hint">
          Создайте{" "}
          <a href="https://github.com/settings/tokens?type=beta" target="_blank" rel="noreferrer">
            Fine-grained token
          </a>{" "}
          с доступом к репозиторию и правами <strong>Issues: Read and write</strong>,{" "}
          <strong>Metadata: Read</strong>.
        </p>

        {status?.is_configured && (
          <p className="ok-line">
            Репозиторий: {owner}/{repo}
            {selectedLabels.length > 0 && ` · labels: ${selectedLabels.join(", ")}`}
            {status.enabled && status.auto_push && " · автосоздание включено"}
          </p>
        )}
        {status?.has_token && status.token_masked && (
          <p className="hint">Token сохранён: {status.token_masked}</p>
        )}

        <form onSubmit={handleSave}>
          <div className="row-2">
            <label>
              Owner
              <input value={owner} onChange={(e) => setOwner(e.target.value)} placeholder="EvgeniBondarev" />
            </label>
            <label>
              Repository
              <input value={repo} onChange={(e) => setRepo(e.target.value)} placeholder="Studio2Prod" />
            </label>
          </div>

          <label>
            Personal Access Token
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder={status?.has_token ? "Новый token (оставьте пустым)" : "github_pat_…"}
            />
          </label>

          <div className="row-btns">
            <button type="button" onClick={handleTest} disabled={testing || loading}>
              {testing ? "Проверка…" : "Проверить подключение"}
            </button>
            <button type="button" onClick={loadLabels} disabled={loading}>
              Загрузить labels
            </button>
          </div>

          {labels.length > 0 && (
            <div className="labels-block">
              <span className="labels-title">Дополнительные labels при создании issue</span>
              <div className="labels-grid">
                {labels.map((lb) => (
                  <label key={lb.name} className="label-chip">
                    <input
                      type="checkbox"
                      checked={selectedLabels.includes(lb.name)}
                      onChange={() => toggleLabel(lb.name)}
                    />
                    <span
                      className="label-dot"
                      style={{ background: lb.color ? `#${lb.color}` : "#64748b" }}
                    />
                    {lb.name}
                  </label>
                ))}
              </div>
            </div>
          )}

          <div className="toggles">
            <label className="check">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Интеграция включена
            </label>
            <label className="check">
              <input type="checkbox" checked={autoPush} onChange={(e) => setAutoPush(e.target.checked)} />
              Создавать GitHub Issue при новой задаче
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={useTypeLabels}
                onChange={(e) => setUseTypeLabels(e.target.checked)}
              />
              Авто-labels: bug → bug, feature → enhancement, high → urgent
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={(e) => setIncludeMedia(e.target.checked)}
              />
              Вставлять медиа в описание (ссылки и превью картинок)
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={includeLinks}
                onChange={(e) => setIncludeLinks(e.target.checked)}
              />
              Добавлять ссылку на Telegram
            </label>
          </div>

          <button type="submit" className="primary" disabled={loading}>
            Сохранить настройки GitHub
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <style>{`
        .github-settings .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem 1.15rem;
          margin-top: 1rem;
        }
        .github-settings .hint { font-size: 0.82rem; color: var(--muted); margin: 0 0 0.75rem; line-height: 1.4; }
        .github-settings .ok-line { color: #4ade80; font-size: 0.85rem; margin: 0 0 0.5rem; }
        .github-settings label { display: block; margin-bottom: 0.65rem; font-size: 0.78rem; color: var(--muted); }
        .github-settings input {
          display: block; width: 100%; margin-top: 0.2rem;
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); border-radius: 8px; padding: 0.45rem 0.55rem; font: inherit;
        }
        .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 0.65rem; }
        @media (max-width: 520px) { .row-2 { grid-template-columns: 1fr; } }
        .row-btns { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; }
        .row-btns button {
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); padding: 0.4rem 0.75rem; border-radius: 8px;
        }
        .labels-block { margin: 0.75rem 0; }
        .labels-title { font-size: 0.78rem; color: var(--muted); display: block; margin-bottom: 0.4rem; }
        .labels-grid {
          display: flex; flex-wrap: wrap; gap: 0.35rem;
          max-height: 160px; overflow-y: auto;
          padding: 0.5rem; border: 1px solid var(--border); border-radius: 8px;
        }
        .label-chip {
          display: inline-flex; align-items: center; gap: 0.3rem;
          font-size: 0.78rem; color: var(--text); cursor: pointer;
          padding: 0.2rem 0.45rem; border-radius: 6px;
          background: rgba(255,255,255,0.04);
        }
        .label-chip input { width: auto; margin: 0; }
        .label-dot { width: 8px; height: 8px; border-radius: 50%; }
        .toggles { display: flex; flex-direction: column; gap: 0.35rem; margin: 0.75rem 0; }
        .check { display: flex; align-items: center; gap: 0.5rem; color: var(--text); font-size: 0.85rem; }
        .check input { width: auto; margin: 0; }
        .primary {
          background: #238636; color: #fff; border: none;
          padding: 0.5rem 1rem; border-radius: 8px; margin-top: 0.25rem;
        }
        .error { color: #f87171; font-size: 0.85rem; }
        .info { color: #4ade80; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
