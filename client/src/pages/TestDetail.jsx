import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtRoas = (n) => (Number(n || 0) > 0 ? `${Number(n).toFixed(2)}x` : '—');
const today = () => new Date().toISOString().split('T')[0];

function AddLogForm({ testId, onAdd }) {
  const [form, setForm] = useState({ date: today(), ad_spend: '', cogs: '', revenue: '' });
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`/api/tests/${testId}/logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const log = await res.json();
      onAdd(log);
      setForm({ date: today(), ad_spend: '', cogs: '', revenue: '' });
    } finally {
      setLoading(false);
    }
  };

  const profit = (Number(form.revenue) || 0) - (Number(form.ad_spend) || 0) - (Number(form.cogs) || 0);
  const roas = form.ad_spend > 0 ? (Number(form.revenue) || 0) / Number(form.ad_spend) : 0;

  return (
    <div className="card">
      <h3 className="font-semibold text-slate-700 mb-4">Log a Day</h3>
      <form onSubmit={handleSubmit}>
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <label className="label">Date</label>
            <input type="date" className="input" value={form.date} onChange={set('date')} required />
          </div>
          <div>
            <label className="label">Ad Spend ($)</label>
            <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
              value={form.ad_spend} onChange={set('ad_spend')} />
          </div>
          <div>
            <label className="label">COGS ($)</label>
            <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
              value={form.cogs} onChange={set('cogs')} />
          </div>
          <div>
            <label className="label">Revenue ($)</label>
            <input type="number" min="0" step="0.01" className="input" placeholder="0.00"
              value={form.revenue} onChange={set('revenue')} />
          </div>
        </div>

        {(form.ad_spend || form.revenue) && (
          <div className="mt-3 flex gap-4 text-sm">
            <span className="text-slate-500">Preview → </span>
            <span className={profit >= 0 ? 'text-emerald-600 font-semibold' : 'text-red-600 font-semibold'}>
              Profit: {fmt(profit)}
            </span>
            <span className="text-indigo-600 font-semibold">ROAS: {fmtRoas(roas)}</span>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Adding…' : 'Add Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}

function EditableCell({ value, onSave, type = 'number' }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value);
  const inputRef = useRef();

  useEffect(() => { if (editing) inputRef.current?.focus(); }, [editing]);

  const handleBlur = () => {
    setEditing(false);
    if (val !== value) onSave(val);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type={type}
        className="w-full border border-indigo-300 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-400"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={(e) => { if (e.key === 'Enter') inputRef.current.blur(); if (e.key === 'Escape') { setVal(value); setEditing(false); } }}
      />
    );
  }
  return (
    <span
      className="cursor-pointer hover:text-indigo-600 hover:underline transition-colors"
      onClick={() => setEditing(true)}
      title="Click to edit"
    >
      {type === 'number' ? fmt(value) : value}
    </span>
  );
}

function LogRow({ log, onDelete, onUpdate }) {
  const profit = Number(log.revenue) - Number(log.ad_spend) - Number(log.cogs);
  const roas = Number(log.ad_spend) > 0 ? Number(log.revenue) / Number(log.ad_spend) : 0;

  const save = (field) => async (newVal) => {
    const updated = { ...log, [field]: newVal };
    const res = await fetch(`/api/logs/${log.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
    const saved = await res.json();
    onUpdate(saved);
  };

  return (
    <tr className="border-t border-slate-100 hover:bg-slate-50 transition-colors">
      <td className="py-3 px-4 text-sm text-slate-600">
        <EditableCell value={log.date} onSave={save('date')} type="text" />
      </td>
      <td className="py-3 px-4 text-sm text-slate-700">
        <EditableCell value={Number(log.ad_spend)} onSave={save('ad_spend')} />
      </td>
      <td className="py-3 px-4 text-sm text-slate-700">
        <EditableCell value={Number(log.cogs)} onSave={save('cogs')} />
      </td>
      <td className="py-3 px-4 text-sm text-slate-700">
        <EditableCell value={Number(log.revenue)} onSave={save('revenue')} />
      </td>
      <td className={`py-3 px-4 text-sm font-semibold ${profit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
        {fmt(profit)}
      </td>
      <td className="py-3 px-4 text-sm font-semibold text-indigo-600">
        {fmtRoas(roas)}
      </td>
      <td className="py-3 px-4">
        <button
          onClick={() => onDelete(log.id)}
          className="text-slate-300 hover:text-red-500 transition-colors"
          title="Delete entry"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </td>
    </tr>
  );
}

export default function TestDetail() {
  const { testId } = useParams();
  const [test, setTest] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/tests/${testId}/logs`)
      .then((r) => r.json())
      .then(({ test, logs }) => { setTest(test); setLogs(logs); })
      .finally(() => setLoading(false));
  }, [testId]);

  const handleAdd = (log) => {
    setLogs((prev) => [log, ...prev]);
    refreshTotals([log, ...logs]);
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this log entry?')) return;
    await fetch(`/api/logs/${id}`, { method: 'DELETE' });
    const updated = logs.filter((l) => l.id !== id);
    setLogs(updated);
    refreshTotals(updated);
  };

  const handleUpdate = (saved) => {
    const updated = logs.map((l) => (l.id === saved.id ? saved : l));
    setLogs(updated);
    refreshTotals(updated);
  };

  const refreshTotals = (currentLogs) => {
    const totalSpend = currentLogs.reduce((s, l) => s + Number(l.ad_spend), 0);
    const totalCogs = currentLogs.reduce((s, l) => s + Number(l.cogs), 0);
    const totalRevenue = currentLogs.reduce((s, l) => s + Number(l.revenue), 0);
    const totalProfit = totalRevenue - totalSpend - totalCogs;
    const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
    setTest((t) => ({ ...t, total_spend: totalSpend, total_cogs: totalCogs, total_revenue: totalRevenue, total_profit: totalProfit, roas }));
  };

  if (loading) return <div className="text-center py-20 text-slate-400">Loading…</div>;
  if (!test) return <div className="text-center py-20 text-slate-500">Test not found</div>;

  const isProfitable = Number(test.total_profit) > 0;
  const hasLogs = logs.length > 0;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <Link to={`/products/${test.product_id}`} className="hover:text-indigo-600 transition-colors">
          {test.product_name}
        </Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{test.name}</span>
      </div>

      <div className="mb-8">
        <div className="flex items-center gap-3 mb-1">
          {hasLogs && (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${isProfitable ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isProfitable ? 'bg-emerald-500' : 'bg-red-500'}`} />
              {isProfitable ? 'Profitable' : 'Not Profitable'}
            </span>
          )}
          <h1 className="text-2xl font-bold text-slate-900">{test.name}</h1>
        </div>
        <p className="text-slate-500 text-sm">{logs.length} {logs.length === 1 ? 'day' : 'days'} logged</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Spend', value: fmt(test.total_spend), color: 'text-slate-700' },
          { label: 'Total Revenue', value: fmt(test.total_revenue), color: 'text-slate-700' },
          {
            label: 'Total Profit',
            value: fmt(test.total_profit),
            color: !hasLogs ? 'text-slate-400' : isProfitable ? 'text-emerald-600' : 'text-red-600',
          },
          { label: 'Overall ROAS', value: fmtRoas(test.roas), color: 'text-indigo-600' },
        ].map(({ label, value, color }) => (
          <div key={label} className="card text-center">
            <p className="stat-label">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Add log form */}
      <div className="mb-8">
        <AddLogForm testId={testId} onAdd={handleAdd} />
      </div>

      {/* Logs table */}
      {logs.length === 0 ? (
        <div className="text-center py-12 text-slate-400">
          <p className="text-3xl mb-2">📅</p>
          <p>No entries yet — log your first day above</p>
        </div>
      ) : (
        <div className="card p-0 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 rounded-t-2xl">
                {['Date', 'Ad Spend', 'COGS', 'Revenue', 'Profit', 'ROAS', ''].map((h) => (
                  <th key={h} className="py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <LogRow key={log.id} log={log} onDelete={handleDelete} onUpdate={handleUpdate} />
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-200 bg-slate-50">
                <td className="py-3 px-4 text-xs font-bold text-slate-500 uppercase">Totals</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-700">{fmt(test.total_spend)}</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-700">{fmt(test.total_cogs)}</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-700">{fmt(test.total_revenue)}</td>
                <td className={`py-3 px-4 text-sm font-bold ${isProfitable ? 'text-emerald-600' : 'text-red-600'}`}>
                  {fmt(test.total_profit)}
                </td>
                <td className="py-3 px-4 text-sm font-bold text-indigo-600">{fmtRoas(test.roas)}</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
