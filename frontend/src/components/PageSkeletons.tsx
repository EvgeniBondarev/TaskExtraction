import { useI18n } from "../i18n";
import { AppLogo } from "./AppLogo";
import { Skeleton, SkeletonGroup } from "./Skeleton";

export function AppBootSkeleton() {
  return (
    <div className="te-theme te-boot">
      <SkeletonGroup label="Загрузка приложения">
        <AppLogo size={48} />
        <Skeleton width={160} height={14} radius={6} style={{ marginTop: "1.25rem" }} />
      </SkeletonGroup>
    </div>
  );
}

function KanbanCardSkeleton() {
  return (
    <div className="te-sk-card">
      <div className="te-sk-row">
        <Skeleton width={64} height={18} radius={999} />
        <Skeleton width={44} height={18} radius={999} />
      </div>
      <Skeleton width="88%" height={14} radius={5} style={{ marginTop: "0.7rem" }} />
      <Skeleton width="60%" height={12} radius={5} style={{ marginTop: "0.4rem" }} />
      <div className="te-sk-row" style={{ marginTop: "0.85rem" }}>
        <Skeleton width={24} height={24} circle />
        <Skeleton width={90} height={10} radius={4} />
      </div>
    </div>
  );
}

function PageHeadSkeleton() {
  return (
    <div className="te-sk-head">
      <Skeleton width={180} height={28} radius={8} />
      <Skeleton width={360} height={12} radius={4} style={{ marginTop: "0.6rem", maxWidth: "80%" }} />
      <div className="te-sk-row" style={{ marginTop: "1.5rem" }}>
        <Skeleton width={280} height={40} radius={10} />
        <Skeleton width={70} height={32} radius={999} />
        <Skeleton width={110} height={32} radius={999} />
        <Skeleton width={70} height={32} radius={999} />
      </div>
    </div>
  );
}

export function KanbanBoardSkeleton() {
  const cols = [3, 2, 1, 1];
  return (
    <SkeletonGroup className="te-page" label="Загрузка задач">
      <PageHeadSkeleton />
      <div className="te-board">
        {cols.map((count, i) => (
          <div key={i} className="te-col">
            <div className="te-sk-row" style={{ padding: "0.25rem 0.25rem 0.75rem" }}>
              <Skeleton width={70} height={14} radius={4} />
              <Skeleton width={22} height={18} radius={999} style={{ marginLeft: "auto" }} />
            </div>
            <div className="te-col__cards">
              {Array.from({ length: count }).map((_, j) => (
                <KanbanCardSkeleton key={j} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkeletonGroup>
  );
}

function FeedMessageSkeleton() {
  return (
    <div className="te-msg">
      <Skeleton width={40} height={40} circle style={{ flexShrink: 0 }} />
      <div style={{ flex: 1 }}>
        <div className="te-sk-row">
          <Skeleton width={120} height={14} radius={5} />
          <Skeleton width={90} height={20} radius={999} style={{ marginLeft: "auto" }} />
        </div>
        <Skeleton width="92%" height={12} radius={4} style={{ marginTop: "0.6rem" }} />
        <Skeleton width="70%" height={12} radius={4} style={{ marginTop: "0.4rem" }} />
      </div>
    </div>
  );
}

export function FeedPageSkeleton() {
  const { messages: t } = useI18n();
  return (
    <SkeletonGroup className="te-page te-feed" label={t.feed.loadingSkeleton}>
      <PageHeadSkeleton />
      <div className="te-feed__list">
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
        <Skeleton width={130} height={14} radius={5} />
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
          padding: 0.85rem 1rem;
          background: rgba(59, 130, 246, 0.08);
          border-bottom: 1px solid rgba(59, 130, 246, 0.2);
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
    <SkeletonGroup className="te-stack" label="Загрузка интеграций">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="te-int">
          <div className="te-int__trigger">
            <Skeleton width={36} height={36} radius={10} />
            <div style={{ flex: 1 }}>
              <Skeleton width={`${30 + (i % 3) * 10}%`} height={14} radius={5} />
              <Skeleton width="45%" height={10} radius={4} style={{ marginTop: "0.35rem" }} />
            </div>
            <Skeleton width={70} height={22} radius={999} />
          </div>
        </div>
      ))}
    </SkeletonGroup>
  );
}

export function AdminDashboardSkeleton({ users = false }: { users?: boolean }) {
  return (
    <SkeletonGroup className="admin-skeleton" label={users ? "Загрузка пользователей" : "Загрузка аналитики"}>
      {users ? (
        <div className="admin-section">
          <Skeleton width={240} height={20} radius={6} style={{ marginBottom: "1rem" }} />
          {Array.from({ length: 5 }).map((_, row) => (
            <div className="admin-skeleton__table-row" key={row}>
              <Skeleton width={`${48 + (row % 3) * 8}%`} height={14} radius={4} />
              <Skeleton width="18%" height={20} radius={999} />
              <Skeleton width="16%" height={14} radius={4} />
              <Skeleton width="15%" height={14} radius={4} />
            </div>
          ))}
        </div>
      ) : (
        <>
          <div className="admin-cards">
            {Array.from({ length: 5 }).map((_, i) => (
              <div className="admin-card" key={i}>
                <Skeleton width="52%" height={10} radius={4} />
                <Skeleton width="70%" height={28} radius={6} style={{ marginTop: "0.55rem" }} />
              </div>
            ))}
          </div>
          <div className="admin-section">
            <Skeleton width={140} height={20} radius={6} />
            <Skeleton height={260} radius={8} style={{ marginTop: "1rem" }} />
          </div>
        </>
      )}
      <style>{`
        .admin-skeleton__table-row {
          display: grid;
          grid-template-columns: 2fr 0.7fr 0.7fr 0.7fr;
          align-items: center;
          gap: 1rem;
          min-height: 3.5rem;
          border-top: 1px solid #334155;
        }
        @media (max-width: 640px) {
          .admin-skeleton__table-row { grid-template-columns: 1fr 0.65fr; }
          .admin-skeleton__table-row > :nth-child(n + 3) { display: none; }
        }
      `}</style>
    </SkeletonGroup>
  );
}

export function AnalyticsDashboardSkeleton() {
  return (
    <SkeletonGroup className="te-analytics" label="Загрузка аналитики">
      <section className="te-analytics__metrics" aria-hidden>
        {Array.from({ length: 4 }).map((_, i) => (
          <article key={i}>
            <Skeleton width="48%" height={12} radius={4} />
            <Skeleton width="60%" height={30} radius={7} style={{ marginTop: "0.85rem" }} />
            <Skeleton width="72%" height={10} radius={4} style={{ marginTop: "0.5rem" }} />
          </article>
        ))}
      </section>
      <section className="te-panel te-analytics__chart">
        <Skeleton width={210} height={20} radius={6} />
        <Skeleton width={320} height={12} radius={4} style={{ marginTop: "0.5rem", maxWidth: "80%" }} />
        <Skeleton height={280} radius={10} style={{ marginTop: "1.5rem" }} />
      </section>
    </SkeletonGroup>
  );
}
