import { ChartLine, ChatsCircle, GearSix, Kanban, SignOut } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { GoogleUser } from "../api/auth";
import { useI18n } from "../i18n";
import { AppLogo } from "./AppLogo";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeSwitch } from "./ThemeSwitch";

export type AppMainPage = "tasks" | "feed" | "settings" | "analytics";

export type NavBadges = {
  tasks: number;
  feed: number;
};

interface Props {
  page: AppMainPage;
  badges?: NavBadges;
  onNavigate: (page: AppMainPage) => void;
  onHome: () => void;
  onLogout?: () => void;
  user?: GoogleUser | null;
  /** Скрыть разделы (первичная настройка, пока нет подключённых чатов). */
  hideNav?: boolean;
  canViewAnalytics?: boolean;
}

const ITEMS: { id: Exclude<AppMainPage, "analytics">; icon: typeof Kanban }[] = [
  { id: "tasks", icon: Kanban },
  { id: "feed", icon: ChatsCircle },
  { id: "settings", icon: GearSix },
];

function formatBadge(n: number) {
  return n > 99 ? "99+" : String(n);
}

export function AppTopBar({ page, badges, onNavigate, onHome, onLogout, user, hideNav, canViewAnalytics = false }: Props) {
  const { messages } = useI18n();
  const nav = messages.panel.nav;
  const legacyNav = messages.nav;
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  const userName = user?.name || user?.email || nav.account;
  const initial = userName.slice(0, 1).toUpperCase();
  const navigationItems = [...ITEMS, ...(canViewAnalytics ? [{ id: "analytics" as const, icon: ChartLine }] : [])];

  return (
    <>
      <header className={`te-topbar te-glass${menuOpen ? " is-menu-open" : ""}`}>
        <button type="button" className="te-topbar__brand" onClick={onHome} title={legacyNav.homeTitle}>
          <AppLogo size={30} />
          <span className="te-topbar__name">TaskExtraction</span>
        </button>

        {!hideNav && (
          <nav className="te-topbar__nav" aria-label={legacyNav.mainNav}>
            {navigationItems.map(({ id, icon: Icon }) => {
              const count = id === "tasks" ? badges?.tasks ?? 0 : id === "feed" ? badges?.feed ?? 0 : 0;
              const label = nav[id];
              return (
                <button
                  key={id}
                  type="button"
                  className={`te-topbar__tab te-topbar__tab--${id}${page === id ? " is-active" : ""}`}
                  onClick={() => onNavigate(id)}
                  aria-current={page === id ? "page" : undefined}
                  aria-label={count > 0 ? `${label}, ${count} ${legacyNav.tasksNew}` : label}
                >
                  <Icon size={18} weight={page === id ? "fill" : "regular"} aria-hidden />
                  <span className="te-topbar__tab-label">{label}</span>
                  {count > 0 && <span className="te-topbar__badge" aria-hidden>{formatBadge(count)}</span>}
                </button>
              );
            })}
          </nav>
        )}

        <div className="te-topbar__end">
          <ThemeSwitch className="te-topbar__theme" />
          <LanguageSwitcher className="lang-switch--compact" />
          {user && (
            <div className="te-account" ref={menuRef}>
              <button type="button" className="te-account__trigger" onClick={() => setMenuOpen((v) => !v)} aria-haspopup="menu" aria-expanded={menuOpen} aria-label={nav.menu}>
                {user.picture ? <img className="te-avatar" src={user.picture} alt="" referrerPolicy="no-referrer" /> : <span className="te-avatar te-avatar--initial" aria-hidden>{initial}</span>}
              </button>
              {menuOpen && (
                <div className="te-account__menu te-glass" role="menu">
                  <div className="te-account__who"><strong>{userName}</strong>{user.name && user.email && <small>{user.email}</small>}</div>
                  <div className="te-account__row"><span>{messages.panel.theme.label}</span><ThemeSwitch /></div>
                  <div className="te-account__row te-account__row--mobile"><span>{messages.lang.label}</span><LanguageSwitcher className="lang-switch--compact" /></div>
                  {onLogout && <button type="button" role="menuitem" className="te-account__item" onClick={() => { setMenuOpen(false); onLogout(); }}><SignOut size={18} aria-hidden /><span>{nav.logout}<small>{nav.logoutHint}</small></span></button>}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {!hideNav && (
        <nav className="te-mobile-nav" aria-label={legacyNav.mainNav}>
          {navigationItems.map(({ id, icon: Icon }) => {
            const count = id === "tasks" ? badges?.tasks ?? 0 : id === "feed" ? badges?.feed ?? 0 : 0;
            const label = nav[id];
            return <button key={id} type="button" className={`te-topbar__tab te-topbar__tab--${id}${page === id ? " is-active" : ""}`} onClick={() => onNavigate(id)} aria-current={page === id ? "page" : undefined} aria-label={count > 0 ? `${label}, ${count} ${legacyNav.tasksNew}` : label}><Icon size={19} weight={page === id ? "fill" : "regular"} aria-hidden /><span className="te-topbar__tab-label">{label}</span>{count > 0 && <span className="te-topbar__badge" aria-hidden>{formatBadge(count)}</span>}</button>;
          })}
        </nav>
      )}
    </>
  );
}
