import { useState } from "react";
import { Task } from "../api";
import { KanbanCard } from "./KanbanCard";
import { STATUS_COLORS } from "../utils/taskStatus";

interface Column {
  id: string;
  label: string;
  color: string;
}

interface Props {
  columns: Column[];
  tasks: Task[];
  onSelect: (t: Task) => void;
  onStatusChange: (task: Task, status: string) => void;
}

export function KanbanBoard({
  columns,
  tasks,
  onSelect,
  onStatusChange,
}: Props) {
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);

  const handleDrop = (colId: string, e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCol(null);
    const id = e.dataTransfer.getData("taskId");
    const t = tasks.find((x) => x.id === id);
    if (t && t.status !== colId) onStatusChange(t, colId);
  };

  return (
    <div className="board">
      {columns.map((col) => {
        const colTasks = tasks.filter((t) => t.status === col.id);
        const isOver = dragOverCol === col.id;
        return (
          <section
            key={col.id}
            className={`column${isOver ? " drag-over" : ""}`}
            style={{ "--col-accent": col.color || STATUS_COLORS[col.id] } as React.CSSProperties}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              setDragOverCol(col.id);
            }}
            onDragLeave={(e) => {
              if (!(e.currentTarget as HTMLElement).contains(e.relatedTarget as Node)) {
                setDragOverCol((c) => (c === col.id ? null : c));
              }
            }}
            onDrop={(e) => handleDrop(col.id, e)}
          >
            <header className="col-header">
              <span className="col-dot" />
              <h2>{col.label}</h2>
              <span className="count">{colTasks.length}</span>
            </header>
            <div className="cards">
              {colTasks.map((task) => (
                <KanbanCard
                  key={task.id}
                  task={task}
                  onClick={() => onSelect(task)}
                  onDragStart={(e) => {
                    e.dataTransfer.setData("taskId", task.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                />
              ))}
              {colTasks.length === 0 && (
                <p className="empty-col">Перетащите задачу сюда</p>
              )}
            </div>
          </section>
        );
      })}
      <style>{`
        .board {
          display: grid;
          grid-template-columns: repeat(4, minmax(240px, 1fr));
          gap: 1rem;
          align-items: start;
          min-height: calc(100vh - 140px);
        }
        @media (max-width: 1100px) { .board { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px) { .board { grid-template-columns: 1fr; } }
        .column {
          background: rgba(26, 35, 50, 0.65);
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px;
          padding: 0.65rem;
          min-height: 320px;
          transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
        }
        .column.drag-over {
          background: color-mix(in srgb, var(--col-accent) 8%, rgba(26,35,50,0.9));
          border-color: color-mix(in srgb, var(--col-accent) 40%, transparent);
          box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--col-accent) 25%, transparent);
        }
        .col-header {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-bottom: 0.75rem;
          padding: 0.25rem 0.35rem;
        }
        .col-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--col-accent);
          flex-shrink: 0;
        }
        .col-header h2 {
          margin: 0;
          flex: 1;
          font-size: 0.82rem;
          font-weight: 600;
          letter-spacing: 0.02em;
          color: #e2e8f0;
        }
        .count {
          font-size: 0.72rem;
          font-weight: 600;
          color: var(--muted);
          background: rgba(0,0,0,0.25);
          padding: 0.12rem 0.45rem;
          border-radius: 99px;
        }
        .cards {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
          min-height: 120px;
        }
        .empty-col {
          margin: 1rem 0;
          text-align: center;
          font-size: 0.75rem;
          color: var(--muted);
          opacity: 0.7;
        }
      `}</style>
    </div>
  );
}
