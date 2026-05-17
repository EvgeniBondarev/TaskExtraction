import { useCallback, useEffect, useState } from "react";
import {
  fetchSlackChannels,
  fetchSlackStatus,
  saveSlackSettings,
  SlackChannel,
  SlackCredentials,
  SlackStatus,
  testSlackConnection,
} from "../api/integrations/slack";
import { IntegrationCardHeader, integrationState } from "./IntegrationCardHeader";

export function SlackSettings({ embedded }: { embedded?: boolean } = {}) {
  const [status, setStatus] = useState<SlackStatus | null>(null);
  const [botToken, setBotToken] = useState("");
  const [channels, setChannels] = useState<SlackChannel[]>([]);
  const [channelId, setChannelId] = useState("");
  const [workspaceName, setWorkspaceName] = useState("");
  const [workspaceUrl, setWorkspaceUrl] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [autoPush, setAutoPush] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [mentionChannel, setMentionChannel] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const creds = (): SlackCredentials => ({
    bot_token: botToken.trim() || undefined,
  });

  const reload = useCallback(async () => {
    const s = await fetchSlackStatus();
    setStatus(s);
    if (s.channel_id) setChannelId(s.channel_id);
    if (s.workspace_name) setWorkspaceName(s.workspace_name);
    if (s.workspace_url) setWorkspaceUrl(s.workspace_url);
    setEnabled(s.enabled);
    setAutoPush(s.auto_push);
    setIncludeMedia(s.include_media);
    setIncludeLinks(s.include_message_links);
    setMentionChannel(s.mention_channel);
  }, []);

  useEffect(() => {
    reload().catch(() => setError("Не удалось загрузить настройки Slack"));
  }, [reload]);

  const loadChannels = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchSlackChannels(creds());
      setChannels(list);
      if (list.length && !channelId) setChannelId(list[0].id);
      setInfo(`Каналов доступно боту: ${list.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки каналов");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setInfo("");
    try {
      const r = await testSlackConnection(creds());
      if (r.success) {
        if (r.workspace_name) setWorkspaceName(r.workspace_name);
        if (r.workspace_url) setWorkspaceUrl(r.workspace_url);
        setInfo(
          r.bot_name
            ? `Подключено: ${r.workspace_name || "workspace"} · бот @${r.bot_name}`
            : r.message
        );
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
      const ch = channels.find((c) => c.id === channelId);
      const body: Record<string, unknown> = {
        channel_id: channelId || null,
        channel_name: ch ? `#${ch.name}` : status?.channel_name || null,
        workspace_name: workspaceName || null,
        workspace_url: workspaceUrl || null,
        enabled,
        auto_push: autoPush,
        include_media: includeMedia,
        include_message_links: includeLinks,
        mention_channel: mentionChannel,
      };
      if (botToken.trim()) body.bot_token = botToken.trim();
      const s = await saveSlackSettings(body);
      setStatus(s);
      setBotToken("");
      setInfo("Настройки Slack сохранены");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const channelLabel =
    channels.find((c) => c.id === channelId)?.name ||
    status?.channel_name?.replace(/^#/, "") ||
    "";

  return (
    <div className={`slack-settings${embedded ? " embedded" : ""}`}>
      <section className="card">
        <IntegrationCardHeader
          provider="slack"
          title="Slack"
          subtitle={
            status?.is_configured
              ? `${workspaceName || "Workspace"} · ${status.channel_name || channelLabel}`
              : "Bot token · канал для уведомлений о задачах"
          }
          state={integrationState(status || {})}
          autoPush={status?.auto_push}
          serviceUrl={workspaceUrl || "https://slack.com"}
        />
        <p className="hint">
          Создайте приложение на{" "}
          <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer">
            api.slack.com/apps
          </a>
          , добавьте scopes бота: <code>chat:write</code>, <code>channels:read</code>,{" "}
          <code>channels:history</code>, <code>users:read</code>, установите в workspace и
          пригласите бота в канал (<code>/invite @YourBot</code>).
        </p>

        {status?.is_configured && (
          <p className="ok-line">
            Канал: {status.channel_name}
            {status.enabled && status.auto_push && " · автосоздание включено"}
          </p>
        )}
        {status?.has_token && status.token_masked && (
          <p className="hint">Token сохранён: {status.token_masked}</p>
        )}

        <form onSubmit={handleSave}>
          <label>
            Bot User OAuth Token
            <input
              type="password"
              value={botToken}
              onChange={(e) => setBotToken(e.target.value)}
              placeholder={status?.has_token ? "Новый xoxb-… (оставьте пустым)" : "xoxb-…"}
            />
          </label>

          <div className="row-btns">
            <button type="button" onClick={handleTest} disabled={testing || loading}>
              {testing ? "Проверка…" : "Проверить подключение"}
            </button>
            <button type="button" onClick={loadChannels} disabled={loading}>
              Загрузить каналы
            </button>
          </div>

          {channels.length > 0 && (
            <label>
              Канал для уведомлений
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)}>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.name}
                    {c.is_private ? " (private)" : ""}
                    {c.num_members != null ? ` · ${c.num_members}` : ""}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="toggles">
            <label className="check">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
              Интеграция включена
            </label>
            <label className="check">
              <input type="checkbox" checked={autoPush} onChange={(e) => setAutoPush(e.target.checked)} />
              Отправлять сообщение в Slack при новой задаче
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={mentionChannel}
                onChange={(e) => setMentionChannel(e.target.checked)}
              />
              Упоминать @channel в сообщении
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={includeMedia}
                onChange={(e) => setIncludeMedia(e.target.checked)}
              />
              Добавлять ссылки на медиафайлы в сообщение
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
            Сохранить настройки Slack
          </button>
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      <style>{`
        .slack-settings .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem 1.15rem;
          margin-top: 1rem;
        }
        .slack-settings .hint { font-size: 0.82rem; color: var(--muted); margin: 0 0 0.75rem; line-height: 1.4; }
        .slack-settings .hint code { font-size: 0.78rem; }
        .slack-settings .ok-line { color: #4ade80; font-size: 0.85rem; margin: 0 0 0.5rem; }
        .slack-settings label { display: block; margin-bottom: 0.65rem; font-size: 0.78rem; color: var(--muted); }
        .slack-settings input, .slack-settings select {
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
          background: #e01e5a; color: #fff; border: none;
          padding: 0.5rem 1rem; border-radius: 8px; margin-top: 0.25rem;
        }
        .error { color: #f87171; font-size: 0.85rem; white-space: pre-wrap; word-break: break-word; }
        .info { color: #4ade80; font-size: 0.85rem; }
      `}</style>
    </div>
  );
}
