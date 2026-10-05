import { useEffect, useState } from "react";
import {
  fetchTelegramConnections,
  fetchTelegramPreferences,
  fetchTelegramSources,
  telegramGroupAvatarUrl,
  updateTelegramPreferences,
} from "../api/telegram";
import { apiFetch } from "../api/http";
import type { TelegramConnections, TelegramSources } from "../api/telegram";

export function TelegramSources() {
  const [sources, setSources] = useState<TelegramSources | null>(null);
  const [links, setLinks] = useState<{ group: string; business: string } | null>(null);
  const [connections, setConnections] = useState<TelegramConnections | null>(null);
  const [statusNotificationsEnabled, setStatusNotificationsEnabled] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
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
    ]).then(([source, connected, preferences, connectLinks]) => {
      setSources(source);
      setConnections(connected);
      setStatusNotificationsEnabled(preferences.status_notifications_enabled);
      setLinks(connectLinks);
    }).catch(() => setError("Не удалось загрузить настройки Telegram."));
  }, []);

  if (error) return <p className="wizard-error">{error}</p>;
  if (!sources) return <p className="settings-toast">Загружаем подключение Telegram…</p>;

  async function toggleStatusNotifications(enabled: boolean) {
    const previous = statusNotificationsEnabled;
    setStatusNotificationsEnabled(enabled);
    setSavingNotifications(true);
    try {
      const preferences = await updateTelegramPreferences(enabled);
      setStatusNotificationsEnabled(preferences.status_notifications_enabled);
    } catch {
      setStatusNotificationsEnabled(previous);
      setError("Не удалось сохранить настройку ответов бота.");
    } finally {
      setSavingNotifications(false);
    }
  }

  return (
    <div className="tg-wizard">
      <section className="wizard-panel">
        <header className="panel-head">
          <span className="panel-step">Шаг 1 · Рекомендуется</span>
          <h3>Подключить рабочую группу</h3>
          <p>Бот получает сообщения только из групп, в которые его добавили. QR-код, номер телефона и доступ к личному аккаунту не требуются.</p>
        </header>
        {sources.bot_configured ? (
          <>
            <p className="wizard-info">Бот @{sources.bot_username} готов к подключению.</p>
            {links?.group && <a className="btn-primary" href={links.group}>Добавить бота в группу</a>}
            <ol className="wizard-mini-steps">
              <li>Выберите рабочую группу в Telegram.</li>
              <li>Добавьте бота и отключите Privacy Mode через BotFather, либо выдайте боту права администратора.</li>
              <li>Новые сообщения появятся в ленте автоматически.</li>
            </ol>
            {connections && connections.groups.length > 0 && (
              <div className="wizard-info">
                <strong>Подключённые группы:</strong>
                <ul>
                  {connections.groups.map((group) => (
                    <li className="telegram-connected-group" key={group.source_id}>
                      {group.has_avatar ? (
                        <img src={telegramGroupAvatarUrl(group.source_id)} alt="" />
                      ) : (
                        <span className="telegram-group-placeholder" aria-hidden="true">
                          {(group.title || "Г").slice(0, 1).toUpperCase()}
                        </span>
                      )}
                      <span>{group.title || "Группа Telegram"}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <p className="wizard-error">Задайте TELEGRAM_BOT_TOKEN и TELEGRAM_BOT_USERNAME в .env, затем перезапустите API.</p>
        )}
      </section>

      <section className="wizard-panel">
        <header className="panel-head">
          <span className="panel-step">Шаг 2 · Для личных диалогов</span>
          <h3>Подключить Telegram Business</h3>
          <p>Подключите этого же бота в настройках Telegram Business и разрешите нужные чаты. Telegram передаст только сообщения разрешённых диалогов.</p>
        </header>
        <p>Сначала <a href={links?.business}>свяжите Business-аккаунт с рабочей областью</a>, затем в Telegram откройте <strong>Настройки → Telegram Business → Чат-боты</strong>.</p>
        <ol className="wizard-mini-steps">
          <li>Нажмите <strong>Добавить чат-бота</strong> и выберите @{sources.bot_username}.</li>
          <li>Для первого теста разрешите <strong>существующие чаты</strong>, <strong>новые чаты</strong> и <strong>не контакты</strong>.</li>
          <li>Добавьте исключения для личных диалогов, если это необходимо.</li>
          <li>Разрешите чтение сообщений и ответы от вашего имени, затем сохраните.</li>
        </ol>
        <p>Сообщения из Business Connection автоматически попадут в ленту и канбан.</p>
      </section>

      <section className="wizard-panel telegram-notifications-panel">
        <header className="panel-head">
          <span className="panel-step">Ответы бота</span>
          <h3>Уведомления о статусе задач</h3>
          <p>Когда задача перемещается на доске, бот отвечает на исходное сообщение в Telegram: «В работе», «Выполнено» или «Возвращено».</p>
        </header>
        <label className="telegram-setting-toggle">
          <input
            type="checkbox"
            checked={statusNotificationsEnabled}
            disabled={savingNotifications}
            onChange={(event) => void toggleStatusNotifications(event.target.checked)}
          />
          <span aria-hidden="true" className="telegram-setting-toggle__track" />
          <span>{statusNotificationsEnabled ? "Отправлять ответы в Telegram" : "Ответы в Telegram отключены"}</span>
        </label>
      </section>
    </div>
  );
}
