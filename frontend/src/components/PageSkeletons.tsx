import { useI18n } from "../i18n";
import { AppLogo } from "./AppLogo";
import { Skeleton, SkeletonGroup } from "./Skeleton";
import "../styles/feed-page.css";

export function AppBootSkeleton() {
  return (
    <div className="boot-skeleton center-page">
      <SkeletonGroup label="Загрузка приложения">
        <AppLogo size={48} />
        <Skeleton width={160} height={22} radius={6} style={{ marginTop: "1rem" }} />
        <Skeleton width={220} height={14} radius={6} style={{ marginTop: "0.5rem" }} />
        <div className="boot-cards">
          <Skeleton height={72} radius={12} />
          <Skeleton height={72} radius={12} />
        </div>
      </SkeletonGroup>
      <style>{`
        .boot-skeleton {
          flex-direction: column;
          align-items: center;
          text-align: center;
        }
        .boot-skeleton .skeleton-group {
          display: flex;
          flex-direction: column;
          align-items: center;
          max-width: 280px;
        }
        .boot-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.65rem;
          width: 100%;
          margin-top: 1.5rem;
        }
      `}</style>
    </div>
  );
}

function KanbanCardSkeleton() {
  return (
    <div className="sk-kanban-card">
      <div className="sk-row">
        <Skeleton width={52} height={18} radius={5} />
        <Skeleton width={40} height={18} radius={5} />
      </div>
      <Skeleton width="88%" height={14} radius={5} style={{ marginTop: "0.55rem" }} />
      <Skeleton width="65%" height={12} radius={5} style={{ marginTop: "0.35rem" }} />
      <div className="sk-footer">
        <Skeleton width={28} height={28} circle />
        <Skeleton width={80} height={10} radius={4} />
      </div>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  const cols = [
    { cards: 3 },
    { cards: 2 },
    { cards: 1 },
    { cards: 1 },
  ];
  return (
    <SkeletonGroup className="sk-board-wrap" label="Загрузка задач">
      <div className="sk-board">
        {cols.map((col, i) => (
          <div key={i} className="sk-column">
            <div className="sk-col-head">
              <Skeleton width={12} height={12} circle />
              <Skeleton width={64} height={12} radius={4} />
              <Skeleton width={20} height={18} radius={999} style={{ marginLeft: "auto" }} />
            </div>
            <div className="sk-col-cards">
              {Array.from({ length: col.cards }).map((_, j) => (
                <KanbanCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <style>{`
        .sk-board-wrap { width: 100%; }
        .sk-board {
          display: grid;
          grid-template-columns: repeat(4, minmax(200px, 1fr));
          gap: 0.85rem;
          align-items: start;
        }
        .sk-column {
          background: rgba(0, 0, 0, 0.15);
          border-radius: 12px;
          padding: 0.65rem;
          border: 1px solid var(--border);
        }
        .sk-col-head {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-bottom: 0.65rem;
          padding: 0 0.15rem;
        }
        .sk-col-cards { display: flex; flex-direction: column; gap: 0.55rem; }
        .sk-kanban-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 12px;
          padding: 0.75rem 0.85rem;
        }
        .sk-row { display: flex; gap: 0.35rem; }
        .sk-footer {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin-top: 0.65rem;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(45, 58, 79, 0.5);
        }
        @media (max-width: 1100px) {
          .sk-board { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .sk-board { grid-template-columns: 1fr; }
        }
      `}</style>
    </SkeletonGroup>
  );
}

function FeedMessageSkeleton() {
  return (
    <div className="sk-feed-msg">
      <Skeleton width={48} height={48} circle style={{ flexShrink: 0 }} />
      <div className="sk-feed-body">
        <div className="sk-feed-row">
          <Skeleton width={120} height={14} radius={5} />
          <Skeleton width={72} height={22} radius={6} style={{ marginLeft: "auto" }} />
        </div>
        <Skeleton width="95%" height={12} radius={4} style={{ marginTop: "0.5rem" }} />
        <Skeleton width="78%" height={12} radius={4} style={{ marginTop: "0.35rem" }} />
        <Skeleton width="40%" height={12} radius={4} style={{ marginTop: "0.35rem" }} />
      </div>
    </div>
  );
}

export function FeedPageSkeleton() {
  const { messages: t } = useI18n();
  return (
    <SkeletonGroup className="sk-feed-wrap" label={t.feed.loadingSkeleton}>
      <div className="sk-feed-header">
        <div className="sk-feed-header-main">
          <Skeleton width={40} height={40} radius={10} />
          <div style={{ flex: 1 }}>
            <Skeleton width={160} height={18} radius={6} />
            <Skeleton width={220} height={12} radius={4} style={{ marginTop: "0.4rem" }} />
          </div>
        </div>
        <div className="sk-feed-stats">
          <Skeleton width={84} height={52} radius={10} />
          <Skeleton width={84} height={52} radius={10} />
        </div>
      </div>
      <Skeleton height={44} radius={12} style={{ marginBottom: "1rem" }} />
      <div className="sk-feed-list">
        {Array.from({ length: 4 }).map((_, i) => (
          <FeedMessageSkeleton key={i} />
        ))}
      </div>
    </SkeletonGroup>
  );
}

export function ChatListSkeleton({
  rows = 6,
  message = "Загрузка чатов",
}: {
  rows?: number;
  message?: string;
}) {
  return (
    <SkeletonGroup className="sk-chat-list" label={message}>
      <div className="sk-chat-loading-head">
        <span className="sk-chat-spinner" aria-hidden />
        <span>{message}</span>
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="sk-chat-row">
          <Skeleton width={42} height={42} circle />
          <div className="sk-chat-meta">
            <Skeleton width={`${55 + (i % 3) * 12}%`} height={14} radius={5} />
            <Skeleton width="40%" height={10} radius={4} style={{ marginTop: "0.35rem" }} />
          </div>
          <Skeleton width={18} height={18} radius={5} />
        </div>
      ))}
      <style>{`
        .sk-chat-list { width: 100%; }
        .sk-chat-loading-head {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          padding: 0.85rem 1rem;
          font-size: 0.88rem;
          color: #93c5fd;
          background: rgba(59, 130, 246, 0.08);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
        }
        .sk-chat-spinner {
          width: 1.1rem;
          height: 1.1rem;
          border: 2px solid rgba(59, 130, 246, 0.25);
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: sk-chat-spin 0.75s linear infinite;
          flex-shrink: 0;
        }
        @keyframes sk-chat-spin {
          to { transform: rotate(360deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .sk-chat-spinner { animation: none; border-top-color: rgba(59, 130, 246, 0.5); }
        }
        .sk-chat-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 1rem;
          border-bottom: 1px solid var(--border);
        }
        .sk-chat-row:last-child { border-bottom: none; }
        .sk-chat-meta { flex: 1; min-width: 0; }
      `}</style>
    </SkeletonGroup>
  );
}

export function SettingsFormSkeleton({ fields = 3 }: { fields?: number }) {
  return (
    <SkeletonGroup label="Загрузка настроек">
      <Skeleton width="55%" height={18} radius={6} />
      <Skeleton width="80%" height={12} radius={4} style={{ marginTop: "0.5rem", marginBottom: "1rem" }} />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} style={{ marginBottom: "0.85rem" }}>
          <Skeleton width={90} height={10} radius={4} style={{ marginBottom: "0.35rem" }} />
          <Skeleton height={40} radius={10} />
        </div>
      ))}
      <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem" }}>
        <Skeleton width={120} height={38} radius={10} />
        <Skeleton width={100} height={38} radius={10} />
      </div>
    </SkeletonGroup>
  );
}

export function IntegrationsOverviewSkeleton() {
  return (
    <SkeletonGroup className="sk-int-overview" label="Загрузка интеграций">
      <Skeleton width={140} height={28} radius={999} style={{ marginBottom: "0.85rem" }} />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="sk-int-row">
          <Skeleton width={40} height={40} radius={10} />
          <div style={{ flex: 1 }}>
            <Skeleton width={`${40 + (i % 4) * 10}%`} height={14} radius={5} />
            <Skeleton width="50%" height={10} radius={4} style={{ marginTop: "0.3rem" }} />
          </div>
          <Skeleton width={56} height={22} radius={6} />
        </div>
      ))}
      <style>{`
        .sk-int-overview {
          padding: 1rem;
          border-radius: 14px;
          border: 1px solid var(--border);
          background: var(--surface);
        }
        .sk-int-row {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.65rem 0;
          border-bottom: 1px solid rgba(45, 58, 79, 0.4);
        }
        .sk-int-row:last-child { border-bottom: none; }
      `}</style>
    </SkeletonGroup>
  );
}
