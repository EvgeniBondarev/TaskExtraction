import { useCallback, useEffect, useRef, useState } from "react";
import {
  connectMessagesWs,
  fetchMessages,
  fetchTask,
  fetchTasks,
  Task,
  updateTask,
  wsPayloadToMessage,
  WsMessagePayload,
} from "./api";
import { fetchChatsStatus } from "./api/chats";
import { logoutPanel } from "./api/session";
import { fetchTelegramStatus } from "./api/telegram";
import { AppTopBar, NavBadges } from "./components/AppTopBar";
import { IntegrationsOnboardingPrompt } from "./components/IntegrationsOnboardingPrompt";
import "./styles/app-shell.css";
import { fetchGitHubStatus } from "./api/integrations/github";
import { fetchJiraStatus } from "./api/integrations/jira";
import { fetchSlackStatus } from "./api/integrations/slack";
import { fetchTrelloStatus } from "./api/integrations/trello";
import {
  consumeIntegrationsPromptPending,
  dismissIntegrationsPrompt,
  hasAnyIntegrationConfigured,
  isIntegrationsPromptDismissed,
  markIntegrationsPromptPending,
} from "./hooks/useIntegrationsStatus";
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
import { useLivePolling } from "./hooks/useLivePolling";
import { useTrelloIntegration } from "./hooks/useTrelloIntegration";
import { getTaskGitHubLink } from "./utils/githubIntegration";
import { getTaskJiraLink } from "./utils/jiraIntegration";
import { getTaskSlackLink } from "./utils/slackIntegration";
import { getTaskTrelloLink } from "./utils/trelloIntegration";
import { trackVisit } from "./api/analytics";
import { captureUtmFromUrl } from "./utils/utm";

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
  useEffect(() => {
    captureUtmFromUrl();
    void trackVisit();
  }, []);

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
  const [integrationsPromptOpen, setIntegrationsPromptOpen] = useState(false);
  const [navBadges, setNavBadges] = useState<NavBadges>({ tasks: 0, feed: 0 });
  const [livePollSeedReady, setLivePollSeedReady] = useState(false);
  const [liveSessionKey, setLiveSessionKey] = useState(0);
  const seenMessages = useRef<Set<string>>(new Set());
  const pageRef = useRef(page);
  const feedBadgeIds = useRef(new Set<string>());
  const taskBadgeIds = useRef(new Set<string>());
  const openedTaskFromUrl = useRef<string | null>(null);
  const reloadRef = useRef<() => Promise<void>>(async () => {});
  const reloadMessagesRef = useRef<() => Promise<void>>(async () => {});
  const { enabled: jiraEnabled } = useJiraIntegration(gate === "ready");
  const { enabled: trelloEnabled } = useTrelloIntegration(gate === "ready");
  const { enabled: githubEnabled } = useGitHubIntegration(gate === "ready");
  const { enabled: slackEnabled } = useSlackIntegration(gate === "ready");

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

  const openIntegrationsSettings = useCallback(() => {
    setIntegrationsPromptOpen(false);
    setPage("settings");
    window.history.pushState({}, "", "/settings#integrations");
    window.dispatchEvent(new HashChangeEvent("hashchange"));
  }, []);

  const skipIntegrationsPrompt = useCallback(() => {
    dismissIntegrationsPrompt();
    setIntegrationsPromptOpen(false);
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

  reloadRef.current = reload;
  reloadMessagesRef.current = reloadMessages;
  pageRef.current = page;

  useEffect(() => {
    if (gate !== "ready") {
      setLivePollSeedReady(false);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const [t, m] = await Promise.all([fetchTasks(), fetchMessages(40, 0)]);
        if (cancelled) return;
        setTasks(t.items);
        setMessages(m.items);
        m.items.forEach((msg) => seenMessages.current.add(msg.id));
        setLivePollSeedReady(true);
      } catch (err) {
        console.error("Live sync bootstrap failed", err);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [gate, liveSessionKey]);

  useEffect(() => {
    if (page === "tasks") {
      setNavBadges((b) => (b.tasks === 0 ? b : { ...b, tasks: 0 }));
    }
    if (page === "feed") {
      setNavBadges((b) => (b.feed === 0 ? b : { ...b, feed: 0 }));
    }
  }, [page]);

  useEffect(() => {
    checkSetup().catch(() => setGate("setup"));
  }, [checkSetup]);

  useEffect(() => {
    if (gate !== "ready") return;
    const params = new URLSearchParams(window.location.search);
    const taskId = params.get("task");
    if (!taskId || openedTaskFromUrl.current === taskId) return;

    setView("app");
    setPage("tasks");
    const task = tasks.find((t) => t.id === taskId);
    if (task) {
      openedTaskFromUrl.current = taskId;
      setSelected(task);
      return;
    }
    fetchTasks()
      .then((t) => {
        setTasks(t.items);
        const found = t.items.find((x) => x.id === taskId);
        if (found) {
          openedTaskFromUrl.current = taskId;
          setSelected(found);
        }
      })
      .catch(() => {});
  }, [gate, tasks]);

  useEffect(() => {
    if (gate !== "ready") return;
    if (!consumeIntegrationsPromptPending()) return;
    if (isIntegrationsPromptDismissed()) return;

    let cancelled = false;
    Promise.all([fetchJiraStatus(), fetchTrelloStatus(), fetchGitHubStatus(), fetchSlackStatus()])
      .then(([jira, trello, github, slack]) => {
        if (cancelled) return;
        if (hasAnyIntegrationConfigured(jira, trello, github, slack)) {
          dismissIntegrationsPrompt();
          return;
        }
        setIntegrationsPromptOpen(true);
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [gate]);

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

  const handlePanelLogout = useCallback(async () => {
    try {
      await logoutPanel();
    } catch (err) {
      console.error(err);
    }
    setTasks([]);
    setMessages([]);
    setSelected(null);
    setToasts([]);
    setNavBadges({ tasks: 0, feed: 0 });
    setLivePollSeedReady(false);
    setLiveSessionKey((k) => k + 1);
    feedBadgeIds.current.clear();
    taskBadgeIds.current.clear();
    seenMessages.current.clear();
    setView("app");
    setGate("setup");
    setPage("settings");
    window.history.pushState({}, "", "/settings");
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
          if (payload.type === "new_task") {
            const badgeKey = payload.task?.id ?? payload.message_id;
            if (
              badgeKey &&
              !taskBadgeIds.current.has(badgeKey) &&
              pageRef.current !== "tasks"
            ) {
              taskBadgeIds.current.add(badgeKey);
              setNavBadges((b) => ({ ...b, tasks: b.tasks + 1 }));
            }
          } else if (payload.type === "new_message" && payload.message_id) {
            if (
              !feedBadgeIds.current.has(payload.message_id) &&
              pageRef.current !== "feed"
            ) {
              feedBadgeIds.current.add(payload.message_id);
              setNavBadges((b) => ({ ...b, feed: b.feed + 1 }));
            }
          }

          seenMessages.current.add(payload.message_id);
          reloadMessagesRef.current().catch(() => {});
          if (payload.type === "new_task" && payload.task) {
            const t = payload.task as Task;
            const upsertTask = (full: Task) => {
              setTasks((prev) =>
                prev.some((x) => x.id === full.id)
                  ? prev.map((x) => (x.id === full.id ? full : x))
                  : [full, ...prev]
              );
            };
            upsertTask(t);
            fetchTask(t.id)
              .then(upsertTask)
              .catch(() => {});
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
      void reloadRef.current();
    },
    []
  );

  useEffect(() => {
    if (gate !== "ready") return;
    if (page === "settings") {
      setLoading(false);
      return;
    }
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

  useLivePolling(
    gate === "ready",
    handleWsEvent,
    messages,
    tasks,
    livePollSeedReady,
    liveSessionKey
  );

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
    const s = await checkSetup();
    if (s?.setup_complete) {
      const cs = await fetchChatsStatus().catch(() => null);
      if (cs?.has_monitored) markIntegrationsPromptPending();
    }
  };

  const onChatsSelected = async () => {
    await checkSetup();
    markIntegrationsPromptPending();
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
      <div className="app app--chats">
        <ChatSelection onComplete={onChatsSelected} />
      </div>
    );
  }

  return (
    <div
      className={`app${page === "settings" ? " app--settings" : ""}${page === "feed" ? " app--feed" : ""}`}
    >
      <MessageToasts items={toasts} onDismiss={dismissToast} onOpen={openToast} />

      <AppTopBar
        page={page}
        badges={navBadges}
        onNavigate={navigate}
        onHome={goHome}
        onWelcome={goToWelcome}
        onLogout={handlePanelLogout}
      />

      {integrationsPromptOpen && (
        <IntegrationsOnboardingPrompt
          onSetup={openIntegrationsSettings}
          onSkip={skipIntegrationsPrompt}
        />
      )}

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
          jiraEnabled={jiraEnabled}
          trelloEnabled={trelloEnabled}
          githubEnabled={githubEnabled}
          slackEnabled={slackEnabled}
          onClose={() => setSelected(null)}
          onUpdate={(t) => {
            setTasks((prev) => prev.map((x) => (x.id === t.id ? t : x)));
            setSelected(t);
            reloadMessages().catch(() => {});
          }}
        />
      )}

    </div>
  );
}
