import { useCallback, useEffect, useState } from "react";
import {
  adminCheck,
  adminLogin,
  adminLogout,
  AdminStats,
  fetchAdminStats,
  fetchAdminTimeseries,
  TimeseriesPoint,
} from "../api/admin";
import "../styles/admin.css";
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

  useEffect(() => {
    if (authed) loadStats();
  }, [authed, loadStats]);

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

  if (authed === null) {
    return <div className="admin-root admin-loading">Загрузка…</div>;
  }

  if (!authed) {
    return (
      <div className="admin-root">
        <div className="admin-login">
          <h1>Админ-панель</h1>
          <p style={{ color: "#94a3b8", margin: 0 }}>Аналитика посещений и UTM</p>
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
    );
  }

  const regByDate = new Map(regSeries.map((p) => [p.date, p.count]));
  const chartData = visitsSeries.map((v) => ({
    date: v.date.slice(5),
    visits: v.count,
    registrations: regByDate.get(v.date) ?? 0,
  }));

  return (
    <div className="admin-root">
      <header className="admin-header">
        <h1>TaskExtraction — аналитика</h1>
        <button type="button" onClick={onLogout}>
          Выйти
        </button>
      </header>

      <main className="admin-main">
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
      </main>
    </div>
  );
}
