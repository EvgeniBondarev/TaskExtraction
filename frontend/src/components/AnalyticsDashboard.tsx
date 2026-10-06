import { ChartLine, SignIn, UsersThree, Kanban } from "@phosphor-icons/react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchOwnerAnalyticsStats,
  fetchOwnerAnalyticsTimeseries,
  fetchOwnerAnalyticsUsers,
} from "../api/ownerAnalytics";
import type { AdminStats, AdminUserRow, TimeseriesPoint } from "../api/admin";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AnalyticsDashboardSkeleton } from "./PageSkeletons";

const PERIODS = [7, 30, 90];

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ru-RU", { day: "2-digit", month: "short", year: "numeric" });
}

function accountName(user: AdminUserRow): string {
  return user.display_name || (user.telegram_username ? `@${user.telegram_username.replace(/^@/, "")}` : `Аккаунт ${user.api_id}`);
}

export function AnalyticsDashboard() {
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [visits, setVisits] = useState<TimeseriesPoint[]>([]);
  const [registrations, setRegistrations] = useState<TimeseriesPoint[]>([]);
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [nextStats, nextVisits, nextRegistrations, nextUsers] = await Promise.all([
        fetchOwnerAnalyticsStats(days),
        fetchOwnerAnalyticsTimeseries("visits", days),
        fetchOwnerAnalyticsTimeseries("registrations", days),
        fetchOwnerAnalyticsUsers(),
      ]);
      setStats(nextStats);
      setVisits(nextVisits);
      setRegistrations(nextRegistrations);
      setUsers(nextUsers.users);
    } catch {
      setError("Не удалось загрузить аналитику. Попробуйте обновить страницу.");
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { void load(); }, [load]);

  const chartData = useMemo(() => {
    const registrationsByDate = new Map(registrations.map((point) => [point.date, point.count]));
    return visits.map((point) => ({
      date: point.date.slice(5),
      visits: point.count,
      registrations: registrationsByDate.get(point.date) ?? 0,
    }));
  }, [registrations, visits]);

  return (
    <main className="te-analytics">
      <header className="te-page-head">
        <div>
          <span className="te-eyebrow">Владелец</span>
          <h1>Аналитика продукта</h1>
          <p>Посещаемость сайта, входы и активность всех рабочих областей.</p>
        </div>
      </header>

      <div className="te-segment te-analytics__period" role="group" aria-label="Период аналитики">
        {PERIODS.map((period) => (
          <button key={period} type="button" className={days === period ? "is-active" : ""} onClick={() => setDays(period)}>
            {period} дней
          </button>
        ))}
      </div>

      {loading && !stats ? <AnalyticsDashboardSkeleton /> : null}
      {error ? <p className="te-alert te-alert--error">{error}</p> : null}

      {stats && (
        <>
          <section className="te-analytics__metrics" aria-label="Ключевые показатели">
            <article><span><ChartLine size={19} aria-hidden />Визиты</span><strong>{stats.totals.visits}</strong><small>за {days} дней</small></article>
            <article><span><UsersThree size={19} aria-hidden />Уникальные</span><strong>{stats.totals.unique_visitors}</strong><small>посетителей сайта</small></article>
            <article><span><SignIn size={19} aria-hidden />Входы</span><strong>{stats.totals.logins}</strong><small>в панели</small></article>
            <article><span><Kanban size={19} aria-hidden />Регистрации</span><strong>{stats.totals.registrations}</strong><small>конверсия {stats.totals.conversion_pct}%</small></article>
          </section>

          <section className="te-panel te-analytics__chart">
            <div className="te-panel__head"><div><h2>Динамика посещений</h2><p>Визиты сайта и регистрации по дням.</p></div></div>
            <div className="te-analytics__chart-canvas">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <XAxis dataKey="date" stroke="var(--muted)" fontSize={11} />
                  <YAxis stroke="var(--muted)" fontSize={11} allowDecimals={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="visits" name="Визиты" stroke="var(--accent)" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="registrations" name="Регистрации" stroke="var(--ok)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <div className="te-analytics__grid">
            <section className="te-panel te-analytics__sources">
              <div className="te-panel__head"><div><h2>Источники визитов</h2><p>UTM-источник и конверсия в регистрацию.</p></div></div>
              <div className="te-table-wrap"><table className="te-table"><thead><tr><th>Источник</th><th>Визиты</th><th>Уникальные</th><th>Рег.</th></tr></thead><tbody>
                {stats.by_source.length ? stats.by_source.map((row) => <tr key={row.utm_source}><td>{row.utm_source}</td><td>{row.visits}</td><td>{row.unique_visitors}</td><td>{row.registrations}</td></tr>) : <tr><td colSpan={4}>Нет данных за выбранный период.</td></tr>}
              </tbody></table></div>
            </section>
            <section className="te-panel te-analytics__chart te-analytics__medium">
              <div className="te-panel__head"><div><h2>Каналы</h2><p>Посещения по UTM medium.</p></div></div>
              <div className="te-analytics__chart-canvas">
                <ResponsiveContainer width="100%" height="100%"><BarChart data={stats.by_medium.slice(0, 8)}><CartesianGrid stroke="var(--border)" strokeDasharray="3 3" /><XAxis dataKey="utm_medium" stroke="var(--muted)" fontSize={10} /><YAxis stroke="var(--muted)" fontSize={11} allowDecimals={false} /><Tooltip /><Bar dataKey="visits" name="Визиты" fill="var(--accent)" radius={[5, 5, 0, 0]} /></BarChart></ResponsiveContainer>
              </div>
            </section>
          </div>

          <section className="te-panel te-analytics__accounts">
            <div className="te-panel__head"><div><h2>Аккаунты</h2><p>{users.length} рабочих областей: задачи, сообщения и последняя активность.</p></div></div>
            <div className="te-table-wrap"><table className="te-table"><thead><tr><th>Аккаунт</th><th>Статус</th><th>Задачи</th><th>Сообщения</th><th>Чаты</th><th>Активность</th></tr></thead><tbody>
              {users.length ? users.map((user) => <tr key={user.api_id}><td><strong>{accountName(user)}</strong><small className="te-analytics__sub">{user.telegram_username ? `@${user.telegram_username.replace(/^@/, "")}` : `ID ${user.api_id}`}</small></td><td><span className={`te-status ${user.is_authorized ? "te-status--created" : "te-status--pending"}`}>{user.is_authorized ? "Telegram подключён" : "Не подключён"}</span></td><td>{user.tasks_count}</td><td>{user.messages_count}</td><td>{user.monitored_chats}/{user.total_chats}</td><td>{formatDate(user.last_message_at || user.updated_at || user.registered_at)}</td></tr>) : <tr><td colSpan={6}>Пока нет подключённых аккаунтов.</td></tr>}
            </tbody></table></div>
          </section>
        </>
      )}
    </main>
  );
}
