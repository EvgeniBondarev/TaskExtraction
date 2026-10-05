/**
 * Только для разработки: рендерит настоящие компоненты панели на демо-данных,
 * чтобы снять скриншоты для лендинга (scripts/capture-landing-shots.sh).
 * Маршруты: /__shots/board, /__shots/task, /__shots/feed; ?theme=dark для тёмной темы.
 * В прод-сборку не попадает (подключается только при import.meta.env.DEV).
 */
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import { MotionConfig } from "motion/react";
import { useEffect } from "react";
import type { Message, Task } from "../api";
import type { ChatItem } from "../api/chats";
import { AppTopBar } from "../components/AppTopBar";
import { KanbanBoard } from "../components/KanbanBoard";
import { MessageFeed } from "../components/MessageFeed";
import { MessageToasts } from "../components/MessageToasts";
import { TaskModal } from "../components/TaskModal";
import { useI18n } from "../i18n";
import { applyThemePref } from "../utils/theme";
import "../styles/ui.css";

const minutesAgo = (m: number) => new Date(Date.now() - m * 60_000).toISOString();

const CHAT_SUPPORT = "Поддержка магазина";
const CHAT_LOGISTICS = "Логистика";

function task(partial: Partial<Task> & Pick<Task, "id" | "title" | "status" | "type" | "priority">): Task {
  return {
    description: null,
    assignee: null,
    confidence: 0.9,
    telegram_link: "https://t.me/c/1/1",
    external_links: [],
    attachments: [],
    created_at: minutesAgo(30),
    source_is_group: true,
    source_chat_title: CHAT_SUPPORT,
    ...partial,
  } as Task;
}

const TASKS: Task[] = [
  task({
    id: "t1",
    title: "Проверить доставку заказа 4821",
    description: "Клиент ждёт с понедельника, заказ не доехал. Нужно связаться со службой доставки и дать ответ сегодня.",
    status: "inbox",
    type: "other",
    priority: "high",
    confidence: 0.92,
    source_user_display_name: "Марина Кольцова",
    source_created_at: minutesAgo(3),
    external_links: [{ id: "l1", provider: "jira", external_id: "SUP-128", url: "https://example.atlassian.net" }],
  }),
  task({
    id: "t2",
    title: "Корзина не открывается на iOS после обновления",
    description: "После релиза 3.4 на iPhone корзина показывает пустой экран.",
    status: "inbox",
    type: "bug",
    priority: "high",
    source_user_display_name: "Дина Хасанова",
    source_created_at: minutesAgo(14),
    attachments: [
      {
        id: "a1",
        message_id: "m3",
        kind: "photo",
        file_name: "screenshot.jpg",
        mime_type: "image/jpeg",
        file_size: 120000,
        url: null,
        download_url: null,
        is_image: false,
        is_video: false,
        is_audio: false,
        label: "Скриншот",
      },
    ],
  }),
  task({
    id: "t3",
    title: "Добавить оплату через СБП",
    status: "inbox",
    type: "feature",
    priority: "medium",
    source_user_display_name: "Марина Кольцова",
    source_created_at: minutesAgo(52),
  }),
  task({
    id: "t4",
    title: "Ошибка 500 при оформлении заказа с промокодом",
    status: "in_progress",
    type: "bug",
    priority: "high",
    assignee: "Артём",
    source_user_display_name: "Глеб Пушкарёв",
    source_created_at: minutesAgo(95),
    external_links: [{ id: "l2", provider: "github", external_id: "#42", url: "https://github.com" }],
  }),
  task({
    id: "t5",
    title: "Вернуть деньги за заказ 4790",
    status: "in_progress",
    type: "other",
    priority: "medium",
    source_user_display_name: "Ольга Ветрова",
    source_chat_title: CHAT_LOGISTICS,
    source_created_at: minutesAgo(180),
  }),
  task({
    id: "t6",
    title: "Обновить FAQ по срокам доставки",
    status: "done",
    type: "other",
    priority: "low",
    source_user_display_name: "Ольга Ветрова",
    source_chat_title: CHAT_LOGISTICS,
    source_created_at: minutesAgo(400),
    external_links: [{ id: "l3", provider: "trello", external_id: "card", url: "https://trello.com" }],
  }),
  task({
    id: "t7",
    title: "Промокод SPRING не применяется в мобильном приложении",
    status: "done",
    type: "bug",
    priority: "medium",
    source_user_display_name: "Дина Хасанова",
    source_created_at: minutesAgo(600),
  }),
  task({
    id: "t8",
    title: "Поменять баннер на главной к распродаже",
    status: "archive",
    type: "feature",
    priority: "low",
    source_user_display_name: "Глеб Пушкарёв",
    source_created_at: minutesAgo(2000),
  }),
];

const CHATS: ChatItem[] = [
  { id: "c1", telegram_chat_id: -1, title: CHAT_SUPPORT, is_monitored: true, chat_type: "group", username: null, parent_telegram_chat_id: null, has_photo: false, created_at: minutesAgo(9000), updated_at: null },
  { id: "c2", telegram_chat_id: -2, title: CHAT_LOGISTICS, is_monitored: true, chat_type: "group", username: null, parent_telegram_chat_id: null, has_photo: false, created_at: minutesAgo(9000), updated_at: null },
];

function msg(
  id: string,
  author: string,
  text: string,
  mins: number,
  cls: Partial<NonNullable<Message["classification"]>>,
  chat = CHAT_SUPPORT,
): Message {
  return {
    id,
    telegram_message_id: Number(id.replace(/\D/g, "")) || 1,
    user_display_name: author,
    text,
    created_at: minutesAgo(mins),
    telegram_link: "https://t.me/c/1/1",
    chat_id: chat === CHAT_SUPPORT ? "c1" : "c2",
    chat_title: chat,
    classification: {
      status: "classified",
      is_task: false,
      confidence: null,
      ai_confidence: null,
      heuristic_score: null,
      threshold: 0.75,
      reason: null,
      prefilter_reason: null,
      task_created: false,
      ...cls,
    },
  };
}

const MESSAGES: Message[] = [
  msg("m1", "Марина Кольцова", "Заказ 4821 так и не доехал, клиент ждёт с понедельника. Проверьте, что с доставкой", 3, {
    is_task: true,
    task_created: true,
    confidence: 0.92,
    ai_confidence: 0.92,
  }),
  msg("m2", "Артём Ершов", "Кто знает, до скольки сегодня работает склад на Складской?", 9, {
    is_task: false,
    confidence: 0.24,
    reason: "Вопрос к коллегам, поручения нет",
  }),
  msg("m3", "Дина Хасанова", "После обновления на iOS не открывается корзина, скрин ниже", 14, {
    is_task: true,
    task_created: true,
    confidence: 0.88,
  }),
  msg("m4", "Глеб Пушкарёв", "Может, стоит как-нибудь обновить баннер на главной?", 31, {
    is_task: true,
    confidence: 0.58,
    ai_confidence: 0.58,
    skip_reason: "ai_below_threshold",
  }),
  msg("m5", "Ольга Ветрова", "Спасибо всем, хороших выходных!", 47, { status: "prefilter_skip", prefilter_reason: "благодарность" }, CHAT_LOGISTICS),
  msg("m6", "Марина Кольцова", "Нужно добавить оплату через СБП до конца месяца, бухгалтерия уже готова", 52, {
    is_task: true,
    task_created: true,
    confidence: 0.81,
  }),
];

const COLUMNS = ["inbox", "in_progress", "done", "archive"].map((id) => ({ id, label: id }));
const USER = { name: "Марина Кольцова", email: "marina@shop.example", picture: null };
const noop = () => {};

export default function ShotsPage() {
  const { setLocale } = useI18n();
  const view = window.location.pathname.split("/")[2] || "board";
  const dark = new URLSearchParams(window.location.search).get("theme") === "dark";

  useEffect(() => {
    applyThemePref(dark ? "dark" : "light");
    setLocale("ru");
  }, [dark, setLocale]);

  useEffect(() => {
    const t = setTimeout(() => (document.activeElement as HTMLElement | null)?.blur(), 50);
    return () => clearTimeout(t);
  }, []);

  return (
    <MotionConfig reducedMotion="always">
      <div className="te-theme te-app te-shots">
        <AppTopBar
          page={view === "feed" ? "feed" : "tasks"}
          badges={{ tasks: view === "feed" ? 2 : 0, feed: view === "feed" ? 0 : 3 }}
          onNavigate={noop}
          onHome={noop}
          user={USER}
        />
        {view === "feed" ? (
          <MessageFeed messages={MESSAGES} tasks={TASKS} chats={CHATS} />
        ) : (
          <KanbanBoard columns={COLUMNS} tasks={TASKS} onSelect={noop} onStatusChange={noop} />
        )}
        {view === "board" && (
          <MessageToasts
            items={[
              {
                id: "toast1",
                type: "new_task",
                user_display_name: "Марина Кольцова",
                chat_title: CHAT_SUPPORT,
                text: "Заказ 4821 так и не доехал, клиент ждёт с понедельника. Проверьте, что с доставкой",
              },
            ]}
            onDismiss={noop}
            onOpen={noop}
          />
        )}
        {view === "task" && <TaskModal task={TASKS[0]} jiraEnabled trelloEnabled onClose={noop} onUpdate={noop} />}
      </div>
    </MotionConfig>
  );
}
