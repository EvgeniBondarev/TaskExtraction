import { useCallback, useEffect, useState } from "react";
import {
  fetchTrelloBoards,
  fetchTrelloLists,
  fetchTrelloStatus,
  saveTrelloSettings,
  testTrelloConnection,
  TrelloBoard,
  TrelloCredentials,
  TrelloList,
  TrelloStatus,
} from "../api/integrations/trello";
import { IntegrationFormStep } from "./integrations/IntegrationFormStep";
import type { IntegrationSettingsProps } from "./integrations/integrationSettingsProps";
import { IntegrationCardHeader, integrationState } from "./IntegrationCardHeader";

export function TrelloSettings({ embedded, hideHeader, onSaved }: IntegrationSettingsProps = {}) {
  const hub = Boolean(hideHeader);
  const [status, setStatus] = useState<TrelloStatus | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [token, setToken] = useState("");
  const [boards, setBoards] = useState<TrelloBoard[]>([]);
  const [lists, setLists] = useState<TrelloList[]>([]);
  const [boardId, setBoardId] = useState("");
  const [listId, setListId] = useState("");
  const [enabled, setEnabled] = useState(false);
  const [autoPush, setAutoPush] = useState(false);
  const [includeMedia, setIncludeMedia] = useState(true);
  const [includeLinks, setIncludeLinks] = useState(true);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const creds = (): TrelloCredentials => ({
    api_key: apiKey.trim() || undefined,
    token: token.trim() || undefined,
  });

  const reload = useCallback(async () => {
    const s = await fetchTrelloStatus();
    setStatus(s);
    if (s.api_key) setApiKey(s.api_key);
    if (s.board_id) setBoardId(s.board_id);
    if (s.list_id) setListId(s.list_id);
    setEnabled(s.enabled);
    setAutoPush(s.auto_push);
    setIncludeMedia(s.include_media);
    setIncludeLinks(s.include_message_links);
  }, []);

  useEffect(() => {
    reload().catch(() => setError("Не удалось загрузить настройки Trello"));
  }, [reload]);

  const authorizeUrl =
    status?.authorize_url ||
    (apiKey.trim()
      ? `https://trello.com/1/authorize?expiration=never&name=TaskExtraction&scope=read,write&response_type=token&key=${encodeURIComponent(apiKey.trim())}`
      : null);

  const loadBoards = async () => {
    setError("");
    setLoading(true);
    try {
      const list = await fetchTrelloBoards(creds());
      setBoards(list);
      if (list.length && !boardId) setBoardId(list[0].id);
      setInfo(`Найдено досок: ${list.length}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки досок");
    } finally {
      setLoading(false);
    }
  };

  const loadLists = async (bid: string) => {
    if (!bid) return;
    setLoading(true);
    setError("");
    try {
      const list = await fetchTrelloLists(bid, creds());
      setLists(list);
      if (list.length && !listId) setListId(list[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка загрузки списков");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (boardId && boards.length) {
      loadLists(boardId).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId]);

  const handleTest = async () => {
    setTesting(true);
    setError("");
    setInfo("");
    try {
      const r = await testTrelloConnection(creds());
      if (r.success) {
        setInfo(r.account_name ? `Подключено: ${r.account_name}` : r.message);
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
      const board = boards.find((b) => b.id === boardId);
      const lst = lists.find((l) => l.id === listId);
      const body: Record<string, unknown> = {
        api_key: apiKey.trim(),
        board_id: boardId || null,
        board_name: board?.name || null,
        list_id: listId || null,
        list_name: lst?.name || null,
        enabled,
        auto_push: autoPush,
        include_media: includeMedia,
        include_message_links: includeLinks,
      };
      if (token.trim()) body.token = token.trim();
      const s = await saveTrelloSettings(body);
      setStatus(s);
      setToken("");
      setInfo("Настройки Trello сохранены");
      onSaved?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сохранения");
    } finally {
      setLoading(false);
    }
  };

  const selectedBoard = boards.find((b) => b.id === boardId);

  const credentialsFields = (
    <>
      <label>
        API Key
        <input value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="Ключ из Trello Power-Ups" />
      </label>
      {authorizeUrl && (
        <p className="auth-block">
          <a className="auth-link" href={authorizeUrl} target="_blank" rel="noreferrer">
            Получить Token (авторизация Trello)
          </a>
        </p>
      )}
      <label>
        Token
        <input
          type="password"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder={status?.has_token ? "Новый token (оставьте пустым)" : "Вставьте token после авторизации"}
        />
      </label>
      {status?.has_token && status.token_masked && (
        <p className={hub ? "int-step-hint" : "hint"}>Token сохранён: {status.token_masked}</p>
      )}
      <div className="row-btns">
        <button type="button" onClick={handleTest} disabled={testing || loading}>
          {testing ? "Проверка…" : "Проверить подключение"}
        </button>
        {!hub && (
          <button type="button" onClick={loadBoards} disabled={loading}>
            Загрузить доски
          </button>
        )}
      </div>
    </>
  );

  const destinationFields = (
    <>
      {hub && (
        <div className="row-btns">
          <button type="button" onClick={loadBoards} disabled={loading}>
            {loading ? "Загрузка…" : "Загрузить доски"}
          </button>
        </div>
      )}
      {boards.length > 0 && (
        <label>
          Доска
          <select
            value={boardId}
            onChange={(e) => {
              setBoardId(e.target.value);
              setListId("");
              setLists([]);
            }}
          >
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {selectedBoard && lists.length > 0 && (
        <label>
          Список для новых карточек
          <select value={listId} onChange={(e) => setListId(e.target.value)}>
            {lists.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
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
        <span>{hub ? "Включить интеграцию Trello" : "Интеграция включена"}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={autoPush} onChange={(e) => setAutoPush(e.target.checked)} />
        <span>{hub ? "Автоматически создавать карточку при новой задаче" : "Создавать карточку в Trello при новой задаче"}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={includeMedia} onChange={(e) => setIncludeMedia(e.target.checked)} />
        <span>{hub ? "Прикреплять медиафайлы" : "Прикреплять медиафайлы к карточке"}</span>
      </label>
      <label className="check">
        <input type="checkbox" checked={includeLinks} onChange={(e) => setIncludeLinks(e.target.checked)} />
        <span>{hub ? "Добавлять ссылки на Telegram и URL" : "Добавлять ссылки (Telegram, URL из сообщения)"}</span>
      </label>
    </div>
  );

  return (
    <div className={`trello-settings${embedded ? " embedded" : ""}${hub ? " int-form--hub" : ""}`}>
      <section className="card">
        {!hub && (
          <>
            <IntegrationCardHeader
              provider="trello"
              title="Trello"
              subtitle={
                status?.is_configured
                  ? `${status.board_name || "доска"} → ${status.list_name || "список"}`
                  : "API Key + Token · список для новых карточек"
              }
              state={integrationState(status || {})}
              autoPush={status?.auto_push}
              serviceUrl="https://trello.com"
            />
            <p className="hint">
              Получите API Key на{" "}
              <a href="https://trello.com/power-ups/admin" target="_blank" rel="noreferrer">
                trello.com/power-ups/admin
              </a>
              , затем откройте ссылку авторизации и скопируйте Token.
            </p>
            {status?.is_configured && (
              <p className="ok-line">
                Настроено: {status.board_name} → {status.list_name || status.list_id}
                {status.enabled && status.auto_push && " · автосоздание включено"}
              </p>
            )}
          </>
        )}

        {hub && status?.is_configured && (
          <p className="int-ok">
            Сейчас: {status.board_name} → {status.list_name || status.list_id}
            {status.enabled && status.auto_push && " · авто включено"}
          </p>
        )}

        {hub && (
          <details className="int-help">
            <summary>Как получить API Key и Token?</summary>
            <p>
              API Key — на{" "}
              <a href="https://trello.com/power-ups/admin" target="_blank" rel="noreferrer">
                trello.com/power-ups/admin
              </a>
              . Token — через ссылку «Получить Token» после ввода API Key.
            </p>
          </details>
        )}

        <form onSubmit={handleSave}>
          {hub ? (
            <>
              <IntegrationFormStep step={1} title="Доступ к Trello" hint="Проверьте подключение перед выбором доски">
                {credentialsFields}
              </IntegrationFormStep>
              <IntegrationFormStep step={2} title="Доска и список" hint="Карточки будут создаваться в выбранном списке">
                {destinationFields}
              </IntegrationFormStep>
              <IntegrationFormStep step={3} title="Включение и автоматизация">
                {toggleFields}
                <button type="submit" className="primary" disabled={loading} style={{ background: "#0079bf" }}>
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
                Сохранить настройки Trello
              </button>
            </>
          )}
        </form>
      </section>

      {error && <p className="error">{error}</p>}
      {info && <p className="info">{info}</p>}

      {!hub && (
        <style>{`
        .trello-settings .card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 1rem 1.15rem;
          margin-top: 1rem;
        }
        .trello-settings .hint { font-size: 0.82rem; color: var(--muted); margin: 0 0 0.75rem; line-height: 1.4; }
        .trello-settings .ok-line { color: #4ade80; font-size: 0.85rem; margin: 0 0 0.5rem; }
        .trello-settings label { display: block; margin-bottom: 0.65rem; font-size: 0.78rem; color: var(--muted); }
        .trello-settings input, .trello-settings select {
          display: block; width: 100%; margin-top: 0.2rem;
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); border-radius: 8px; padding: 0.45rem 0.55rem; font: inherit;
        }
        .auth-block { margin: 0.25rem 0 0.75rem; }
        .auth-link { font-size: 0.85rem; font-weight: 600; color: #0079bf; }
        .row-btns { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.5rem 0; }
        .row-btns button {
          background: var(--bg); border: 1px solid var(--border);
          color: var(--text); padding: 0.4rem 0.75rem; border-radius: 8px;
        }
        .toggles { display: flex; flex-direction: column; gap: 0.35rem; margin: 0.75rem 0; }
        .check { display: flex; align-items: center; gap: 0.5rem; color: var(--text); font-size: 0.85rem; }
        .check input { width: auto; margin: 0; }
        .primary {
          background: #0079bf; color: #fff; border: none;
          padding: 0.5rem 1rem; border-radius: 8px; margin-top: 0.25rem;
        }
        .error { color: #f87171; font-size: 0.85rem; }
        .info { color: #4ade80; font-size: 0.85rem; }
      `}</style>
      )}
    </div>
  );
}
