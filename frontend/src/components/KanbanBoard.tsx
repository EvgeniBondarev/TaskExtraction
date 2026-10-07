import { MagnifyingGlass, Tray, X } from "@phosphor-icons/react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Task } from "../api";
import { useI18n } from "../i18n";
import { hasAttachments } from "../utils/taskStatus";
import { formatShortTime } from "../utils/time";
import { KanbanCard } from "./KanbanCard";
import { MessageAvatar } from "./MessageAvatar";

interface Column {
  id: string;
  label: string;
  color?: string;
}

interface Props {
  columns: Column[];
  tasks: Task[];
  onSelect: (t: Task) => void;
  onStatusChange: (task: Task, status: string) => void;
}

type QuickFilter = "all" | "high" | "bug" | "feature" | "media";
const FILTERS: QuickFilter[] = ["all", "high", "bug", "feature", "media"];

type SearchPerson = {
  name: string;
  senderUrl?: string | null;
  chatUrl?: string | null;
};

function matchesFilter(task: Task, filter: QuickFilter) {
  if (filter === "high") return task.priority === "high";
  if (filter === "bug") return task.type === "bug";
  if (filter === "feature") return task.type === "feature";
  if (filter === "media") return hasAttachments(task);
  return true;
}

export function KanbanBoard({ columns, tasks, onSelect, onStatusChange }: Props) {
  const { locale, messages } = useI18n();
  const p = messages.panel;
  const b = p.board;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [personFilter, setPersonFilter] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [activeColumnId, setActiveColumnId] = useState(() => columns[0]?.id ?? "");
  const [swipeDirection, setSwipeDirection] = useState<"next" | "previous" | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const q = query.trim().toLowerCase();
  const people = useMemo<SearchPerson[]>(() => {
    const unique = new Map<string, SearchPerson>();
    for (const task of tasks) {
      const name = task.source_user_display_name?.trim();
      if (name && !unique.has(name)) {
        unique.set(name, { name, senderUrl: task.source_sender_avatar_url, chatUrl: task.source_chat_avatar_url });
      }
    }
    return [...unique.values()];
  }, [tasks]);
  const suggestedPeople = useMemo(
    () => people.filter((person) => !q || person.name.toLowerCase().includes(q)).slice(0, 5),
    [people, q],
  );
  const suggestedTasks = useMemo(
    () =>
      tasks
        .filter((task) => !q || [task.title, task.description].filter(Boolean).some((value) => value!.toLowerCase().includes(q)))
        .sort((a, b) => new Date(b.source_created_at || b.created_at).getTime() - new Date(a.source_created_at || a.created_at).getTime())
        .slice(0, 5),
    [tasks, q],
  );
  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (!matchesFilter(t, filter)) return false;
        if (personFilter && t.source_user_display_name !== personFilter) return false;
        if (!q) return true;
        return [t.title, t.description, t.source_user_display_name, t.source_chat_title, t.assignee]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q));
      }),
    [tasks, filter, personFilter, q],
  );
  const filtered = filter !== "all" || q.length > 0 || personFilter !== null;

  const handleDrop = (colId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);
    const id = e.dataTransfer.getData("taskId");
    const t = tasks.find((x) => x.id === id);
    if (t && t.status !== colId) onStatusChange(t, colId);
  };

  const active = tasks.filter((t) => t.status !== "archive").length;

  useEffect(() => {
    if (!columns.some((column) => column.id === activeColumnId)) {
      setActiveColumnId(columns[0]?.id ?? "");
    }
  }, [activeColumnId, columns]);

  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLButtonElement>(`[data-column-id="${activeColumnId}"]`);
    tab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeColumnId]);

  const changeMobileColumn = (direction: -1 | 1) => {
    const index = columns.findIndex((column) => column.id === activeColumnId);
    const next = columns[index + direction];
    if (next) {
      setSwipeDirection(direction === 1 ? "next" : "previous");
      setActiveColumnId(next.id);
      window.setTimeout(() => setSwipeDirection(null), 260);
    }
  };

  return (
    <main className="te-page te-board-page">
      <header className="te-page__head te-board-head">
        <div>
          <h1>{b.title}</h1>
          <p>{b.lead}</p>
        </div>
        <div className="te-board-head__count">
          <strong>{active}</strong>
          <span>{b.total}</span>
        </div>
      </header>

      <div className="te-toolbar">
        <div className="te-search-wrap" onFocusCapture={() => setSearchOpen(true)} onBlur={() => window.setTimeout(() => setSearchOpen(false), 120)}>
          <label className="te-search">
            <MagnifyingGlass size={18} aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPersonFilter(null);
              }}
              placeholder={b.search}
              aria-label={b.search}
              aria-controls="te-search-suggestions"
              aria-expanded={searchOpen}
            />
            {(query || personFilter) && (
              <button type="button" className="te-search__clear" onClick={() => { setQuery(""); setPersonFilter(null); }} aria-label={b.clearSearch}>
                <X size={14} weight="bold" />
              </button>
            )}
          </label>
          {searchOpen && (suggestedPeople.length > 0 || suggestedTasks.length > 0) && (
            <div className="te-search-suggestions" id="te-search-suggestions" role="listbox">
              {suggestedPeople.length > 0 && (
                <div className="te-search-suggestions__group">
                  <span>{b.searchPeople}</span>
                  {suggestedPeople.map((person) => (
                    <button key={person.name} type="button" role="option" aria-selected={personFilter === person.name} onMouseDown={(event) => event.preventDefault()} onClick={() => { setPersonFilter(person.name); setQuery(""); setSearchOpen(false); }}>
                      <MessageAvatar senderUrl={person.senderUrl} chatUrl={person.chatUrl} name={person.name} size={26} />
                      <b>{person.name}</b>
                    </button>
                  ))}
                </div>
              )}
              {suggestedTasks.length > 0 && (
                <div className="te-search-suggestions__group">
                  <span>{q ? b.searchSuggestions : b.recentTasks}</span>
                  {suggestedTasks.map((task) => (
                    <button key={task.id} type="button" role="option" className="te-search-suggestions__task" onMouseDown={(event) => event.preventDefault()} onClick={() => { setQuery(task.title); setSearchOpen(false); }}>
                      <b>{task.title}</b>
                      {task.description && <small>{task.description}</small>}
                      <time>{formatShortTime(task.source_created_at || task.created_at, locale)}</time>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="te-chips" role="group" aria-label={b.filtersAria}>
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              className={`te-chip${filter === f ? " is-active" : ""}`}
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {b.filters[f]}
            </button>
          ))}
        </div>
      </div>

      <div className="te-board-tabs" ref={tabsRef} role="tablist" aria-label={b.title}>
        {columns.map((col) => {
          const label = p.labels.status[col.id as keyof typeof p.labels.status] ?? col.label;
          const count = tasks.filter((task) => task.status === col.id).length;
          const selected = col.id === activeColumnId;
          return (
            <button
              key={col.id}
              type="button"
              role="tab"
              data-column-id={col.id}
              className={`te-board-tabs__item te-board-tabs__item--${col.id}${selected ? " is-active" : ""}`}
              aria-selected={selected}
              onClick={() => setActiveColumnId(col.id)}
            >
              <span>{label}</span>
              <b>{count}</b>
            </button>
          );
        })}
      </div>

      <div
        className={`te-board${swipeDirection ? ` is-swiping-${swipeDirection}` : ""}`}
        onTouchStart={(event) => {
          const touch = event.changedTouches[0];
          touchStart.current = { x: touch.clientX, y: touch.clientY };
        }}
        onTouchEnd={(event) => {
          const start = touchStart.current;
          touchStart.current = null;
          const touch = event.changedTouches[0];
          if (!start || !touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) < 56 || Math.abs(dx) <= Math.abs(dy)) return;
          changeMobileColumn(dx < 0 ? 1 : -1);
        }}
      >
        {columns.map((col) => {
          const colTasks = visible.filter((t) => t.status === col.id);
          const totalInCol = tasks.filter((t) => t.status === col.id).length;
          const isOver = dragOverCol === col.id;
          const label = p.labels.status[col.id as keyof typeof p.labels.status] ?? col.label;
          const hint = b.columnHints[col.id as keyof typeof b.columnHints];
          return (
            <section
              key={col.id}
              className={`te-col te-col--${col.id}${col.id === activeColumnId ? " is-active" : ""}${isOver ? " is-over" : ""}`}
              aria-label={label}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (dragOverCol !== col.id) setDragOverCol(col.id);
              }}
              onDragLeave={(e) => {
                if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                  setDragOverCol((c) => (c === col.id ? null : c));
                }
              }}
              onDrop={(e) => handleDrop(col.id, e)}
            >
              <header className="te-col__head">
                <span className="te-col__dot" aria-hidden />
                <h2>{label}</h2>
                <span className="te-col__count">
                  {filtered && colTasks.length !== totalInCol ? `${colTasks.length}/${totalInCol}` : totalInCol}
                </span>
                {hint && <p className="te-col__hint">{hint}</p>}
              </header>
              <div className="te-col__cards">
                {colTasks.map((task) => (
                  <KanbanCard
                    key={task.id}
                    task={task}
                    onClick={() => onSelect(task)}
                    onMove={(status) => onStatusChange(task, status)}
                    onDragStart={(e) => {
                      e.dataTransfer.setData("taskId", task.id);
                      e.dataTransfer.effectAllowed = "move";
                      setDraggingId(task.id);
                    }}
                    onDragEnd={() => {
                      setDraggingId(null);
                      setDragOverCol(null);
                    }}
                  />
                ))}
                {colTasks.length === 0 && (
                  <div className={`te-col__empty${draggingId ? " is-drop" : ""}`}>
                    {draggingId ? (
                      b.emptyColumn
                    ) : filtered && totalInCol > 0 ? (
                      <>
                        {b.emptyFiltered}
                        <button
                          type="button"
                          className="te-link"
                          onClick={() => {
                            setFilter("all");
                            setQuery("");
                            setPersonFilter(null);
                          }}
                        >
                          {b.resetFilters}
                        </button>
                      </>
                    ) : col.id === "inbox" ? (
                      <>
                        <Tray size={22} aria-hidden />
                        {b.emptyInbox}
                      </>
                    ) : (
                      b.emptyColumn
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}
