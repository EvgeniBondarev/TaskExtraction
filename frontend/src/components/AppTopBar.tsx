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
        <AppLogo size={30} />
        <AppBrandName />
      </button>
      <nav aria-label={nav.mainNav}>
        <button
          type="button"
          className={page === "tasks" ? "active" : ""}
          onClick={() => onNavigate("tasks")}
          aria-label={tasksAria}
        >
          {nav.tasks}
          <NavBadge count={tasksUnread} />
        </button>
        <button
          type="button"
          className={page === "feed" ? "active" : ""}
          onClick={() => onNavigate("feed")}
          aria-label={feedAria}
        >
          {nav.feed}
          <NavBadge count={feedUnread} />
        </button>
        <button
          type="button"
          className={page === "settings" ? "active" : ""}
          onClick={() => onNavigate("settings")}
        >
          {nav.settings}
        </button>
        <button type="button" className="nav-about" onClick={onWelcome}>
          {nav.aboutProduct}
        </button>
        <LanguageSwitcher className="lang-switch--app" />
        <button type="button" className="nav-about" onClick={onLogout} title={nav.logoutPanelTitle}>
          {nav.logoutPanel}
        </button>
      </nav>
    </header>
  );
}
