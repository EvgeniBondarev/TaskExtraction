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
import { IntegrationFormStep } from "./integrations/IntegrationFormStep";
import type { IntegrationSettingsProps } from "./integrations/integrationSettingsProps";
import { IntegrationCardHeader, integrationState } from "./IntegrationCardHeader";
import { useI18n } from "../i18n";

export function SlackSettings({ embedded, hideHeader, onSaved }: IntegrationSettingsProps = {}) {
  const { messages: t } = useI18n();
  const sl = t.settings.integrations.slack;
  const c = t.settings.common;
  const intl = t.settings.integrations;
  const hub = Boolean(hideHeader);
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
    reload().catch(() => setError(sl.loadFailed));
  }, [reload]);

  const loadChannels = async () => {
    setLoading(true);
    setError("");
    try {
      const list = await fetchSlackChannels(creds());
      setChannels(list);
      if (list.length && !channelId) setChannelId(list[0].id);
      setInfo(`${sl.channelsFound} ${list.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : sl.channelsError);
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
            ? `${intl.connected} ${r.workspace_name || sl.workspaceFallback} · ${sl.botPrefix}${r.bot_name}`
            : r.message
        );
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
      setInfo(sl.saved);
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : c.error);
    } finally {
      setLoading(false);
    }
  };

  const credentialsFields = (
    <>
      <label>
        Bot User OAuth Token
        <input
          type="password"
          value={botToken}
          onChange={(e) => setBotToken(e.target.value)}
          placeholder={status?.has_token ? sl.tokenPlaceholderKeep : sl.tokenPlaceholderNew}
        />
      </label>
      {status?.has_token && status.token_masked && (
        <p className={hub ? "int-step-hint" : "hint"}>Token сохранён: {status.token_masked}</p>
      )}
      <div className="row-btns">
        <button type="button" onClick={handleTest} disabled={testing || loading}>
          {testing ? c.testing : intl.testConnection}
        </button>
        {!hub && (
          <button type="button" onClick={loadChannels} disabled={loading}>
            {sl.loadChannels}
          </button>
        )}
      </div>
    </>
  );

  const destinationFields = (
    <>
      {hub && (
        <div className="row-btns">
          <button type="button" onClick={loadChannels} disabled={loading}>
            {loading ? c.loading : sl.loadChannels}
          </button>
        </div>
      )}
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
    </>
  );

  const toggleFields = (
    <div className="toggles">
      <label className="check">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>{hub ? sl.enableHub : intl.enableFull}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={autoPush} onChange={(e) => setAutoPush(e.target.checked)} />
        <span>{hub ? sl.autoSendHub : sl.autoSendFull}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={mentionChannel} onChange={(e) => setMentionChannel(e.target.checked)} />
        <span>Упоминать @channel в сообщении</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={includeMedia} onChange={(e) => setIncludeMedia(e.target.checked)} />
        <span>{hub ? sl.mediaLinksHub : sl.mediaLinksFull}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={includeLinks} onChange={(e) => setIncludeLinks(e.target.checked)} />
        <span>Добавлять ссылку на Telegram</span>
      </label>
    </div>
  );

  return (
    <div className={`slack-settings${embedded ? " embedded" : ""}${hub ? " int-form--hub" : ""}`}>
      <section className="card">
        {!hub && (
          <>
            <IntegrationCardHeader
              provider="slack"
              title="Slack"
              subtitle={
                status?.is_configured
                  ? `${workspaceName || "Workspace"} · ${status.channel_name || ""}`
                  : "Bot token · канал для уведомлений"
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
              , scopes: chat:write, channels:read. Пригласите бота в канал: /invite @YourBot
            </p>
            {status?.is_configured && (
              <p className="ok-line">
                Канал: {status.channel_name}
                {status.enabled && status.auto_push && " · автосоздание включено"}
              </p>
            )}
          </>
        )}

        {hub && status?.is_configured && (
          <p className="int-ok">
            Канал: {status.channel_name}
            {status.enabled && status.auto_push && " · авто включено"}
          </p>
        )}

        {hub && (
          <details className="int-help">
            <summary>Как настроить Slack-бота?</summary>
            <p>
              Приложение на{" "}
              <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer">
                api.slack.com/apps
              </a>
              : scopes chat:write, channels:read. Установите в workspace и выполните /invite @YourBot в канале.
            </p>
          </details>
        )}

        <form onSubmit={handleSave}>
          {hub ? (
            <>
              <IntegrationFormStep step={1} title={sl.step1Title} hint={sl.step1Hint}>
                {credentialsFields}
              </IntegrationFormStep>
              <IntegrationFormStep step={2} title={sl.step2Title} hint={sl.step2Hint}>
                {destinationFields}
              </IntegrationFormStep>
              <IntegrationFormStep step={3} title="Включение и автоматизация">
                {toggleFields}
                <button type="submit" className="primary" disabled={loading} style={{ background: "#e01e5a" }}>
                  {loading ? "Сохранение…" : "Сохранить"}
                </button>
              </IntegrationFormStep>
            </>
          ) : (
            <>
              {credentialsFields}
              {destinationFields}
              {toggleFields}
              <button type="submit" className="primary" disabled={loading}>
                Сохранить настройки Slack
              </button>
            </>
          )}
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      {!hub && (
        <style>{`
        .slack-settings .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem 1.15rem;
          margin-top: 1rem;
        }
        .slack-settings .hint { font-size: 0.82rem; color: var(--muted); margin: 0 0 0.75rem; line-height: 1.4; }
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
      )}
    </div>
  );
}
