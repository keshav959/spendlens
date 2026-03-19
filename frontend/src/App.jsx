import { useState, useEffect, useCallback } from "react";
import { supabase } from "./supabaseClient";

// ─── Supabase helpers ───────────────────────────────────────────────
const currentMonth = () => new Date().toISOString().slice(0, 7);

const getUserLabel = (user) => {
  const name = user?.user_metadata?.name;
  if (name && name.trim()) return name.trim();
  if (user?.email) return user.email.split("@")[0];
  return "user";
};

const normalizeExpense = (row) => ({
  id: row.id,
  description: row.title || "",
  notes: row.description || "",
  amount: Number(row.amount || 0),
  category: row.category,
  date: row.expense_date,
});

const normalizeBudget = (row) => ({
  id: row.id,
  category: row.category,
  monthlyLimit: Number(row.amount || 0),
  month: row.month,
  thresholdPercent: row.threshold_percent,
});

const normalizeRecurring = (row) => ({
  id: row.id,
  description: row.title || row.description || "",
  amount: Number(row.amount || 0),
  category: row.category,
  frequency: row.frequency,
  startDate: row.next_run_date,
  active: row.active,
});

const toISODate = (value) => new Date(value).toISOString().slice(0, 10);

const computeInitialNextRunDate = (startDate, frequency) => {
  const start = new Date(startDate);
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const startDateOnly = new Date(start.getFullYear(), start.getMonth(), start.getDate());

  if (startDateOnly >= todayDate) return toISODate(startDateOnly);

  if (frequency === "WEEKLY") {
    const dayOfWeek = startDateOnly.getDay() === 0 ? 7 : startDateOnly.getDay();
    const todayDow = todayDate.getDay() === 0 ? 7 : todayDate.getDay();
    const delta = dayOfWeek >= todayDow ? dayOfWeek - todayDow : 7 - (todayDow - dayOfWeek);
    const next = new Date(todayDate);
    next.setDate(todayDate.getDate() + delta);
    return toISODate(next);
  }

  const day = startDateOnly.getDate();
  const nextMonth = new Date(todayDate.getFullYear(), todayDate.getMonth() + 1, 1);
  const lastDay = new Date(nextMonth.getFullYear(), nextMonth.getMonth() + 1, 0).getDate();
  nextMonth.setDate(Math.min(day, lastDay));
  return toISODate(nextMonth);
};

const api = {
  async register({ name, email, password }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) throw new Error(error.message);
    if (!data.session) {
      throw new Error("Check your email to confirm your account");
    }
    return data.user;
  },
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return data.user;
  },
  async logout() {
    await supabase.auth.signOut();
  },
  async getExpenses() {
    const { data, error } = await supabase
      .from("expenses")
      .select("*")
      .order("expense_date", { ascending: false });
    if (error) throw new Error(error.message);
    return (data || []).map(normalizeExpense);
  },
  async createExpense(payload) {
    const { data, error } = await supabase
      .from("expenses")
      .insert({
        title: payload.description,
        description: payload.notes || null,
        amount: Number(payload.amount),
        category: payload.category,
        expense_date: payload.date,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeExpense(data);
  },
  async updateExpense(id, payload) {
    const { data, error } = await supabase
      .from("expenses")
      .update({
        title: payload.description,
        description: payload.notes || null,
        amount: Number(payload.amount),
        category: payload.category,
        expense_date: payload.date,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeExpense(data);
  },
  async deleteExpense(id) {
    const { error } = await supabase.from("expenses").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async getBudgets() {
    const month = currentMonth();
    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("month", month)
      .order("category", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(normalizeBudget);
  },
  async createBudget(payload) {
    const month = currentMonth();
    const { data, error } = await supabase
      .from("budgets")
      .insert({
        category: payload.category,
        month,
        amount: Number(payload.monthlyLimit),
        threshold_percent: 80,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeBudget(data);
  },
  async updateBudget(id, payload) {
    const month = currentMonth();
    const { data, error } = await supabase
      .from("budgets")
      .update({
        category: payload.category,
        month,
        amount: Number(payload.monthlyLimit),
        threshold_percent: 80,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeBudget(data);
  },
  async deleteBudget(id) {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
  async getRecurring() {
    const { data, error } = await supabase
      .from("recurring_expenses")
      .select("*")
      .order("next_run_date", { ascending: true });
    if (error) throw new Error(error.message);
    return (data || []).map(normalizeRecurring);
  },
  async createRecurring(payload) {
    const startDate = payload.startDate;
    const frequency = payload.frequency;
    const dayOfWeek = new Date(startDate).getDay();
    const normalizedDow = dayOfWeek === 0 ? 7 : dayOfWeek;
    const { data, error } = await supabase
      .from("recurring_expenses")
      .insert({
        title: payload.description,
        description: null,
        amount: Number(payload.amount),
        category: payload.category,
        frequency,
        day_of_month: frequency === "MONTHLY" ? new Date(startDate).getDate() : null,
        day_of_week: frequency === "WEEKLY" ? normalizedDow : null,
        next_run_date: computeInitialNextRunDate(startDate, frequency),
        active: payload.active ?? true,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeRecurring(data);
  },
  async updateRecurring(id, payload) {
    const startDate = payload.startDate;
    const frequency = payload.frequency;
    const dayOfWeek = new Date(startDate).getDay();
    const normalizedDow = dayOfWeek === 0 ? 7 : dayOfWeek;
    const { data, error } = await supabase
      .from("recurring_expenses")
      .update({
        title: payload.description,
        amount: Number(payload.amount),
        category: payload.category,
        frequency,
        day_of_month: frequency === "MONTHLY" ? new Date(startDate).getDate() : null,
        day_of_week: frequency === "WEEKLY" ? normalizedDow : null,
        next_run_date: computeInitialNextRunDate(startDate, frequency),
        active: payload.active ?? true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return normalizeRecurring(data);
  },
  async deleteRecurring(id) {
    const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
    if (error) throw new Error(error.message);
  },
};

// ─── Icons (inline SVG) ─────────────────────────────────────────────
const Icon = {
  Dashboard: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  Expenses: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  ),
  Budget: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
    </svg>
  ),
  Recurring: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
    </svg>
  ),
  Plus: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Trash: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
      <path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4h6v2"/>
    </svg>
  ),
  Edit: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
    </svg>
  ),
  Logout: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Alert: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

const CATEGORIES = ["Food","Transport","Shopping","Entertainment","Health","Housing","Education","Travel","Utilities","Other"];
const FREQUENCIES = ["WEEKLY","MONTHLY"];
const fmt = (n) => `₹${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

// ─── Toast ───────────────────────────────────────────────────────────
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [toast, onDismiss]);
  if (!toast) return null;
  return (
    <div className={`toast toast--${toast.type}`}>
      {toast.type === "error" && <Icon.Alert />}
      <span>{toast.message}</span>
      <button onClick={onDismiss}><Icon.X /></button>
    </div>
  );
}

// ─── Modal ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    const handler = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="icon-btn" onClick={onClose}><Icon.X /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

// ─── Auth ────────────────────────────────────────────────────────────
function AuthPage({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      if (mode === "login") {
        const user = await api.login({ email: form.email, password: form.password });
        onLogin(user);
      } else {
        await api.register({ name: form.name, email: form.email, password: form.password });
        setMode("login");
        setError("Check your email to confirm your account");
        setForm((f) => ({ ...f, password: "" }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <div className="auth-logo">₹</div>
        <h1>Kharcha</h1>
        <p>Your money, fully in view.</p>
      </div>
      <div className="auth-card">
        <div className="auth-tabs">
          <button className={mode === "login" ? "active" : ""} onClick={() => setMode("login")}>Sign In</button>
          <button className={mode === "register" ? "active" : ""} onClick={() => setMode("register")}>Register</button>
        </div>
        <form onSubmit={handle} className="auth-form">
          {error && <div className="form-error"><Icon.Alert />{error}</div>}
          {mode === "register" && (
            <label>Name
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Your name" required autoFocus />
            </label>
          )}
          <label>Email
            <input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="you@example.com" required autoFocus={mode === "login"} />
          </label>
          <label>Password
            <input type="password" value={form.password} onChange={e => setForm(f => ({...f, password: e.target.value}))} placeholder="••••••••" required />
          </label>
          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : (mode === "login" ? "Sign In" : "Create Account")}
          </button>
        </form>
      </div>
    </div>
  );
}

// ─── Stat Card ───────────────────────────────────────────────────────
function StatCard({ label, value, sub, accent }) {
  return (
    <div className="stat-card" style={{ "--accent": accent }}>
      <span className="stat-label">{label}</span>
      <span className="stat-value">{value}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  );
}

// ─── Category Bar ────────────────────────────────────────────────────
function CategoryBar({ expenses }) {
  const totals = {};
  expenses.forEach(e => { totals[e.category] = (totals[e.category] || 0) + e.amount; });
  const sorted = Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const max = sorted[0]?.[1] || 1;
  const colors = ["#f97316","#3b82f6","#22c55e","#a855f7","#f43f5e","#eab308"];
  return (
    <div className="category-bars">
      {sorted.map(([cat, amt], i) => (
        <div key={cat} className="cat-row">
          <span className="cat-name">{cat}</span>
          <div className="cat-track">
            <div className="cat-fill" style={{ width: `${(amt / max) * 100}%`, background: colors[i % colors.length] }} />
          </div>
          <span className="cat-amt">{fmt(amt)}</span>
        </div>
      ))}
      {sorted.length === 0 && <p className="empty-hint">No expenses yet.</p>}
    </div>
  );
}

// ─── Dashboard ───────────────────────────────────────────────────────
function Dashboard({ expenses, budgets, recurring }) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const now = new Date();
  const thisMonth = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const monthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);
  const budgetTotal = budgets.reduce((s, b) => s + b.monthlyLimit, 0);
  const overBudget = budgets.filter(b => {
    const spent = thisMonth.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
    return spent > b.monthlyLimit;
  });

  const recent = [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);

  return (
    <div className="dashboard">
      <div className="stats-grid">
        <StatCard label="Total Spent" value={fmt(total)} accent="#f97316" />
        <StatCard label="This Month" value={fmt(monthTotal)} sub={`of ${fmt(budgetTotal)} budgeted`} accent="#3b82f6" />
        <StatCard label="Active Budgets" value={budgets.length} sub={overBudget.length > 0 ? `${overBudget.length} over limit` : "All in range"} accent="#22c55e" />
        <StatCard label="Recurring" value={recurring.length} sub="auto-tracked bills" accent="#a855f7" />
      </div>

      {overBudget.length > 0 && (
        <div className="alert-banner">
          <Icon.Alert />
          <span>Over budget in: <strong>{overBudget.map(b => b.category).join(", ")}</strong></span>
        </div>
      )}

      <div className="dash-grid">
        <div className="panel">
          <h3 className="panel-title">Spending by Category</h3>
          <CategoryBar expenses={thisMonth.length ? thisMonth : expenses} />
        </div>
        <div className="panel">
          <h3 className="panel-title">Recent Transactions</h3>
          {recent.length === 0 && <p className="empty-hint">No expenses yet.</p>}
          <div className="recent-list">
            {recent.map(e => (
              <div key={e.id} className="recent-row">
                <div>
                  <span className="recent-desc">{e.description}</span>
                  <span className="recent-cat">{e.category}</span>
                </div>
                <div className="recent-right">
                  <span className="recent-amt">{fmt(e.amount)}</span>
                  <span className="recent-date">{fmtDate(e.date)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Expense Form ────────────────────────────────────────────────────
function ExpenseForm({ initial, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(
    initial ? {
      description: initial.description,
      amount: initial.amount,
      category: initial.category,
      date: (initial.date || today).slice(0, 10),
      notes: initial.notes || "",
    } : { description: "", amount: "", category: "Food", date: today, notes: "" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (initial) await api.updateExpense(initial.id, payload);
      else await api.createExpense(payload);
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handle} className="modal-form">
      {error && <div className="form-error"><Icon.Alert />{error}</div>}
      <div className="form-row">
        <label>Description
          <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Coffee, Groceries..." required />
        </label>
        <label>Amount (₹)
          <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" required />
        </label>
      </div>
      <div className="form-row">
        <label>Category
          <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Date
          <input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} required />
        </label>
      </div>
      <label>Notes
        <input value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} placeholder="Optional notes..." />
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : (initial ? "Update" : "Add Expense")}
        </button>
      </div>
    </form>
  );
}

// ─── Expenses Page ───────────────────────────────────────────────────
function ExpensesPage({ expenses, onRefresh, showToast }) {
  const [modal, setModal] = useState(null); // null | "add" | expense obj
  const [filter, setFilter] = useState({ category: "", search: "", month: "" });

  const filtered = expenses.filter(e => {
    const matchCat = !filter.category || e.category === filter.category;
    const matchSearch = !filter.search || e.description.toLowerCase().includes(filter.search.toLowerCase());
    const matchMonth = !filter.month || (e.date || "").startsWith(filter.month);
    return matchCat && matchSearch && matchMonth;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));

  const del = async (id) => {
    if (!confirm("Delete this expense?")) return;
    try { await api.deleteExpense(id); onRefresh(); showToast("Expense deleted", "success"); }
    catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Expenses</h2>
        <button className="btn btn-primary" onClick={() => setModal("add")}><Icon.Plus /> Add Expense</button>
      </div>
      <div className="filters">
        <input placeholder="Search..." value={filter.search} onChange={e => setFilter(f => ({...f, search: e.target.value}))} className="filter-input" />
        <select value={filter.category} onChange={e => setFilter(f => ({...f, category: e.target.value}))} className="filter-select">
          <option value="">All Categories</option>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
        <input type="month" value={filter.month} onChange={e => setFilter(f => ({...f, month: e.target.value}))} className="filter-input" />
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Description</th><th>Category</th><th>Date</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {filtered.length === 0 && <tr><td colSpan="5" className="empty-cell">No expenses found.</td></tr>}
            {filtered.map(e => (
              <tr key={e.id}>
                <td><span className="td-main">{e.description}</span>{e.notes && <span className="td-sub">{e.notes}</span>}</td>
                <td><span className="chip">{e.category}</span></td>
                <td>{fmtDate(e.date)}</td>
                <td className="td-amount">{fmt(e.amount)}</td>
                <td className="td-actions">
                  <button className="icon-btn" onClick={() => setModal(e)} title="Edit"><Icon.Edit /></button>
                  <button className="icon-btn icon-btn--danger" onClick={() => del(e.id)} title="Delete"><Icon.Trash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Add Expense" : "Edit Expense"} onClose={() => setModal(null)}>
          <ExpenseForm initial={modal === "add" ? null : modal} onSave={() => { onRefresh(); setModal(null); showToast("Saved!", "success"); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── Budget Form ─────────────────────────────────────────────────────
function BudgetForm({ initial, onSave, onClose }) {
  const [form, setForm] = useState(
    initial ? { category: initial.category, monthlyLimit: initial.monthlyLimit }
             : { category: "Food", monthlyLimit: "" }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = { ...form, monthlyLimit: parseFloat(form.monthlyLimit) };
      if (initial) await api.updateBudget(initial.id, payload);
      else await api.createBudget(payload);
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handle} className="modal-form">
      {error && <div className="form-error"><Icon.Alert />{error}</div>}
      <label>Category
        <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
          {CATEGORIES.map(c => <option key={c}>{c}</option>)}
        </select>
      </label>
      <label>Monthly Limit (₹)
        <input type="number" step="0.01" min="0" value={form.monthlyLimit} onChange={e => setForm(f => ({...f, monthlyLimit: e.target.value}))} placeholder="5000.00" required />
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : (initial ? "Update" : "Set Budget")}
        </button>
      </div>
    </form>
  );
}

// ─── Budget Page ─────────────────────────────────────────────────────
function BudgetPage({ budgets, expenses, onRefresh, showToast }) {
  const [modal, setModal] = useState(null);
  const now = new Date();
  const thisMonthExp = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });

  const del = async (id) => {
    if (!confirm("Remove this budget?")) return;
    try { await api.deleteBudget(id); onRefresh(); showToast("Budget removed", "success"); }
    catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Budgets</h2>
        <button className="btn btn-primary" onClick={() => setModal("add")}><Icon.Plus /> Set Budget</button>
      </div>
      <div className="budget-grid">
        {budgets.length === 0 && <p className="empty-hint">No budgets set yet.</p>}
        {budgets.map(b => {
          const spent = thisMonthExp.filter(e => e.category === b.category).reduce((s, e) => s + e.amount, 0);
          const pct = Math.min((spent / b.monthlyLimit) * 100, 100);
          const over = spent > b.monthlyLimit;
          return (
            <div key={b.id} className={`budget-card ${over ? "budget-card--over" : ""}`}>
              <div className="budget-card-top">
                <div>
                  <span className="budget-cat">{b.category}</span>
                  <span className="budget-limit">Limit: {fmt(b.monthlyLimit)}</span>
                </div>
                <div className="td-actions">
                  <button className="icon-btn" onClick={() => setModal(b)}><Icon.Edit /></button>
                  <button className="icon-btn icon-btn--danger" onClick={() => del(b.id)}><Icon.Trash /></button>
                </div>
              </div>
              <div className="progress-track">
                <div className="progress-fill" style={{ width: `${pct}%`, background: over ? "#f43f5e" : "#22c55e" }} />
              </div>
              <div className="budget-meta">
                <span>Spent: {fmt(spent)}</span>
                <span className={over ? "over-label" : ""}>{over ? `Over by ${fmt(spent - b.monthlyLimit)}` : `Remaining: ${fmt(b.monthlyLimit - spent)}`}</span>
              </div>
            </div>
          );
        })}
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Set Budget" : "Edit Budget"} onClose={() => setModal(null)}>
          <BudgetForm initial={modal === "add" ? null : modal} onSave={() => { onRefresh(); setModal(null); showToast("Budget saved!", "success"); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── Recurring Form ──────────────────────────────────────────────────
function RecurringForm({ initial, onSave, onClose }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState(
    initial ? { description: initial.description, amount: initial.amount, category: initial.category, frequency: initial.frequency, startDate: (initial.startDate || today).slice(0, 10), active: initial.active ?? true }
            : { description: "", amount: "", category: "Utilities", frequency: "MONTHLY", startDate: today, active: true }
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async (e) => {
    e.preventDefault();
    setLoading(true); setError("");
    try {
      const payload = { ...form, amount: parseFloat(form.amount) };
      if (initial) await api.updateRecurring(initial.id, payload);
      else await api.createRecurring(payload);
      onSave();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <form onSubmit={handle} className="modal-form">
      {error && <div className="form-error"><Icon.Alert />{error}</div>}
      <div className="form-row">
        <label>Description
          <input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="Netflix, Rent..." required />
        </label>
        <label>Amount (₹)
          <input type="number" step="0.01" min="0" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" required />
        </label>
      </div>
      <div className="form-row">
        <label>Category
          <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>
        </label>
        <label>Frequency
          <select value={form.frequency} onChange={e => setForm(f => ({...f, frequency: e.target.value}))}>
            {FREQUENCIES.map(fr => <option key={fr}>{fr}</option>)}
          </select>
        </label>
      </div>
      <label>Start Date
        <input type="date" value={form.startDate} onChange={e => setForm(f => ({...f, startDate: e.target.value}))} required />
      </label>
      <label className="checkbox-label">
        <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} />
        Active
      </label>
      <div className="modal-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : (initial ? "Update" : "Add Recurring")}
        </button>
      </div>
    </form>
  );
}

// ─── Recurring Page ──────────────────────────────────────────────────
function RecurringPage({ recurring, onRefresh, showToast }) {
  const [modal, setModal] = useState(null);

  const del = async (id) => {
    if (!confirm("Delete this recurring expense?")) return;
    try { await api.deleteRecurring(id); onRefresh(); showToast("Deleted", "success"); }
    catch (e) { showToast(e.message, "error"); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>Recurring Expenses</h2>
        <button className="btn btn-primary" onClick={() => setModal("add")}><Icon.Plus /> Add Recurring</button>
      </div>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Description</th><th>Category</th><th>Frequency</th><th>Start Date</th><th>Status</th><th>Amount</th><th></th></tr></thead>
          <tbody>
            {recurring.length === 0 && <tr><td colSpan="7" className="empty-cell">No recurring expenses set up.</td></tr>}
            {recurring.map(r => (
              <tr key={r.id} className={!r.active ? "row-inactive" : ""}>
                <td className="td-main">{r.description}</td>
                <td><span className="chip">{r.category}</span></td>
                <td><span className="freq-badge">{r.frequency}</span></td>
                <td>{fmtDate(r.startDate)}</td>
                <td><span className={`status-dot ${r.active ? "status-dot--on" : "status-dot--off"}`}>{r.active ? "Active" : "Paused"}</span></td>
                <td className="td-amount">{fmt(r.amount)}</td>
                <td className="td-actions">
                  <button className="icon-btn" onClick={() => setModal(r)}><Icon.Edit /></button>
                  <button className="icon-btn icon-btn--danger" onClick={() => del(r.id)}><Icon.Trash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal === "add" ? "Add Recurring Expense" : "Edit Recurring"} onClose={() => setModal(null)}>
          <RecurringForm initial={modal === "add" ? null : modal} onSave={() => { onRefresh(); setModal(null); showToast("Saved!", "success"); }} onClose={() => setModal(null)} />
        </Modal>
      )}
    </div>
  );
}

// ─── App Shell ───────────────────────────────────────────────────────
export default function App() {
  const [user, setUser] = useState(null);
  const [tab, setTab] = useState("dashboard");
  const [data, setData] = useState({ expenses: [], budgets: [], recurring: [] });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  const showToast = useCallback((message, type = "success") => setToast({ message, type }), []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setUser(data?.session?.user || null);
      setAuthLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => {
      mounted = false;
      listener?.subscription?.unsubscribe();
    };
  }, []);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [expenses, budgets, recurring] = await Promise.all([
        api.getExpenses(),
        api.getBudgets(),
        api.getRecurring(),
      ]);
      setData({ expenses: expenses || [], budgets: budgets || [], recurring: recurring || [] });
    } catch (e) {
      showToast(e.message, "error");
    } finally { setLoading(false); }
  }, [user, showToast]);

  useEffect(() => { load(); }, [load]);

  const logout = async () => {
    await api.logout();
    setUser(null); setData({ expenses: [], budgets: [], recurring: [] });
  };

  if (authLoading) return <div className="loading"><span className="spinner" /></div>;
  if (!user) return <AuthPage onLogin={(u) => { setUser(u); }} />;

  const navItems = [
    { id: "dashboard", label: "Dashboard", icon: <Icon.Dashboard /> },
    { id: "expenses", label: "Expenses", icon: <Icon.Expenses /> },
    { id: "budgets", label: "Budgets", icon: <Icon.Budget /> },
    { id: "recurring", label: "Recurring", icon: <Icon.Recurring /> },
  ];

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="brand-symbol">₹</span>
          <span className="brand-name">Kharcha</span>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n => (
            <button key={n.id} className={`nav-item ${tab === n.id ? "active" : ""}`} onClick={() => setTab(n.id)}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">@{getUserLabel(user)}</span>
          <button className="icon-btn" onClick={logout} title="Logout"><Icon.Logout /></button>
        </div>
      </aside>

      <main className="main">
        <div className="topbar">
          <h1 className="topbar-title">
            {navItems.find(n => n.id === tab)?.label}
          </h1>
          {loading && <span className="spinner spinner--sm" />}
        </div>
        <div className="content">
          {tab === "dashboard" && <Dashboard expenses={data.expenses} budgets={data.budgets} recurring={data.recurring} />}
          {tab === "expenses" && <ExpensesPage expenses={data.expenses} onRefresh={load} showToast={showToast} />}
          {tab === "budgets" && <BudgetPage budgets={data.budgets} expenses={data.expenses} onRefresh={load} showToast={showToast} />}
          {tab === "recurring" && <RecurringPage recurring={data.recurring} onRefresh={load} showToast={showToast} />}
        </div>
      </main>

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
