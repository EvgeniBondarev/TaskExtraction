import { useCallback, useEffect, useMemo, useState } from "react";
import {
  CHAT_TYPE_LABELS,
  ChatItem,
  chatAvatarUrl,
  fetchChats,
  saveChatSelection,
  syncTelegramChats,
} from "../api/chats";
import { ChatSyncLoader } from "./ChatSyncLoader";
import { useI18n } from "../i18n";
import "../styles/chat-picker.css";

interface Props {
  onSaved?: () => void;
  submitLabel?: string;
  showSyncButton?: boolean;
}

function matchesChat(c: ChatItem, q: string): boolean {
  const typeLabel = (CHAT_TYPE_LABELS[c.chat_type || "unknown"] || c.chat_type || "").toLowerCase();
  return (
    (c.title || "").toLowerCase().includes(q) ||
    (c.username || "").toLowerCase().includes(q) ||
    typeLabel.includes(q) ||
    String(c.telegram_chat_id).includes(q)
  );
}

function sortByTitle(a: ChatItem, b: ChatItem): number {
  return (a.title || "").localeCompare(b.title || "", "ru", { sensitivity: "base" });
}

function initials(title: string | null): string {
  const t = (title || "?").trim();
  const parts = t.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return t.slice(0, 2).toUpperCase();
}

function ChatRow({
  chat,
  checked,
  onToggle,
  activeLabel,
}: {
  chat: ChatItem;
  checked: boolean;
  onToggle: () => void;
  activeLabel: string;
}) {
  return (
    <li>
      <label className={checked ? "chat-row selected" : "chat-row"}>
        <input type="checkbox" checked={checked} onChange={onToggle} />
        <span className="check-ui" aria-hidden />
        {chat.has_photo ? (
          <img
            src={chatAvatarUrl(chat.id)}
            alt=""
            className="avatar"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        ) : (
          <span className="avatar placeholder">{initials(chat.title)}</span>
        )}
        <span className="meta">
          <span className="title">{chat.title || `Chat ${chat.telegram_chat_id}`}</span>
          <span className="sub">
            {CHAT_TYPE_LABELS[chat.chat_type || "unknown"] || chat.chat_type}
            {chat.username && (
              <>
                {" "}
                · <span className="username">@{chat.username}</span>
              </>
            )}
          </span>
        </span>
        {checked && <span className="active-badge">{activeLabel}</span>}
      </label>
    </li>
  );
}

export function ChatPicker({ onSaved, submitLabel, showSyncButton = true }: Props) {
  const { messages: t } = useI18n();
  const cp = t.settings.chatPicker;
  const c = t.settings.common;
  const resolvedSubmit = submitLabel ?? cp.defaultSubmit;
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filter, setFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    const data = await fetchChats();
    setChats(data.items);
    setSelected(new Set(data.items.filter((c) => c.is_monitored).map((c) => c.telegram_chat_id)));
  }, []);

  const runSync = useCallback(async () => {
    setSyncing(true);
    setError("");
    try {
      const data = await syncTelegramChats();
      setChats(data.items);
      setSelected((prev) => {
        const next = new Set(prev);
        data.items.forEach((c) => {
          if (c.is_monitored) next.add(c.telegram_chat_id);
        });
        return next;
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : cp.syncError);
    } finally {
      setSyncing(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await fetchChats();
        if (cancelled) return;
        if (data.total === 0) {
          setSyncing(true);
          const synced = await syncTelegramChats();
          if (cancelled) return;
          setChats(synced.items);
          setSelected(
            new Set(synced.items.filter((c) => c.is_monitored).map((c) => c.telegram_chat_id))
          );
        } else {
          await load();
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : cp.loadError);
      } finally {
        if (!cancelled) {
          setLoading(false);
          setSyncing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const q = filter.trim().toLowerCase();
  const isSearching = q.length > 0;

  const filtered = useMemo(() => {
    if (!isSearching) return chats;
    return chats.filter((c) => matchesChat(c, q));
  }, [chats, isSearching, q]);

  const activeChats = useMemo(
    () => filtered.filter((c) => selected.has(c.telegram_chat_id)).sort(sortByTitle),
    [filtered, selected]
  );

  const availableChats = useMemo(
    () => filtered.filter((c) => !selected.has(c.telegram_chat_id)).sort(sortByTitle),
    [filtered, selected]
  );

  const searchResults = useMemo(() => {
    if (!isSearching) return [];
    return [...activeChats, ...availableChats];
  }, [isSearching, activeChats, availableChats]);

  const savedActiveCount = useMemo(
    () => chats.filter((c) => c.is_monitored).length,
    [chats]
  );

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSave = async () => {
    if (selected.size === 0) {
      setError(cp.selectAtLeastOne);
      return;
    }
    setLoading(true);
    setError("");
    try {
      await saveChatSelection([...selected]);
      await load();
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : cp.saveError);
    } finally {
      setLoading(false);
    }
  };

  const listLoading = (loading && chats.length === 0) || syncing;
  const hasNoActive = selected.size === 0 && !listLoading;

  return (
    <div className="chat-picker">
      <div className="picker-stats">
        <span className="stat-pill active-stat">
          <span className="stat-dot" />
          {cp.monitoredCount} <strong>{selected.size}</strong>
        </span>
        <span className="stat-pill muted-stat">
          {cp.totalInTelegram} {chats.length}
        </span>
      </div>

      {hasNoActive && !isSearching && (
        <div className="empty-active-banner" role="status">
          <div className="banner-icon" aria-hidden>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path
                d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <div>
            <strong>{cp.noActiveTitle}</strong>
            <p>{cp.noActiveLead}</p>
          </div>
        </div>
      )}

      <div className="search-bar">
        <span className="search-icon" aria-hidden>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
            <path d="M20 20l-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
        </span>
        <input
          type="search"
          placeholder={cp.searchPlaceholder}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          aria-label={cp.searchAria}
        />
        {filter && (
          <button type="button" className="search-clear" onClick={() => setFilter("")} aria-label={cp.clearSearch}>
            ×
          </button>
        )}
        {showSyncButton && (
          <button type="button" className="sync-btn" onClick={runSync} disabled={syncing} title={cp.syncTitle}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M21 12a9 9 0 11-2.64-6.36M21 3v6h-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            {syncing ? cp.syncing : cp.syncShort}
          </button>
        )}
      </div>

      {isSearching && (
        <p className="search-hint">
          {cp.found} {searchResults.length}
          {searchResults.length === 0 && cp.foundEmpty}
        </p>
      )}

      {error && <p className="picker-error">{error}</p>}

      <div className={`chat-list-shell${listLoading ? " chat-list-shell--loading" : ""}`}>
        {listLoading ? (
          <ChatSyncLoader mode={syncing && chats.length > 0 ? "sync" : "initial"} />
        ) : isSearching ? (
          <ul className="chat-list">
            {searchResults.length === 0 ? (
              <li className="list-empty">{cp.noSearchResults.replace("{query}", filter)}</li>
            ) : (
              searchResults.map((c) => (
                <ChatRow
                  key={c.id}
                  chat={c}
                  checked={selected.has(c.telegram_chat_id)}
                  onToggle={() => toggle(c.telegram_chat_id)}
                  activeLabel={cp.activeBadge}
                />
              ))
            )}
          </ul>
        ) : (
          <>
            {activeChats.length > 0 && (
              <section className="chat-section">
                <header className="section-head active-head">
                  <h4>{cp.monitoredSection}</h4>
                  <span className="section-count">{activeChats.length}</span>
                </header>
                <ul className="chat-list">
                  {activeChats.map((c) => (
                    <ChatRow
                      key={c.id}
                      chat={c}
                      checked
                      onToggle={() => toggle(c.telegram_chat_id)}
                      activeLabel={cp.activeBadge}
                    />
                  ))}
                </ul>
              </section>
            )}

            {availableChats.length > 0 && (
              <section className="chat-section">
                <header className="section-head">
                  <h4>{activeChats.length > 0 ? cp.addChatsTitle : cp.allChatsTitle}</h4>
                  <span className="section-count">{availableChats.length}</span>
                </header>
                <ul className="chat-list">
                  {availableChats.map((c) => (
                    <ChatRow
                      key={c.id}
                      chat={c}
                      checked={false}
                      onToggle={() => toggle(c.telegram_chat_id)}
                      activeLabel={cp.activeBadge}
                    />
                  ))}
                </ul>
              </section>
            )}

            {activeChats.length === 0 && availableChats.length === 0 && (
              <p className="list-empty">{cp.listEmpty}</p>
            )}
          </>
        )}
      </div>

      {savedActiveCount !== selected.size && selected.size > 0 && (
        <p className="unsaved-hint">{cp.unsavedHint}</p>
      )}

      <button type="button" className="save-btn" onClick={handleSave} disabled={loading || listLoading}>
        {loading ? c.saving : resolvedSubmit}
        {selected.size > 0 && !loading && (
          <span className="save-count">{selected.size}</span>
        )}
      </button>

      <style>{`
        .chat-picker {
          width: 100%;
          max-width: 100%;
        }
        .picker-stats {
          display: flex;
          flex-wrap: wrap;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }
        .stat-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.8rem;
          padding: 0.35rem 0.7rem;
          border-radius: 999px;
          border: 1px solid var(--border);
          background: var(--bg);
        }
        .stat-pill strong { color: var(--text); font-weight: 700; }
        .active-stat {
          border-color: rgba(59, 130, 246, 0.45);
          background: rgba(59, 130, 246, 0.1);
          color: #93c5fd;
        }
        .stat-dot {
          width: 0.45rem;
          height: 0.45rem;
          border-radius: 50%;
          background: #4ade80;
          box-shadow: 0 0 6px rgba(74, 222, 128, 0.7);
        }
        .muted-stat { color: var(--muted); }

        .empty-active-banner {
          display: flex;
          gap: 1rem;
          align-items: flex-start;
          padding: 1rem 1.1rem;
          margin-bottom: 1rem;
          border-radius: 12px;
          border: 1px dashed rgba(59, 130, 246, 0.45);
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(99, 102, 241, 0.06) 100%);
        }
        .banner-icon {
          flex-shrink: 0;
          width: 2.75rem;
          height: 2.75rem;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.15);
        }
        .empty-active-banner strong {
          display: block;
          font-size: 0.95rem;
          margin-bottom: 0.25rem;
          color: var(--text);
        }
        .empty-active-banner p {
          margin: 0;
          font-size: 0.85rem;
          color: var(--muted);
          line-height: 1.45;
        }

        .search-bar {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.65rem;
          padding: 0.35rem 0.5rem 0.35rem 0.75rem;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 12px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .search-bar:focus-within {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }
        .search-icon {
          color: var(--muted);
          display: flex;
          flex-shrink: 0;
        }
        .search-bar input {
          flex: 1;
          min-width: 0;
          border: none;
          background: transparent;
          color: var(--text);
          padding: 0.45rem 0;
          font: inherit;
          font-size: 0.9rem;
        }
        .search-bar input:focus { outline: none; }
        .search-bar input::placeholder { color: var(--muted); opacity: 0.85; }
        .search-clear {
          flex-shrink: 0;
          width: 1.75rem;
          height: 1.75rem;
          border: none;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.06);
          color: var(--muted);
          font-size: 1.1rem;
          line-height: 1;
          cursor: pointer;
        }
        .search-clear:hover { color: var(--text); background: rgba(255, 255, 255, 0.1); }
        .sync-btn {
          flex-shrink: 0;
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.4rem 0.65rem;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: var(--surface);
          color: var(--muted);
          font-size: 0.78rem;
          font-weight: 500;
          cursor: pointer;
        }
        .sync-btn:hover:not(:disabled) {
          border-color: var(--accent);
          color: #93c5fd;
        }
        .sync-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        .search-hint {
          margin: 0 0 0.65rem;
          font-size: 0.78rem;
          color: var(--muted);
        }

        .picker-error {
          color: #f87171;
          font-size: 0.85rem;
          padding: 0.55rem 0.75rem;
          background: rgba(248, 113, 113, 0.08);
          border-radius: 8px;
          margin-bottom: 0.65rem;
        }

        .chat-section + .chat-section {
          border-top: 1px solid var(--border);
        }
        .section-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.55rem 1rem;
          background: rgba(0, 0, 0, 0.2);
          position: sticky;
          top: 0;
          z-index: 1;
          backdrop-filter: blur(8px);
        }
        .section-head h4 {
          margin: 0;
          font-size: 0.72rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--muted);
        }
        .active-head {
          background: rgba(59, 130, 246, 0.1);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        }
        .active-head h4 { color: #93c5fd; }
        .section-count {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--muted);
          background: var(--bg);
          padding: 0.1rem 0.45rem;
          border-radius: 999px;
        }
        .active-head .section-count {
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.15);
        }

        .chat-list {
          list-style: none;
          margin: 0;
          padding: 0;
        }
        .chat-list .list-empty {
          padding: 2rem 1rem;
          text-align: center;
          color: var(--muted);
          font-size: 0.88rem;
        }
        .chat-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          cursor: pointer;
          border-bottom: 1px solid rgba(45, 58, 79, 0.6);
          transition: background 0.12s;
          position: relative;
        }
        .chat-list li:last-child .chat-row { border-bottom: none; }
        .chat-row:hover { background: rgba(255, 255, 255, 0.03); }
        .chat-row.selected {
          background: linear-gradient(90deg, rgba(59, 130, 246, 0.14) 0%, rgba(59, 130, 246, 0.04) 100%);
          border-left: 3px solid var(--accent);
          padding-left: calc(1rem - 3px);
        }
        .chat-row input {
          position: absolute;
          opacity: 0;
          width: 0;
          height: 0;
          pointer-events: none;
        }
        .check-ui {
          width: 1.15rem;
          height: 1.15rem;
          flex-shrink: 0;
          border-radius: 5px;
          border: 2px solid var(--border);
          background: var(--bg);
          transition: all 0.15s;
        }
        .chat-row.selected .check-ui {
          border-color: var(--accent);
          background: var(--accent);
          box-shadow: inset 0 0 0 2px var(--surface);
        }
        .chat-row.selected .check-ui::after {
          content: "";
          display: block;
          width: 100%;
          height: 100%;
          background: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12'%3E%3Cpath d='M2 6l3 3 5-6' stroke='white' stroke-width='2' fill='none' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/10px no-repeat;
        }
        .avatar {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;
          border: 2px solid var(--border);
        }
        .chat-row.selected .avatar { border-color: rgba(59, 130, 246, 0.5); }
        .avatar.placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #334155, #1e293b);
          color: #94a3b8;
          font-size: 0.75rem;
          font-weight: 700;
        }
        .meta {
          flex: 1;
          min-width: 0;
          display: flex;
          flex-direction: column;
          gap: 0.15rem;
        }
        .title {
          font-size: 0.92rem;
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .sub {
          font-size: 0.75rem;
          color: var(--muted);
        }
        .username { color: #60a5fa; }
        .active-badge {
          flex-shrink: 0;
          font-size: 0.62rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          padding: 0.2rem 0.45rem;
          border-radius: 5px;
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }

        .unsaved-hint {
          margin: -0.5rem 0 0.65rem;
          font-size: 0.78rem;
          color: #fbbf24;
          text-align: center;
        }
        .save-btn {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          background: linear-gradient(135deg, #3b82f6, #2563eb);
          border: none;
          color: #fff;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font: inherit;
          font-weight: 600;
          cursor: pointer;
          transition: transform 0.1s, opacity 0.15s;
        }
        .save-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .save-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; }
        .save-count {
          font-size: 0.75rem;
          font-weight: 700;
          background: rgba(255, 255, 255, 0.2);
          padding: 0.15rem 0.45rem;
          border-radius: 999px;
        }
      `}</style>
    </div>
  );
}
