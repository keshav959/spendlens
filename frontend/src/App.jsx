import { useState, useEffect, useContext, createContext, useCallback } from "react";

// ===================== CONTEXT =====================
const AuthContext = createContext(null);
const useAuth = () => useContext(AuthContext);

// ===================== API SERVICE =====================
const API_BASE = "/api";

const api = {
  async request(method, path, body = null, token = null) {
    const headers = { "Content-Type": "application/json" };
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : null,
    });
    const data = await res.json();
    if (!data.success) throw new Error(data.message || "Request failed");
    return data.data;
  },
  register: (body) => api.request("POST", "/auth/register", body),
  login: (body) => api.request("POST", "/auth/login", body),
  verifyOtp: (body) => api.request("POST", "/auth/verify-otp", body),
  getExpenses: (token) => api.request("GET", "/expenses", null, token),
  createExpense: (body, token) => api.request("POST", "/expenses", body, token),
  updateExpense: (id, body, token) => api.request("PUT", `/expenses/${id}`, body, token),
  deleteExpense: (id, token) => api.request("DELETE", `/expenses/${id}`, null, token),
  getDashboard: (token) => api.request("GET", "/expenses/dashboard", null, token),
  getRecurring: (token) => api.request("GET", "/recurring", null, token),
  createRecurring: (body, token) => api.request("POST", "/recurring", body, token),
  updateRecurring: (id, body, token) => api.request("PUT", `/recurring/${id}`, body, token),
  deleteRecurring: (id, token) => api.request("DELETE", `/recurring/${id}`, null, token),
};

// ===================== ICONS =====================
const icons = {
  dashboard: "⊞", expenses: "₹", add: "+", logout: "⇥",
  edit: "✎", delete: "⌫", close: "×", food: "🍴",
  transport: "🚗", housing: "🏠", entertainment: "🎭",
  healthcare: "💊", shopping: "🛍", education: "📚",
  utilities: "💡", travel: "✈", other: "📦",
  up: "↑", down: "↓", wallet: "◈", trend: "∿", count: "#",
  search: "⌕", filter: "⊟", check: "✓", user: "◉",
  sun: "☀", moon: "☾", repeat: "↻",
};

const categoryIcon = (cat) => icons[cat?.toLowerCase()] || icons.other;
const categoryColors = {
  FOOD: "#FF6B6B", TRANSPORT: "#4ECDC4", HOUSING: "#45B7D1",
  ENTERTAINMENT: "#96CEB4", HEALTHCARE: "#FFEAA7", SHOPPING: "#DDA0DD",
  EDUCATION: "#98D8C8", UTILITIES: "#F0A500", TRAVEL: "#FF8C94", OTHER: "#A8A8A8",
};

// ===================== STYLES =====================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Mono:wght@300;400;500&display=swap');
  
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  
  :root {
    --bg: #0a0a0f;
    --surface: #12121a;
    --surface2: #1a1a26;
    --border: #252535;
    --accent: #7B61FF;
    --accent2: #FF61B6;
    --accent3: #61FFD4;
    --text: #e8e8f0;
    --muted: #666680;
    --danger: #FF4757;
    --success: #2ED573;
    --warn: #FFA502;
    --radius: 16px;
    --radius-sm: 8px;
    --shadow: 0 8px 32px rgba(0,0,0,0.4);
  }

  :root[data-theme="light"] {
    --bg: #f7f6fb;
    --surface: #ffffff;
    --surface2: #f1f0f6;
    --border: #e2e1ea;
    --accent: #2F6BFF;
    --accent2: #FF6F91;
    --accent3: #00C2A8;
    --text: #161622;
    --muted: #6b6b7a;
    --danger: #E53935;
    --success: #2E7D32;
    --warn: #F57C00;
    --shadow: 0 10px 28px rgba(16, 18, 32, 0.12);
  }

  body {
    background: var(--bg);
    color: var(--text);
    font-family: 'Syne', sans-serif;
    min-height: 100vh;
  }

  .mono { font-family: 'DM Mono', monospace; }

  .theme-toggle {
    margin-top: 12px;
    width: 100%;
    border-radius: 12px;
    border: 1px solid var(--border);
    background: var(--surface2);
    color: var(--text);
    font-weight: 600;
    padding: 10px 12px;
    cursor: pointer;
  }

  .theme-toggle:hover { filter: brightness(1.05); }

  .recurring-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
    gap: 16px;
  }

  .recurring-card {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 16px;
  }

  .recurring-meta { color: var(--muted); font-size: 12px; margin-top: 6px; }

  .recurring-actions { display: flex; gap: 8px; margin-top: 12px; }

  /* AUTH SCREEN */
  .auth-screen {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(ellipse at 20% 50%, rgba(123,97,255,0.15) 0%, transparent 60%),
                radial-gradient(ellipse at 80% 20%, rgba(255,97,182,0.1) 0%, transparent 50%),
                var(--bg);
  }

  .auth-card {
    width: 100%;
    max-width: 440px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 48px;
    box-shadow: 0 32px 80px rgba(0,0,0,0.5);
  }

  .auth-logo {
    font-size: 32px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    margin-bottom: 8px;
    letter-spacing: -1px;
  }

  .auth-subtitle { color: var(--muted); font-size: 14px; margin-bottom: 40px; }

  .input-group { margin-bottom: 20px; }
  .input-label { display: block; font-size: 12px; font-weight: 600; color: var(--muted); margin-bottom: 8px; letter-spacing: 0.08em; text-transform: uppercase; }
  
  .input {
    width: 100%;
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    color: var(--text);
    font-family: 'DM Mono', monospace;
    font-size: 14px;
    outline: none;
    transition: border-color 0.2s;
  }
  .input:focus { border-color: var(--accent); }
  .input::placeholder { color: var(--muted); }

  .btn {
    width: 100%;
    padding: 14px 24px;
    border-radius: var(--radius-sm);
    border: none;
    font-family: 'Syne', sans-serif;
    font-weight: 700;
    font-size: 15px;
    cursor: pointer;
    transition: all 0.2s;
    letter-spacing: 0.02em;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    color: white;
  }
  .btn-primary:hover { opacity: 0.9; transform: translateY(-1px); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
  .btn-ghost {
    background: transparent;
    color: var(--muted);
    border: 1px solid var(--border);
  }
  .btn-ghost:hover { border-color: var(--accent); color: var(--accent); }
  .btn-danger { background: var(--danger); color: white; }
  .btn-sm { width: auto; padding: 8px 16px; font-size: 13px; border-radius: 6px; }

  .auth-switch { text-align: center; margin-top: 24px; color: var(--muted); font-size: 14px; }
  .auth-switch span { color: var(--accent); cursor: pointer; font-weight: 600; }
  .auth-switch span:hover { text-decoration: underline; }

  .error-msg { background: rgba(255,71,87,0.1); border: 1px solid rgba(255,71,87,0.3); border-radius: var(--radius-sm); padding: 12px 16px; color: var(--danger); font-size: 13px; margin-bottom: 20px; }

  /* LAYOUT */
  .app-layout { display: flex; min-height: 100vh; }

  .sidebar {
    width: 260px;
    background: var(--surface);
    border-right: 1px solid var(--border);
    display: flex;
    flex-direction: column;
    padding: 32px 20px;
    position: fixed;
    height: 100vh;
    z-index: 10;
  }

  .sidebar-logo {
    font-size: 22px;
    font-weight: 800;
    background: linear-gradient(135deg, var(--accent), var(--accent2));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    padding: 0 12px;
    margin-bottom: 8px;
    letter-spacing: -0.5px;
  }

  .sidebar-tagline { color: var(--muted); font-size: 11px; padding: 0 12px; margin-bottom: 40px; font-family: 'DM Mono', monospace; }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-radius: var(--radius-sm);
    cursor: pointer;
    color: var(--muted);
    font-weight: 600;
    font-size: 14px;
    transition: all 0.15s;
    margin-bottom: 4px;
  }
  .nav-item:hover { background: var(--surface2); color: var(--text); }
  .nav-item.active { background: rgba(123,97,255,0.15); color: var(--accent); border-left: 3px solid var(--accent); }
  .nav-icon { font-size: 18px; width: 24px; text-align: center; }

  .sidebar-user {
    margin-top: auto;
    padding: 16px;
    background: var(--surface2);
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
  }
  .sidebar-user-name { font-weight: 700; font-size: 14px; margin-bottom: 2px; }
  .sidebar-user-email { color: var(--muted); font-size: 11px; font-family: 'DM Mono', monospace; margin-bottom: 12px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

  /* MAIN */
  .main { margin-left: 260px; padding: 40px; flex: 1; }

  .page-header { margin-bottom: 32px; }
  .page-title { font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
  .page-subtitle { color: var(--muted); font-size: 14px; margin-top: 4px; }

  /* CARDS */
  .card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
  }

  /* STATS GRID */
  .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 32px; }

  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    position: relative;
    overflow: hidden;
  }
  .stat-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
  }
  .stat-card.purple::before { background: linear-gradient(90deg, var(--accent), var(--accent2)); }
  .stat-card.teal::before { background: linear-gradient(90deg, var(--accent3), #61D4FF); }
  .stat-card.orange::before { background: linear-gradient(90deg, var(--warn), #FFD700); }
  .stat-card.red::before { background: linear-gradient(90deg, var(--danger), #FF8C94); }

  .stat-label { color: var(--muted); font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 8px; }
  .stat-value { font-size: 26px; font-weight: 800; font-family: 'DM Mono', monospace; letter-spacing: -1px; }
  .stat-icon { position: absolute; top: 24px; right: 24px; font-size: 24px; opacity: 0.6; }

  /* CHARTS */
  .charts-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 32px; }

  .chart-title { font-weight: 700; font-size: 15px; margin-bottom: 20px; }

  /* Category bars */
  .cat-item { margin-bottom: 12px; }
  .cat-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px; }
  .cat-name { font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 6px; }
  .cat-amount { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--muted); }
  .cat-bar-bg { height: 6px; background: var(--surface2); border-radius: 3px; overflow: hidden; }
  .cat-bar { height: 100%; border-radius: 3px; transition: width 0.6s ease; }

  /* Monthly bars */
  .monthly-chart { display: flex; align-items: flex-end; gap: 6px; height: 120px; }
  .month-col { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
  .month-bar-wrap { flex: 1; display: flex; align-items: flex-end; width: 100%; }
  .month-bar { width: 100%; border-radius: 4px 4px 0 0; min-height: 4px; transition: height 0.6s ease; }
  .month-label { font-size: 9px; color: var(--muted); font-family: 'DM Mono', monospace; }

  /* EXPENSE TABLE */
  .toolbar { display: flex; gap: 12px; margin-bottom: 20px; align-items: center; flex-wrap: wrap; }
  .toolbar-search { flex: 1; min-width: 200px; position: relative; }
  .toolbar-search .input { padding-left: 36px; }
  .search-icon { position: absolute; left: 12px; top: 50%; transform: translateY(-50%); color: var(--muted); font-size: 16px; }

  .select {
    background: var(--surface2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: var(--text);
    font-family: 'Syne', sans-serif;
    font-size: 13px;
    outline: none;
    cursor: pointer;
  }
  .select:focus { border-color: var(--accent); }

  .expense-table { width: 100%; border-collapse: collapse; }
  .expense-table th { text-align: left; font-size: 11px; color: var(--muted); letter-spacing: 0.08em; text-transform: uppercase; padding: 0 16px 12px; border-bottom: 1px solid var(--border); font-weight: 600; }
  .expense-table td { padding: 14px 16px; border-bottom: 1px solid rgba(37,37,53,0.5); vertical-align: middle; }
  .expense-table tr:last-child td { border-bottom: none; }
  .expense-table tr:hover td { background: rgba(255,255,255,0.02); }

  .cat-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    border-radius: 20px;
    font-size: 11px;
    font-weight: 700;
  }

  .amount-cell { font-family: 'DM Mono', monospace; font-weight: 500; font-size: 15px; }
  .date-cell { color: var(--muted); font-family: 'DM Mono', monospace; font-size: 12px; }
  .title-cell { font-weight: 600; font-size: 14px; }
  .desc-cell { color: var(--muted); font-size: 12px; margin-top: 2px; }

  .action-btns { display: flex; gap: 6px; }
  .icon-btn {
    width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center;
    border-radius: 6px;
    border: 1px solid var(--border);
    background: transparent;
    color: var(--muted);
    cursor: pointer;
    font-size: 16px;
    transition: all 0.15s;
  }
  .icon-btn:hover { border-color: var(--accent); color: var(--accent); }
  .icon-btn.danger:hover { border-color: var(--danger); color: var(--danger); }

  /* MODAL */
  .modal-overlay {
    position: fixed; inset: 0;
    background: rgba(0,0,0,0.7);
    display: flex; align-items: center; justify-content: center;
    z-index: 100;
    backdrop-filter: blur(4px);
  }
  .modal {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 24px;
    padding: 40px;
    width: 100%;
    max-width: 520px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: var(--shadow);
  }
  .modal-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; }
  .modal-title { font-size: 20px; font-weight: 800; }
  .modal-close { background: none; border: none; color: var(--muted); cursor: pointer; font-size: 24px; line-height: 1; }
  .modal-close:hover { color: var(--text); }

  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .modal .btn { margin-top: 8px; }

  /* EMPTY STATE */
  .empty-state { text-align: center; padding: 64px 32px; color: var(--muted); }
  .empty-icon { font-size: 48px; margin-bottom: 16px; opacity: 0.4; }
  .empty-text { font-size: 16px; font-weight: 600; margin-bottom: 8px; }
  .empty-sub { font-size: 13px; }

  /* LOADING */
  .loading { display: flex; align-items: center; justify-content: center; padding: 40px; }
  .spinner { width: 40px; height: 40px; border: 3px solid var(--border); border-top-color: var(--accent); border-radius: 50%; animation: spin 0.8s linear infinite; }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* TOAST */
  .toast-container { position: fixed; bottom: 24px; right: 24px; z-index: 999; display: flex; flex-direction: column; gap: 8px; }
  .toast {
    padding: 14px 20px;
    border-radius: var(--radius-sm);
    font-size: 13px;
    font-weight: 600;
    animation: slideIn 0.3s ease;
    max-width: 320px;
  }
  .toast.success { background: rgba(46,213,115,0.15); border: 1px solid var(--success); color: var(--success); }
  .toast.error { background: rgba(255,71,87,0.15); border: 1px solid var(--danger); color: var(--danger); }
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: none; opacity: 1; } }

  /* Pagination */
  .pagination { display: flex; align-items: center; justify-content: space-between; margin-top: 20px; }
  .page-info { color: var(--muted); font-size: 13px; font-family: 'DM Mono', monospace; }
  .page-btns { display: flex; gap: 6px; }
  .page-btn { padding: 6px 14px; border-radius: 6px; border: 1px solid var(--border); background: var(--surface2); color: var(--text); font-size: 13px; cursor: pointer; transition: all 0.15s; }
  .page-btn:hover:not(:disabled) { border-color: var(--accent); color: var(--accent); }
  .page-btn:disabled { opacity: 0.4; cursor: not-allowed; }
  .page-btn.active { background: var(--accent); border-color: var(--accent); color: white; }
`;

// ===================== TOAST =====================
let toastId = 0;
function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      {toasts.map(t => <div key={t.id} className={`toast ${t.type}`}>{t.message}</div>)}
    </div>
  );
}

// ===================== AUTH SCREENS =====================
function AuthScreen({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState("");
  const [pendingEmail, setPendingEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      let data;
      if (otpStep) {
        data = await api.verifyOtp({ email: pendingEmail, otp });
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({ id: data.id, name: data.name, email: data.email }));
        onAuth(data);
        setOtpStep(false);
        setOtp("");
        setPendingEmail("");
      } else if (mode === "login") {
        data = await api.login({ email: form.email, password: form.password });
        if (data.otpRequired) {
          setOtpStep(true);
          setPendingEmail(form.email);
          setOtp("");
          return;
        }
      } else {
        data = await api.register(form);
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({ id: data.id, name: data.name, email: data.email }));
        onAuth(data);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <div className="auth-logo">◈ SpendLens</div>
        <div className="auth-subtitle">Your personal finance command center</div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handle}>
          {otpStep && (
            <>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" value={pendingEmail} disabled />
              </div>
              <div className="input-group">
                <label className="input-label">OTP Code</label>
                <input className="input" placeholder="6-digit code" value={otp}
                  onChange={e => setOtp(e.target.value)} required />
              </div>
            </>
          )}
          {!otpStep && mode === "register" && (
            <div className="input-group">
              <label className="input-label">Full Name</label>
              <input className="input" placeholder="John Doe" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})} required />
            </div>
          )}
          {!otpStep && (
            <>
              <div className="input-group">
                <label className="input-label">Email</label>
                <input className="input" type="email" placeholder="you@example.com" value={form.email}
                  onChange={e => setForm({...form, email: e.target.value})} required />
              </div>
              <div className="input-group">
                <label className="input-label">Password</label>
                <input className="input" type="password" placeholder="••••••••" value={form.password}
                  onChange={e => setForm({...form, password: e.target.value})} required />
              </div>
            </>
          )}
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Please wait..." : otpStep ? "Verify OTP" : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>
        {!otpStep && (
          <div className="auth-switch">
            {mode === "login" ? <>Don't have an account? <span onClick={() => setMode("register")}>Sign up</span></> :
              <>Already have an account? <span onClick={() => setMode("login")}>Sign in</span></>}
          </div>
        )}
        {otpStep && (
          <div className="auth-switch">
            <span onClick={() => { setOtpStep(false); setOtp(""); setPendingEmail(""); }}>Back to login</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ===================== DASHBOARD =====================
function Dashboard({ token }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getDashboard(token).then(setStats).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  if (loading) return <div className="loading"><div className="spinner" /></div>;
  if (!stats) return <div className="empty-state"><div className="empty-icon">⚠</div><div className="empty-text">Could not load stats</div></div>;

  const fmt = (n) => `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;
  const catEntries = Object.entries(stats.expensesByCategory || {});
  const maxCat = Math.max(...catEntries.map(([, v]) => Number(v)), 1);
  const monthEntries = Object.entries(stats.monthlyTrend || {});
  const maxMonth = Math.max(...monthEntries.map(([, v]) => Number(v)), 1);

  return (
    <>
      <div className="page-header">
        <div className="page-title">Dashboard</div>
        <div className="page-subtitle">Your financial overview at a glance</div>
      </div>

      <div className="stats-grid">
        {[
          { label: "Total Spent", value: fmt(stats.totalExpenses), icon: icons.wallet, color: "purple" },
          { label: "This Month", value: fmt(stats.monthlyExpenses), icon: icons.trend, color: "teal" },
          { label: "This Week", value: fmt(stats.weeklyExpenses), icon: icons.up, color: "orange" },
          { label: "Transactions", value: stats.totalTransactions, icon: icons.count, color: "red" },
        ].map(s => (
          <div key={s.label} className={`stat-card ${s.color}`}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value mono">{s.value}</div>
            <div className="stat-icon">{s.icon}</div>
          </div>
        ))}
      </div>

      <div className="charts-row">
        <div className="card">
          <div className="chart-title">Spending by Category</div>
          {catEntries.length === 0 ? (
            <div style={{color: "var(--muted)", fontSize: 13}}>No data yet</div>
          ) : catEntries.sort((a,b) => b[1]-a[1]).map(([cat, amt]) => (
            <div key={cat} className="cat-item">
              <div className="cat-header">
                <div className="cat-name">{categoryIcon(cat)} {cat}</div>
                <div className="cat-amount">{fmt(amt)}</div>
              </div>
              <div className="cat-bar-bg">
                <div className="cat-bar" style={{ width: `${(Number(amt)/maxCat)*100}%`, background: categoryColors[cat] || "#888" }} />
              </div>
            </div>
          ))}
        </div>

        <div className="card">
          <div className="chart-title">Monthly Trend ({new Date().getFullYear()})</div>
          {monthEntries.length === 0 ? (
            <div style={{color: "var(--muted)", fontSize: 13}}>No data yet</div>
          ) : (
            <div className="monthly-chart">
              {monthEntries.map(([month, amt]) => {
                const pct = (Number(amt) / maxMonth) * 100;
                return (
                  <div key={month} className="month-col">
                    <div className="month-bar-wrap">
                      <div className="month-bar" style={{ height: `${pct}%`, background: `linear-gradient(180deg, var(--accent), var(--accent2))` }} title={fmt(amt)} />
                    </div>
                    <div className="month-label">{month}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// ===================== EXPENSE MODAL =====================
function ExpenseModal({ expense, onClose, onSave, token }) {
  const [form, setForm] = useState({
    title: expense?.title || "",
    description: expense?.description || "",
    amount: expense?.amount || "",
    category: expense?.category || "OTHER",
    expenseDate: expense?.expenseDate || new Date().toISOString().split("T")[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const categories = ["FOOD","TRANSPORT","HOUSING","ENTERTAINMENT","HEALTHCARE","SHOPPING","EDUCATION","UTILITIES","TRAVEL","OTHER"];

  const submit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      if (expense?.id) {
        await api.updateExpense(expense.id, form, token);
      } else {
        await api.createExpense(form, token);
      }
      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{expense?.id ? "Edit Expense" : "New Expense"}</div>
          <button className="modal-close" onClick={onClose}>{icons.close}</button>
        </div>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={submit}>
          <div className="input-group">
            <label className="input-label">Title</label>
            <input className="input" value={form.title} onChange={e => setForm({...form, title: e.target.value})} placeholder="e.g. Grocery run" required />
          </div>
          <div className="input-group">
            <label className="input-label">Description</label>
            <input className="input" value={form.description} onChange={e => setForm({...form, description: e.target.value})} placeholder="Optional note" />
          </div>
          <div className="form-row">
            <div className="input-group">
              <label className="input-label">Amount (₹)</label>
              <input className="input" type="number" step="0.01" min="0.01" value={form.amount}
                onChange={e => setForm({...form, amount: e.target.value})} placeholder="0.00" required />
            </div>
            <div className="input-group">
              <label className="input-label">Date</label>
              <input className="input" type="date" value={form.expenseDate}
                onChange={e => setForm({...form, expenseDate: e.target.value})} required />
            </div>
          </div>
          <div className="input-group">
            <label className="input-label">Category</label>
            <select className="input select" value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              {categories.map(c => <option key={c} value={c}>{categoryIcon(c)} {c}</option>)}
            </select>
          </div>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Saving..." : expense?.id ? "Update Expense" : "Add Expense"}
          </button>
        </form>
      </div>
    </div>
  );
}

// ===================== EXPENSES PAGE =====================
function ExpensesPage({ token, showToast }) {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("ALL");
  const [page, setPage] = useState(0);
  const PER_PAGE = 8;
  const categories = ["ALL","FOOD","TRANSPORT","HOUSING","ENTERTAINMENT","HEALTHCARE","SHOPPING","EDUCATION","UTILITIES","TRAVEL","OTHER"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getExpenses(token);
      setExpenses(data);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try {
      await api.deleteExpense(id, token);
      showToast("Expense deleted", "success");
      load();
    } catch (e) { showToast(e.message, "error"); }
  };

  const filtered = expenses.filter(e => {
    const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || (e.description||"").toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === "ALL" || e.category === catFilter;
    return matchSearch && matchCat;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice(page * PER_PAGE, (page + 1) * PER_PAGE);

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <div className="page-header" style={{display: "flex", justifyContent: "space-between", alignItems: "flex-start"}}>
        <div>
          <div className="page-title">Expenses</div>
          <div className="page-subtitle">{filtered.length} transactions</div>
        </div>
        <button className="btn btn-primary btn-sm" style={{marginTop: 4}} onClick={() => setModal({})}>
          {icons.add} Add Expense
        </button>
      </div>

      <div className="card">
        <div className="toolbar">
          <div className="toolbar-search">
            <span className="search-icon">{icons.search}</span>
            <input className="input" placeholder="Search expenses..." value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }} />
          </div>
          <select className="select" value={catFilter} onChange={e => { setCatFilter(e.target.value); setPage(0); }}>
            {categories.map(c => <option key={c} value={c}>{c === "ALL" ? "All Categories" : `${categoryIcon(c)} ${c}`}</option>)}
          </select>
        </div>

        {loading ? <div className="loading"><div className="spinner" /></div> :
          paged.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{icons.expenses}</div>
              <div className="empty-text">No expenses found</div>
              <div className="empty-sub">Add your first expense to get started</div>
            </div>
          ) : (
            <table className="expense-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Amount</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(e => (
                  <tr key={e.id}>
                    <td>
                      <div className="title-cell">{e.title}</div>
                      {e.description && <div className="desc-cell">{e.description}</div>}
                    </td>
                    <td>
                      <span className="cat-badge" style={{background: `${categoryColors[e.category]}22`, color: categoryColors[e.category]}}>
                        {categoryIcon(e.category)} {e.category}
                      </span>
                    </td>
                    <td><span className="amount-cell">{fmt(e.amount)}</span></td>
                    <td><span className="date-cell">{e.expenseDate}</span></td>
                    <td>
                      <div className="action-btns">
                        <button className="icon-btn" onClick={() => setModal(e)} title="Edit">{icons.edit}</button>
                        <button className="icon-btn danger" onClick={() => handleDelete(e.id)} title="Delete">{icons.delete}</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

        {totalPages > 1 && (
          <div className="pagination">
            <div className="page-info">Page {page + 1} of {totalPages}</div>
            <div className="page-btns">
              <button className="page-btn" disabled={page === 0} onClick={() => setPage(p => p - 1)}>←</button>
              {Array.from({length: totalPages}, (_, i) => (
                <button key={i} className={`page-btn ${i === page ? "active" : ""}`} onClick={() => setPage(i)}>{i+1}</button>
              ))}
              <button className="page-btn" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>→</button>
            </div>
          </div>
        )}
      </div>

      {modal !== null && (
        <ExpenseModal
          expense={modal}
          token={token}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); showToast(modal?.id ? "Expense updated" : "Expense added", "success"); }}
        />
      )}
    </>
  );
}

// ===================== RECURRING PAGE =====================
function RecurringPage({ token, showToast }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    title: "",
    description: "",
    amount: "",
    category: "FOOD",
    frequency: "MONTHLY",
    startDate: new Date().toISOString().slice(0, 10),
  });
  const categories = ["FOOD","TRANSPORT","HOUSING","ENTERTAINMENT","HEALTHCARE","SHOPPING","EDUCATION","UTILITIES","TRAVEL","OTHER"];

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.getRecurring(token);
      setItems(data);
    } catch (e) { showToast(e.message, "error"); }
    finally { setLoading(false); }
  }, [token]);

  useEffect(() => { load(); }, [load]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.createRecurring({
        ...form,
        amount: Number(form.amount),
      }, token);
      showToast("Recurring expense created", "success");
      setForm({ ...form, title: "", description: "", amount: "" });
      load();
    } catch (e) { showToast(e.message, "error"); }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this recurring expense?")) return;
    try {
      await api.deleteRecurring(id, token);
      showToast("Recurring expense deleted", "success");
      load();
    } catch (e) { showToast(e.message, "error"); }
  };

  const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  return (
    <>
      <div className="page-header">
        <div className="page-title">Recurring Expenses</div>
        <div className="page-subtitle">Automate your monthly and weekly payments</div>
      </div>

      <div className="card" style={{ marginBottom: 18 }}>
        <div className="section-title">Add Recurring Expense</div>
        <form onSubmit={handleCreate}>
          <div className="form-grid">
            <div className="input-group">
              <label className="input-label">Title</label>
              <input className="input" value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Amount</label>
              <input className="input" type="number" step="0.01" value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Category</label>
              <select className="select" value={form.category}
                onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Frequency</label>
              <select className="select" value={form.frequency}
                onChange={e => setForm({ ...form, frequency: e.target.value })}>
                <option value="MONTHLY">Monthly</option>
                <option value="WEEKLY">Weekly</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Start Date</label>
              <input className="input" type="date" value={form.startDate}
                onChange={e => setForm({ ...form, startDate: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Description</label>
              <input className="input" value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })} />
            </div>
          </div>
          <button className="btn btn-primary" type="submit">Create Recurring</button>
        </form>
      </div>

      <div className="card">
        <div className="section-title">Your Recurring Expenses</div>
        {loading ? <div className="loading"><div className="spinner" /></div> :
          items.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">{icons.repeat}</div>
              <div className="empty-text">No recurring expenses</div>
              <div className="empty-sub">Create one to automate bills</div>
            </div>
          ) : (
            <div className="recurring-grid">
              {items.map(r => (
                <div key={r.id} className="recurring-card">
                  <div className="title-cell">{r.title}</div>
                  {r.description && <div className="desc-cell">{r.description}</div>}
                  <div className="amount-cell" style={{ marginTop: 8 }}>{fmt(r.amount)}</div>
                  <div className="recurring-meta">Category: {r.category}</div>
                  <div className="recurring-meta">Frequency: {r.frequency}</div>
                  <div className="recurring-meta">Next run: {r.nextRunDate}</div>
                  <div className="recurring-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(r.id)}>
                      {icons.delete} Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
      </div>
    </>
  );
}

// ===================== APP =====================
export default function App() {
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");
    if (token && user) return { token, ...JSON.parse(user) };
    return null;
  });
  const [page, setPage] = useState("dashboard");
  const [toasts, setToasts] = useState([]);
  const [theme, setTheme] = useState(() => localStorage.getItem("theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const showToast = useCallback((message, type = "success") => {
    const id = ++toastId;
    setToasts(t => [...t, { id, message, type }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setAuth(null);
  };

  if (!auth) return (
    <>
      <style>{styles}</style>
      <AuthScreen onAuth={(data) => setAuth({ token: data.token, name: data.name, email: data.email })} />
      <ToastContainer toasts={toasts} />
    </>
  );

  return (
    <>
      <style>{styles}</style>
      <div className="app-layout">
        <nav className="sidebar">
          <div className="sidebar-logo">◈ SpendLens</div>
          <div className="sidebar-tagline">Personal Finance Tracker</div>
          <button
            className="theme-toggle"
            onClick={() => setTheme(t => (t === "dark" ? "light" : "dark"))}
            title="Toggle theme"
          >
            <span className="mono" style={{ marginRight: 8 }}>
              {theme === "dark" ? icons.sun : icons.moon}
            </span>
            {theme === "dark" ? "Light Mode" : "Dark Mode"}
          </button>
          {[
            { id: "dashboard", label: "Dashboard", icon: icons.dashboard },
            { id: "expenses", label: "Expenses", icon: icons.expenses },
            { id: "recurring", label: "Recurring", icon: icons.repeat },
          ].map(item => (
            <div key={item.id} className={`nav-item ${page === item.id ? "active" : ""}`} onClick={() => setPage(item.id)}>
              <span className="nav-icon">{item.icon}</span> {item.label}
            </div>
          ))}
          <div className="sidebar-user">
            <div className="sidebar-user-name">{auth.name}</div>
            <div className="sidebar-user-email">{auth.email}</div>
            <button className="btn btn-ghost btn-sm" style={{width: "100%"}} onClick={logout}>
              {icons.logout} Sign Out
            </button>
          </div>
        </nav>
        <main className="main">
          {page === "dashboard" && <Dashboard token={auth.token} />}
          {page === "expenses" && <ExpensesPage token={auth.token} showToast={showToast} />}
          {page === "recurring" && <RecurringPage token={auth.token} showToast={showToast} />}
        </main>
      </div>
      <ToastContainer toasts={toasts} />
    </>
  );
}
