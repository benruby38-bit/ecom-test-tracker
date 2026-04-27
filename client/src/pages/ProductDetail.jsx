import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtRoas = (n) => `${Number(n || 0).toFixed(2)}x`;

function AddTestModal({ productId, onClose, onAdd }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/tests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const test = await res.json();
      onAdd(test);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-4">Add Test</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Test Name</label>
            <input
              className="input"
              placeholder="e.g. Test 1 - UGC Hook"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Adding…' : 'Add Test'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TestCard({ test, onDelete, onClick }) {
  const profit = Number(test.total_profit || 0);
  const roas = Number(test.roas || 0);
  const isProfitable = profit > 0;
  const hasData = Number(test.log_count) > 0;

  return (
    <div
      onClick={onClick}
      className={`
        cursor-pointer rounded-2xl border-2 p-5 transition-all hover:shadow-md group
        ${hasData
          ? isProfitable
            ? 'border-emerald-200 bg-emerald-50/50 hover:border-emerald-300'
            : 'border-red-200 bg-red-50/50 hover:border-red-300'
          : 'border-slate-200 bg-white hover:border-slate-300'
        }
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {hasData && (
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isProfitable ? 'bg-emerald-500' : 'bg-red-500'}`} />
            )}
            <h3 className="font-bold truncate">{test.name}</h3>
          </div>
          <p className="text-slate-500 text-xs mt-0.5 ml-4">
            {test.log_count} {Number(test.log_count) === 1 ? 'day' : 'days'} logged
          </p>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 btn-danger p-1.5 rounded-lg text-xs transition-opacity"
          onClick={(e) => { e.stopPropagation(); onDelete(test.id); }}
          title="Delete test"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm1 8a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm-4 1a1 1 0 012 0v3a1 1 0 11-2 0v-3zm6 0a1 1 0 012 0v3a1 1 0 11-2 0v-3z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div>
          <p className="stat-label">Spend</p>
          <p className="stat-value text-slate-700">{fmt(test.total_spend)}</p>
        </div>
        <div>
          <p className="stat-label">Revenue</p>
          <p className="stat-value text-slate-700">{fmt(test.total_revenue)}</p>
        </div>
        <div>
          <p className="stat-label">Profit</p>
          <p className={`stat-value ${!hasData ? 'text-slate-400' : isProfitable ? 'text-emerald-700' : 'text-red-600'}`}>
            {fmt(profit)}
          </p>
        </div>
        <div>
          <p className="stat-label">ROAS</p>
          <p className={`stat-value ${!hasData ? 'text-slate-400' : 'text-indigo-600'}`}>
            {fmtRoas(roas)}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ProductDetail() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [tests, setTests] = useState([]);
  const [productName, setProductName] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/products/${productId}/tests`).then((r) => r.json()),
      fetch('/api/products').then((r) => r.json()),
    ]).then(([testsData, productsData]) => {
      setTests(testsData);
      const product = productsData.find((p) => String(p.id) === String(productId));
      if (product) setProductName(product.name);
    }).finally(() => setLoading(false));
  }, [productId]);

  const handleDelete = async (id) => {
    if (!confirm('Delete this test and all its logs?')) return;
    await fetch(`/api/tests/${id}`, { method: 'DELETE' });
    setTests((prev) => prev.filter((t) => t.id !== id));
  };

  const handleAdd = (test) => {
    setTests((prev) => [{ ...test, log_count: 0, total_spend: 0, total_revenue: 0, total_profit: 0, roas: 0 }, ...prev]);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-slate-500 mb-6">
        <Link to="/" className="hover:text-indigo-600 transition-colors">Dashboard</Link>
        <span>/</span>
        <span className="text-slate-800 font-medium">{productName || '…'}</span>
      </div>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{productName || '…'}</h1>
          <p className="text-slate-500 text-sm mt-1">{tests.length} {tests.length === 1 ? 'test' : 'tests'}</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Test
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : tests.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">🧪</p>
          <p className="text-slate-500 font-medium">No tests yet</p>
          <p className="text-slate-400 text-sm mt-1">Create your first test to start tracking</p>
          <button className="btn-primary mt-4" onClick={() => setShowModal(true)}>Add Test</button>
        </div>
      ) : (
        <div className="grid gap-4">
          {tests.map((t) => (
            <TestCard
              key={t.id}
              test={t}
              onDelete={handleDelete}
              onClick={() => navigate(`/tests/${t.id}`)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddTestModal
          productId={productId}
          onClose={() => setShowModal(false)}
          onAdd={handleAdd}
        />
      )}
    </div>
  );
}
