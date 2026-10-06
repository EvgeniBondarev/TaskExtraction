import { MagnifyingGlass, Minus, Plus, Tray, X } from "@phosphor-icons/react";
import { useMemo, useState } from "react";
import { Task } from "../api";
import { useI18n } from "../i18n";
import { hasAttachments } from "../utils/taskStatus";
import { KanbanCard } from "./KanbanCard";

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
type BoardDensity = "comfortable" | "compact";
const FILTERS: QuickFilter[] = ["all", "high", "bug", "feature", "media"];
const BOARD_DENSITY_KEY = "task-extraction:board-density";

function savedBoardDensity(): BoardDensity {
  try {
    return window.localStorage.getItem(BOARD_DENSITY_KEY) === "compact" ? "compact" : "comfortable";
  } catch {
    return "comfortable";
  }
}

function matchesFilter(task: Task, filter: QuickFilter) {
  if (filter === "high") return task.priority === "high";
  if (filter === "bug") return task.type === "bug";
  if (filter === "feature") return task.type === "feature";
  if (filter === "media") return hasAttachments(task);
  return true;
}

export function KanbanBoard({ columns, tasks, onSelect, onStatusChange }: Props) {
  const { messages } = useI18n();
  const p = messages.panel;
  const b = p.board;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<QuickFilter>("all");
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [density, setDensity] = useState<BoardDensity>(savedBoardDensity);

  const q = query.trim().toLowerCase();
  const visible = useMemo(
    () =>
      tasks.filter((t) => {
        if (!matchesFilter(t, filter)) return false;
        if (!q) return true;
        return [t.title, t.description, t.source_user_display_name, t.source_chat_title, t.assignee]
          .filter(Boolean)
          .some((v) => (v as string).toLowerCase().includes(q));
      }),
    [tasks, filter, q],
  );
  const filtered = filter !== "all" || q.length > 0;

  const handleDrop = (colId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    setDraggingId(null);
    const id = e.dataTransfer.getData("taskId");
    const t = tasks.find((x) => x.id === id);
    if (t && t.status !== colId) onStatusChange(t, colId);
  };

  const active = tasks.filter((t) => t.status !== "archive").length;

  return (
    <main className={`te-page te-board-page te-board-page--${density}`}>
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
        <label className="te-search">
          <MagnifyingGlass size={18} aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={b.search}
            aria-label={b.search}
          />
          {query && (
            <button type="button" className="te-search__clear" onClick={() => setQuery("")} aria-label={b.clearSearch}>
              <X size={14} weight="bold" />
            </button>
          )}
        </label>
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
        <button
          type="button"
          className={`te-board-density${density === "compact" ? " is-compact" : ""}`}
          aria-pressed={density === "compact"}
          title={density === "compact" ? b.densityComfortable : b.densityCompact}
          onClick={() => {
            setDensity((current) => {
              const nextDensity = current === "compact" ? "comfortable" : "compact";
              try {
                window.localStorage.setItem(BOARD_DENSITY_KEY, nextDensity);
              } catch {
                // The board remains usable when browser storage is disabled.
              }
              return nextDensity;
            });
          }}
        >
          {density === "compact" ? <Plus size={15} weight="bold" aria-hidden /> : <Minus size={15} weight="bold" aria-hidden />}
          <span>{density === "compact" ? b.densityComfortable : b.densityCompact}</span>
        </button>
      </div>

      <div className="te-board">
        {columns.map((col) => {
          const colTasks = visible.filter((t) => t.status === col.id);
          const totalInCol = tasks.filter((t) => t.status === col.id).length;
          const isOver = dragOverCol === col.id;
          const label = p.labels.status[col.id as keyof typeof p.labels.status] ?? col.label;
          const hint = b.columnHints[col.id as keyof typeof b.columnHints];
          return (
            <section
              key={col.id}
              className={`te-col te-col--${col.id}${isOver ? " is-over" : ""}`}
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
