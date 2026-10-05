import { ArrowSquareOut, Briefcase, ChatCircleDots, Lightbulb, UsersThree } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import { apiFetch } from "../api/http";
import {
  fetchTelegramConnections,
  fetchTelegramPreferences,
  fetchTelegramSources,
  telegramGroupAvatarUrl,
  updateTelegramPreferences,
} from "../api/telegram";
import type { TelegramConnections, TelegramSources as Sources } from "../api/telegram";
import { useI18n } from "../i18n";
import { SettingsFormSkeleton } from "./PageSkeletons";

export function TelegramSources() {
  const { messages } = useI18n();
  const t = messages.panel.settings.telegram;
  const [sources, setSources] = useState<Sources | null>(null);
  const [links, setLinks] = useState<{ group: string; business: string } | null>(null);
  const [connections, setConnections] = useState<TelegramConnections | null>(null);
  const [repliesOn, setRepliesOn] = useState(true);
  const [savingReplies, setSavingReplies] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      fetchTelegramSources(),
      fetchTelegramConnections(),
      fetchTelegramPreferences(),
      apiFetch("/api/telegram/connect-links").then(async (response) => {
        if (!response.ok) throw new Error();
        return response.json() as Promise<{ group: string; business: string }>;
      }),
    ])
      .then(([source, connected, preferences, connectLinks]) => {
        setSources(source);
        setConnections(connected);
        setRepliesOn(preferences.status_notifications_enabled);
        setLinks(connectLinks);
      })
      .catch(() => setError(t.loadError));
  }, [t.loadError]);

  if (error && !sources) return <p className="te-alert te-alert--error">{error}</p>;
  if (!sources) return <SettingsFormSkeleton fields={3} />;

  const bot = sources.bot_username || "bot";
  const groups = connections?.groups ?? [];

  async function toggleReplies(enabled: boolean) {
    const previous = repliesOn;
    setRepliesOn(enabled);
    setSavingReplies(true);
    setError("");
    try {
      const preferences = await updateTelegramPreferences(enabled);
      setRepliesOn(preferences.status_notifications_enabled);
    } catch {
      setRepliesOn(previous);
      setError(t.saveError);
    } finally {
      setSavingReplies(false);
    }
  }

  return (
    <div className="te-stack">
      {error && <p className="te-alert te-alert--error">{error}</p>}

      <section className="te-panel">
        <header className="te-panel__head">
          <span className="te-panel__icon" aria-hidden>
            <UsersThree size={22} />
          </span>
          <div>
            <h3>{t.groupTitle}</h3>
            <p>{t.groupLead}</p>
          </div>
        </header>

        {sources.bot_configured ? (
          <>
            <ol className="te-steps">
              {t.groupSteps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="te-panel__actions">
              {links?.group && (
                <a className="te-btn te-btn--primary" href={links.group}>
                  {t.addToGroup}
                  <ArrowSquareOut size={16} aria-hidden />
                </a>
              )}
              <span className="te-muted">{t.botReady.replace("{bot}", bot)}</span>
            </div>

            <div className="te-example">
              <Lightbulb size={18} weight="fill" aria-hidden />
              <div>
                <strong>{t.exampleTitle}</strong>
                <p>{t.exampleText}</p>
              </div>
            </div>

            <div className="te-subsection">
              <h4>
                {t.connectedGroups}
                <span className="te-count">{groups.length}</span>
              </h4>
              {groups.length === 0 ? (
                <p className="te-muted">{t.noGroups}</p>
              ) : (
                <ul className="te-groups">
                  {groups.map((group) => (
                    <li key={group.source_id}>
                      {group.has_avatar ? (
                        <img src={telegramGroupAvatarUrl(group.source_id)} alt="" />
                      ) : (
                        <span className="te-groups__ph" aria-hidden>
                          {(group.title || "G").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span>{group.title || t.groupFallback}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        ) : (
          <p className="te-alert te-alert--warn">{t.botMissing}</p>
        )}
      </section>

      <section className="te-panel">
        <header className="te-panel__head">
          <span className="te-panel__icon" aria-hidden>
            <Briefcase size={22} />
          </span>
          <div>
            <h3>{t.businessTitle}</h3>
            <p>{t.businessLead}</p>
          </div>
        </header>
        <ol className="te-steps">
          {t.businessSteps.map((step) => (
            <li key={step}>{step.replace("{bot}", bot)}</li>
          ))}
        </ol>
        {links?.business && (
          <div className="te-panel__actions">
            <a className="te-btn te-btn--ghost" href={links.business}>
              {t.businessLink}
              <ArrowSquareOut size={16} aria-hidden />
            </a>
          </div>
        )}
      </section>

      <section className="te-panel">
        <header className="te-panel__head">
          <span className="te-panel__icon" aria-hidden>
            <ChatCircleDots size={22} />
          </span>
          <div>
            <h3>{t.repliesTitle}</h3>
            <p>{t.repliesLead}</p>
          </div>
        </header>
        <div className="te-replies-row">
          <label className="te-switch">
            <input
              type="checkbox"
              checked={repliesOn}
              disabled={savingReplies}
              onChange={(e) => void toggleReplies(e.target.checked)}
            />
            <span className="te-switch__track" aria-hidden />
            <span>{repliesOn ? t.repliesOn : t.repliesOff}</span>
          </label>
          <div className={`te-bot-preview${repliesOn ? "" : " is-off"}`} aria-label={t.repliesPreview}>
            <small>{t.repliesPreview}</small>
            {t.repliesSample.map((line) => (
              <span key={line} className="te-bot-preview__bubble">
                <b>@{bot}</b>
                {line}
              </span>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
