import { useCallback, useEffect, useState } from "react";
import {
  adminCheck,
  adminLogin,
  adminLogout,
  AdminStats,
  AdminUserRow,
  fetchAdminStats,
  fetchAdminTimeseries,
  fetchAdminUsers,
  TimeseriesPoint,
} from "../api/admin";
import "../styles/admin.css";
import { AppBrandName } from "../components/AppBrandName";
import { SeoHead } from "../components/SeoHead";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const DAY_OPTIONS = [
  { label: "7 дней", days: 7 },
  { label: "30 дней", days: 30 },
  { label: "90 дней", days: 90 },
];

type AdminTab = "analytics" | "users";

function formatDt(iso: string | null): string {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

function userNick(u: AdminUserRow): string {
  if (u.display_name) return u.display_name;
  if (u.telegram_username) return `@${u.telegram_username.replace(/^@/, "")}`;
  return `api_id ${u.api_id}`;
}

export function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [username, setUsername] = useState("root");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [visitsSeries, setVisitsSeries] = useState<TimeseriesPoint[]>([]);
  const [regSeries, setRegSeries] = useState<TimeseriesPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [tab, setTab] = useState<AdminTab>("users");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [usersLoading, setUsersLoading] = useState(false);

  const checkAuth = useCallback(async () => {
    setAuthed(await adminCheck());
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const [s, v, r] = await Promise.all([
        fetchAdminStats(days),
        fetchAdminTimeseries("visits", days),
        fetchAdminTimeseries("registrations", days),
      ]);
      setStats(s);
      setVisitsSeries(v);
      setRegSeries(r);
    } catch {
      setAuthed(false);
    } finally {
      setLoading(false);
    }
  }, [days]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const data = await fetchAdminUsers();
      setUsers(data.users);
      setUsersTotal(data.total);
    } catch {
      setAuthed(false);
    } finally {
      setUsersLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authed) loadStats();
  }, [authed, loadStats]);

  useEffect(() => {
    if (authed) loadUsers();
  }, [authed, loadUsers]);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    try {
      await adminLogin(username, password);
      setAuthed(true);
      setPassword("");
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : "Ошибка");
    }
  };

  const onLogout = async () => {
    await adminLogout();
    setAuthed(false);
    setStats(null);
  };

  const adminSeo = <SeoHead noindex path="/admin" />;

  if (authed === null) {
    return (
      <>
        {adminSeo}
        <div className="admin-root admin-loading">Загрузка…</div>
      </>
    );
  }

  if (!authed) {
    return (
      <>
        {adminSeo}
      <div className="admin-root">
        <div className="admin-login">
          <h1>Админ-панель</h1>
          <p style={{ color: "#94a3b8", margin: 0 }}>Аналитика и зарегистрированные пользователи</p>
          <form onSubmit={onLogin}>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Логин"
              autoComplete="username"
            />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Пароль"
              autoComplete="current-password"
            />
            {loginError && <p className="err">{loginError}</p>}
            <button type="submit">Войти</button>
          </form>
        </div>
      </div>
      </>
    );
  }

  const regByDate = new Map(regSeries.map((p) => [p.date, p.count]));
  const chartData = visitsSeries.map((v) => ({
    date: v.date.slice(5),
    visits: v.count,
    registrations: regByDate.get(v.date) ?? 0,
  }));

  return (
    <>
      {adminSeo}
    <div className="admin-root">
      <header className="admin-header">
        <h1>
          <AppBrandName /> — админ
        </h1>
        <button type="button" onClick={onLogout}>
          Выйти
        </button>
      </header>

      <main className="admin-main">
        <div className="admin-tabs">
          <button
            type="button"
            className={tab === "users" ? "active" : ""}
            onClick={() => setTab("users")}
          >
            Пользователи ({usersTotal})
          </button>
          <button
            type="button"
            className={tab === "analytics" ? "active" : ""}
            onClick={() => setTab("analytics")}
          >
            Аналитика UTM
          </button>
        </div>

        {tab === "users" && (
          <section className="admin-section admin-section-users">
            <h2>Зарегистрированные пользователи</h2>
            {usersLoading && users.length === 0 ? (
              <p className="admin-loading">Загрузка…</p>
            ) : users.length === 0 ? (
              <p style={{ color: "#94a3b8", margin: 0 }}>Пока нет tenant с данными на диске.</p>
            ) : (
              <table className="admin-table admin-table-users">
                <thead>
                  <tr>
                    <th>Пользователь</th>
                    <th>Статус</th>
                    <th>Чаты · задачи · сообщ.</th>
                    <th>Интеграции</th>
                    <th>Даты</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.api_id}>
                      <td>
                        <strong>{userNick(u)}</strong>
                        {u.telegram_username && (
                          <div className="admin-muted">@{u.telegram_username.replace(/^@/, "")}</div>
                        )}
                        {u.telegram_phone && (
                          <div className="admin-muted">{u.telegram_phone}</div>
                        )}
                        {u.telegram_user_id != null && (
                          <div className="admin-muted">TG ID {u.telegram_user_id}</div>
                        )}
                        <div className="admin-muted">
                          api_id <code>{u.api_id}</code>
                        </div>
                        {u.app_title && <div className="admin-muted">Приложение: {u.app_title}</div>}
                      </td>
                      <td>
                        {u.is_authorized ? (
                          <span className="admin-badge admin-badge-ok">В Telegram</span>
                        ) : u.has_credentials ? (
                          <span className="admin-badge">Ключи заданы</span>
                        ) : (
                          <span className="admin-badge admin-badge-muted">Нет входа</span>
                        )}
                      </td>
                      <td className="admin-col-stats">
                        {u.monitored_chats}/{u.total_chats} · {u.tasks_count} · {u.messages_count}
                      </td>
                      <td>
                        {u.integrations.length > 0 ? u.integrations.join(", ") : "—"}
                      </td>
                      <td>
                        <div className="admin-muted">Рег. {formatDt(u.registered_at)}</div>
                        <div>Акт. {formatDt(u.last_message_at || u.updated_at)}</div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        )}

        {tab === "analytics" && (
          <>
        <div className="admin-filters">
          {DAY_OPTIONS.map((o) => (
            <button
              key={o.days}
              type="button"
              className={days === o.days ? "active" : ""}
              onClick={() => setDays(o.days)}
            >
              {o.label}
            </button>
          ))}
        </div>

        {loading && !stats ? (
          <p className="admin-loading">Загрузка статистики…</p>
        ) : stats ? (
          <>
            <div className="admin-cards">
              <div className="admin-card">
                <div className="label">Визиты</div>
                <div className="value">{stats.totals.visits}</div>
              </div>
              <div className="admin-card">
                <div className="label">Уникальные</div>
                <div className="value">{stats.totals.unique_visitors}</div>
              </div>
              <div className="admin-card">
                <div className="label">Регистрации</div>
                <div className="value">{stats.totals.registrations}</div>
              </div>
              <div className="admin-card">
                <div className="label">Входы</div>
                <div className="value">{stats.totals.logins}</div>
              </div>
              <div className="admin-card">
                <div className="label">Конверсия</div>
                <div className="value">{stats.totals.conversion_pct}%</div>
              </div>
            </div>

            <section className="admin-section">
              <h2>Динамика</h2>
              <div className="admin-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #475569" }}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="visits"
                      name="Визиты"
                      stroke="#818cf8"
                      strokeWidth={2}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="registrations"
                      name="Регистрации"
                      stroke="#34d399"
                      strokeWidth={2}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="admin-section">
              <h2>Источники (utm_source)</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Источник</th>
                    <th>Визиты</th>
                    <th>Уникальные</th>
                    <th>Регистрации</th>
                    <th>Конверсия</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.by_source.map((row) => (
                    <tr key={row.utm_source}>
                      <td>{row.utm_source}</td>
                      <td>{row.visits}</td>
                      <td>{row.unique_visitors}</td>
                      <td>{row.registrations}</td>
                      <td>{row.conversion_pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>

            <section className="admin-section">
              <h2>Визиты по medium</h2>
              <div className="admin-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats.by_medium.slice(0, 10)}>
                    <CartesianGrid stroke="#334155" strokeDasharray="3 3" />
                    <XAxis dataKey="utm_medium" stroke="#94a3b8" fontSize={10} />
                    <YAxis stroke="#94a3b8" fontSize={11} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{ background: "#1e293b", border: "1px solid #475569" }}
                    />
                    <Bar dataKey="visits" name="Визиты" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section className="admin-section">
              <h2>Кампании</h2>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Кампания</th>
                    <th>Источник</th>
                    <th>Визиты</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.by_campaign.map((row, i) => (
                    <tr key={`${row.utm_campaign}-${i}`}>
                      <td>{row.utm_campaign}</td>
                      <td>{row.utm_source}</td>
                      <td>{row.visits}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        ) : null}
          </>
        )}
      </main>
    </div>
    </>
  );
}
