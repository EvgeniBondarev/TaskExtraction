import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectMessagesWs,
  fetchMessages,
  fetchTasks,
  Task,
  updateTask,
  wsPayloadToMessage,
  WsMessagePayload,
} from "./api";
import { fetchChatsStatus } from "./api/chats";
import { fetchTelegramStatus } from "./api/telegram";
import { AppLogo } from "./components/AppLogo";
import { KanbanBoard } from "./components/KanbanBoard";
import { MessageFeed } from "./components/MessageFeed";
import { AppBootSkeleton, FeedPageSkeleton, KanbanBoardSkeleton } from "./components/PageSkeletons";
import { MessageToasts, ToastItem } from "./components/MessageToasts";
import { TaskModal } from "./components/TaskModal";
import { ChatSelection } from "./pages/ChatSelection";
import { hasSeenWelcome, LandingPage, markWelcomeSeen } from "./pages/LandingPage";
import { TelegramAuth } from "./pages/TelegramAuth";
import { TelegramSettings } from "./pages/TelegramSettings";
import { useJiraIntegration } from "./hooks/useJiraIntegration";
import { useGitHubIntegration } from "./hooks/useGitHubIntegration";
import { useSlackIntegration } from "./hooks/useSlackIntegration";
import { useTrelloIntegration } from "./hooks/useTrelloIntegration";
import { getTaskGitHubLink } from "./utils/githubIntegration";
import { getTaskJiraLink } from "./utils/jiraIntegration";
import { getTaskSlackLink } from "./utils/slackIntegration";
import { getTaskTrelloLink } from "./utils/trelloIntegration";

type MainPage = "tasks" | "feed" | "settings";
type Gate = "loading" | "setup" | "chats" | "ready";

const COLUMNS = [
  { id: "inbox", label: "Inbox", color: "var(--inbox)" },
  { id: "in_progress", label: "В работе", color: "var(--progress)" },
  { id: "done", label: "Готово", color: "var(--done)" },
  { id: "archive", label: "Архив", color: "var(--archive)" },
];

function pathToPage(path: string): MainPage {
  if (path === "/settings" || path === "/telegram") return "settings";
  if (path === "/feed" || path === "/logs") return "feed";
  return "tasks";
}

function pageToPath(page: MainPage): string {
  if (page === "settings") return "/settings";
  if (page === "feed") return "/feed";
  return "/";
}

function isWelcomePath(path: string): boolean {
  return path === "/welcome" || path === "/guide";
}

function shouldOpenWelcome(path: string): boolean {
  if (isWelcomePath(path)) return true;
  if (path !== "/") return false;
  try {
    return localStorage.getItem("te_seen_welcome") !== "1";
  } catch {
    return false;
  }
}

export default function App() {
  const [view, setView] = useState<"welcome" | "app">(() =>
    shouldOpenWelcome(window.location.pathname) ? "welcome" : "app"
  );
  const [gate, setGate] = useState<Gate>("loading");
  const [page, setPage] = useState<MainPage>(() => pathToPage(window.location.pathname));
  const [tasks, setTasks] = useState<Task[]>([]);
  const [messages, setMessages] = useState<Awaited<ReturnType<typeof fetchMessages>>["items"]>([]);
  const [selected, setSelected] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const seenMessages = useRef<Set<string>>(new Set());
  const { active: jiraActive, enabled: jiraEnabled } = useJiraIntegration(gate === "ready");
  const { active: trelloActive, enabled: trelloEnabled } = useTrelloIntegration(gate === "ready");
  const { active: githubActive, enabled: githubEnabled } = useGitHubIntegration(gate === "ready");
  const { active: slackActive, enabled: slackEnabled } = useSlackIntegration(gate === "ready");

  const checkSetup = useCallback(async () => {
    const s = await fetchTelegramStatus();
    if (!s.setup_complete) {
      setGate("setup");
      return s;
    }
    const cs = await fetchChatsStatus();
    setGate(cs.has_monitored ? "ready" : "chats");
    return s;
  }, []);

  const navigate = useCallback((next: MainPage) => {
    setPage(next);
    const path = pageToPath(next);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  }, []);

  const reloadMessages = useCallback(async () => {
    const m = await fetchMessages();
    setMessages(m.items);
    m.items.forEach((msg) => seenMessages.current.add(msg.id));
  }, []);

  const reload = useCallback(async () => {
    if (gate !== "ready") return;
    try {
      const [t, m] = await Promise.all([fetchTasks(), fetchMessages()]);
      setTasks(t.items);
      setMessages(m.items);
      m.items.forEach((msg) => seenMessages.current.add(msg.id));
    } catch (err) {
      console.error("Failed to reload tasks/messages", err);
    } finally {
      setLoading(false);
    }
  }, [gate]);

  useEffect(() => {
    checkSetup().catch(() => setGate("setup"));
  }, [checkSetup]);

  useEffect(() => {
    if (window.location.pathname === "/guide") {
      window.history.replaceState({}, "", "/welcome#guide");
      setView("welcome");
    } else if (window.location.pathname === "/" && shouldOpenWelcome("/")) {
      window.history.replaceState({}, "", "/welcome");
      setView("welcome");
    }
  }, []);

  const enterApp = useCallback(() => {
    markWelcomeSeen();
    setView("app");
    const path = pageToPath(page);
    if (window.location.pathname !== path) {
      window.history.pushState({}, "", path);
    }
  }, [page]);

  const goToWelcome = useCallback(() => {
    setView("welcome");
    if (window.location.pathname !== "/welcome") {
      window.history.pushState({}, "", "/welcome");
    }
  }, []);

  const goHome = useCallback(() => {
    if (hasSeenWelcome()) {
      setView("app");
      setPage("tasks");
    } else {
      setView("welcome");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    if (window.location.pathname !== "/") {
      window.history.pushState({}, "", "/");
    }
  }, []);

  useEffect(() => {
    const onPop = () => {
      const path = window.location.pathname;
      if (isWelcomePath(path)) {
        setView("welcome");
        return;
      }
      setView("app");
      setPage(pathToPage(path));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const handleWsEvent = useCallback(
    (payload: WsMessagePayload) => {
      const isLive =
        payload.type === "message_processing" ||
        payload.type === "new_message" ||
        payload.type === "new_task";

      if (isLive && payload.message_id) {
        const toastItem = {
          ...payload,
          id: payload.message_id,
          processing: payload.processing ?? payload.type === "message_processing",
        };
        setToasts((prev) => [
          toastItem,
          ...prev.filter((t) => t.id !== payload.message_id),
        ].slice(0, 5));

        const optimistic = wsPayloadToMessage(payload);
        if (optimistic) {
          setMessages((prev) => {
            const idx = prev.findIndex((m) => m.id === optimistic.id);
            if (idx >= 0) {
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                ...optimistic,
                classification:
                  payload.type === "message_processing"
                    ? optimistic.classification
                    : next[idx].classification,
              };
              return next;
            }
            return [optimistic, ...prev];
          });
        }

        if (payload.type !== "message_processing") {
          seenMessages.current.add(payload.message_id);
          reloadMessages().catch(() => {});
          if (payload.type === "new_task" && payload.task) {
            const t = payload.task;
            setTasks((prev) => (prev.some((x) => x.id === t.id) ? prev : [t, ...prev]));
            const jira = getTaskJiraLink(t);
            const trello = getTaskTrelloLink(t);
            const github = getTaskGitHubLink(t);
            const slack = getTaskSlackLink(t);
            if (payload.message_id && (jira || trello || github || slack)) {
              setMessages((prev) =>
                prev.map((m) => {
                  if (m.id !== payload.message_id) return m;
                  const patch: Partial<typeof m> = { ...m };
                  if (jira) {
                    patch.jira_issue_key = jira.external_id;
                    patch.jira_url = jira.url;
                  }
                  if (trello) {
                    patch.trello_card_id = trello.external_id;
                    patch.trello_url = trello.url;
                  }
                  if (github) {
                    patch.github_issue_number = github.external_id;
                    patch.github_url = github.url;
                  }
                  if (slack) {
                    patch.slack_message_id = slack.external_id;
                    patch.slack_url = slack.url;
                  }
                  return { ...m, ...patch };
                })
              );
            }
          }
          fetchTasks()
            .then((t) => setTasks(t.items))
            .catch(() => {});
        }
        return;
      }
      reload();
    },
    [reload, reloadMessages]
  );

  useEffect(() => {
    if (gate !== "ready") return;
    if (page === "settings") return;
    setLoading(true);
    reload();
    const interval = setInterval(reload, 10000);
    return () => clearInterval(interval);
  }, [gate, page, reload]);

  useEffect(() => {
    if (gate !== "ready") return;
    const close = connectMessagesWs(handleWsEvent);
    return close;
  }, [gate, handleWsEvent]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openToast = useCallback(
    (item: ToastItem) => {
      dismissToast(item.id);
      navigate("feed");
    },
    [dismissToast, navigate]
  );

  const onSetupComplete = async () => {
    await checkSetup();
  };

  const onChatsSelected = async () => {
    await checkSetup();
  };

  if (view === "welcome") {
    return (
      <LandingPage onTry={enterApp} onSkip={enterApp} onHome={goHome} />
    );
  }

  if (gate === "loading") {
    return <AppBootSkeleton />;
  }

  if (gate === "setup") {
    return (
      <div className="center-page">
        <TelegramAuth embedded onComplete={onSetupComplete} />
      </div>
    );
  }

  if (gate === "chats") {
    return (
      <div className="center-page">
        <ChatSelection onComplete={onChatsSelected} />
      </div>
    );
  }

  return (
    <div
      className={`app${page === "settings" ? " app--settings" : ""}${page === "feed" ? " app--feed" : ""}`}
    >
      <MessageToasts items={toasts} onDismiss={dismissToast} onOpen={openToast} />

      <header className="header app-top-bar">
        <button type="button" className="app-title" onClick={goHome} title="На главную">
          <AppLogo size={30} />
          <span>TaskExtraction</span>
        </button>
        <nav>
          <button
            type="button"
            className={page === "tasks" ? "active" : ""}
            onClick={() => navigate("tasks")}
          >
            Задачи
          </button>
          <button
            type="button"
            className={page === "feed" ? "active" : ""}
            onClick={() => navigate("feed")}
          >
            Лента
          </button>
          <button
            type="button"
            className={page === "settings" ? "active" : ""}
            onClick={() => navigate("settings")}
          >
            Настройки
          </button>
          <button type="button" className="nav-about" onClick={goToWelcome}>
            О продукте
          </button>
        </nav>
      </header>

      {page === "settings" ? (
        <TelegramSettings
          onStatusChange={async () => {
            const s = await checkSetup();
            if (!s.setup_complete) setGate("setup");
          }}
        />
      ) : loading ? (
        page === "feed" ? (
          <main className="main-feed">
            <FeedPageSkeleton />
          </main>
        ) : (
          <KanbanBoardSkeleton />
        )
      ) : page === "feed" ? (
        <main className="main-feed">
        <MessageFeed
          messages={messages}
          tasks={tasks}
          jiraActive={jiraActive}
          trelloActive={trelloActive}
          githubActive={githubActive}
          slackActive={slackActive}
          onTaskCreated={(task) => {
            setTasks((prev) => (prev.some((x) => x.id === task.id) ? prev : [task, ...prev]));
            reloadMessages().catch(() => {});
          }}
        />
        </main>
      ) : (
        <KanbanBoard
          columns={COLUMNS}
          tasks={tasks}
          jiraActive={jiraActive}
          trelloActive={trelloActive}
          githubActive={githubActive}
          slackActive={slackActive}
          onSelect={setSelected}
          onStatusChange={async (task, status) => {
            const updated = await updateTask(task.id, { status });
            setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
            setSelected((s) => (s?.id === updated.id ? updated : s));
          }}
        />
      )}

      {selected && page !== "settings" && (
        <TaskModal
          task={selected}
          jiraActive={jiraActive}
          trelloActive={trelloActive}
          githubActive={githubActive}
          jiraEnabled={jiraEnabled}
          trelloEnabled={trelloEnabled}
          githubEnabled={githubEnabled}
          slackActive={slackActive}
          slackEnabled={slackEnabled}
          onClose={() => setSelected(null)}
          onUpdate={(t) => {
            setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
            setSelected(t);
            reloadMessages().catch(() => {});
          }}
        />
      )}

      <style>{`
        .app { max-width: 100%; margin: 0 auto; padding: 1rem 1.25rem 2rem; }
        .app.app--settings { padding-top: 1.75rem; }
        .app.app--feed {
          padding-top: 1.25rem;
          background:
            radial-gradient(ellipse 80% 50% at 50% -20%, rgba(59, 130, 246, 0.12) 0%, transparent 55%),
            var(--bg);
        }
        .main-feed {
          width: 100%;
          margin: 0 auto;
        }
        .center-page {
          min-height: 100vh; display: flex; align-items: center; justify-content: center;
          padding: 1rem;
        }
        .header,
        .app-top-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          max-width: none;
          margin-bottom: 1.5rem;
          flex-wrap: nowrap;
          gap: 1rem;
          box-sizing: border-box;
        }
        .app-top-bar nav {
          margin-left: auto;
          flex-shrink: 0;
        }
        @media (max-width: 720px) {
          .app-top-bar { flex-wrap: wrap; }
        }
        .app-title {
          margin: 0;
          font-size: 1.35rem;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 0.55rem;
          padding: 0;
          border: none;
          background: none;
          color: inherit;
          font: inherit;
          cursor: pointer;
          border-radius: 10px;
          transition: opacity 0.15s, background 0.15s;
        }
        .app-title:hover {
          opacity: 0.92;
          background: rgba(255, 255, 255, 0.04);
        }
        .app-title span { letter-spacing: -0.02em; }
        nav { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        nav button {
          background: var(--surface); border: 1px solid var(--border);
          color: var(--muted); padding: 0.45rem 1rem; border-radius: 8px; cursor: pointer;
          font: inherit;
        }
        nav button.active { color: var(--text); border-color: var(--accent); }
        nav button.nav-about {
          background: transparent;
          border-color: transparent;
          color: var(--muted);
        }
        nav button.nav-about:hover {
          color: #93c5fd;
          border-color: rgba(59, 130, 246, 0.35);
        }
        .muted { color: var(--muted); }
      `}</style>
    </div>
  );
}
