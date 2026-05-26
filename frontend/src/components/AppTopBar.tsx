import { AppBrandName } from "./AppBrandName";
import { AppLogo } from "./AppLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useI18n } from "../i18n";

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

export function AppTopBar({ page, badges, onNavigate, onHome, onLogout }: Props) {
  const { messages: t } = useI18n();
  const nav = t.nav;
  const tasksUnread = badges?.tasks ?? 0;
  const feedUnread = badges?.feed ?? 0;

  const tasksAria =
    tasksUnread > 0 ? `${nav.tasks}, ${tasksUnread} ${nav.tasksNew}` : nav.tasks;
  const feedAria =
    feedUnread > 0 ? `${nav.feed}, ${feedUnread} ${nav.feedNew}` : nav.feed;

  return (
    <header className="app-top-bar">
      <button type="button" className="app-title" onClick={onHome} title={nav.homeTitle}>
        <AppLogo size={28} />
        <AppBrandName />
      </button>

      <div className="app-top-bar__actions">
        <nav className="app-top-bar__nav" aria-label={nav.mainNav}>
          <div className="app-top-bar__nav-group app-top-bar__nav-group--primary">
            <button
              type="button"
              className={page === "tasks" ? "active" : ""}
              onClick={() => onNavigate("tasks")}
              aria-label={tasksAria}
              aria-current={page === "tasks" ? "page" : undefined}
            >
              {nav.tasks}
              <NavBadge count={tasksUnread} />
            </button>
            <button
              type="button"
              className={page === "feed" ? "active" : ""}
              onClick={() => onNavigate("feed")}
              aria-label={feedAria}
              aria-current={page === "feed" ? "page" : undefined}
            >
              {nav.feed}
              <NavBadge count={feedUnread} />
            </button>
          </div>

          <span className="app-top-bar__nav-sep" aria-hidden />

          <button
            type="button"
            className={`app-top-bar__nav-settings${page === "settings" ? " active" : ""}`}
            onClick={() => onNavigate("settings")}
            aria-current={page === "settings" ? "page" : undefined}
          >
            {nav.settings}
          </button>
        </nav>

        <div className="app-top-bar__tools">
          <LanguageSwitcher className="lang-switch--compact" />
          <button
            type="button"
            className="app-top-bar__logout"
            onClick={onLogout}
            title={nav.logoutPanelTitle}
          >
            {nav.logout}
          </button>
        </div>
      </div>
    </header>
  );
}
