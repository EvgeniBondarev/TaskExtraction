import { AppLogo } from "./AppLogo";

export type AppMainPage = "tasks" | "feed" | "settings";

export type NavBadges = {
  tasks: number;
  feed: number;
};

interface Props {
  page: AppMainPage;
  badges?: NavBadges;
  onNavigate: (page: AppMainPage) => void;
  onHome: () => void;
  onWelcome: () => void;
  onLogout: () => void;
}

function formatBadgeCount(n: number): string {
  if (n > 99) return "99+";
  return String(n);
}

function NavBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span className="nav-badge" aria-hidden>
      {formatBadgeCount(count)}
    </span>
  );
}

export function AppTopBar({ page, badges, onNavigate, onHome, onWelcome, onLogout }: Props) {
  const tasksUnread = badges?.tasks ?? 0;
  const feedUnread = badges?.feed ?? 0;
  return (
    <header className="app-top-bar">
      <button type="button" className="app-title" onClick={onHome} title="На главную">
        <AppLogo size={30} />
        <span>TaskExtraction</span>
      </button>
      <nav aria-label="Основная навигация">
        <button
          type="button"
          className={page === "tasks" ? "active" : ""}
          onClick={() => onNavigate("tasks")}
          aria-label={tasksUnread > 0 ? `Задачи, ${tasksUnread} новых` : "Задачи"}
        >
          Задачи
          <NavBadge count={tasksUnread} />
        </button>
        <button
          type="button"
          className={page === "feed" ? "active" : ""}
          onClick={() => onNavigate("feed")}
          aria-label={feedUnread > 0 ? `Лента, ${feedUnread} новых` : "Лента"}
        >
          Лента
          <NavBadge count={feedUnread} />
        </button>
        <button
          type="button"
          className={page === "settings" ? "active" : ""}
          onClick={() => onNavigate("settings")}
        >
          Настройки
        </button>
        <button type="button" className="nav-about" onClick={onWelcome}>
          О продукте
        </button>
        <button
          type="button"
          className="nav-about"
          onClick={onLogout}
          title="Сбросить сессию панели (данные сохранятся)"
        >
          Выйти из панели
        </button>
      </nav>
    </header>
  );
}
