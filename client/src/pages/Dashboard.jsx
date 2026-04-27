import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const fmt = (n) => `$${Number(n || 0).toFixed(2)}`;
const fmtRoas = (n) => `${Number(n || 0).toFixed(2)}x`;

function AddProductModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const product = await res.json();
      onAdd(product);
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
        <h2 className="text-lg font-bold mb-4">Add Product</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="label">Product Name</label>
            <input
              className="input"
              placeholder="e.g. Soothbliss"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={loading || !name.trim()}>
              {loading ? 'Adding…' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ProductCard({ product, onDelete, onClick }) {
  const profit = Number(product.total_profit || 0);
  const roas = product.total_spend > 0
    ? Number(product.total_revenue) / Number(product.total_spend)
    : 0;

  return (
    <div
      className="card cursor-pointer hover:shadow-md transition-shadow group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg truncate">{product.name}</h3>
          <p className="text-slate-500 text-sm mt-0.5">
            {product.test_count} {Number(product.test_count) === 1 ? 'test' : 'tests'}
          </p>
        </div>
        <button
          className="opacity-0 group-hover:opacity-100 btn-danger p-1.5 rounded-lg text-xs transition-opacity"
          onClick={(e) => { e.stopPropagation(); onDelete(product.id); }}
          title="Delete product"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zm1 8a1 1 0 00-1 1v3a1 1 0 102 0v-3a1 1 0 00-1-1zm-4 1a1 1 0 012 0v3a1 1 0 11-2 0v-3zm6 0a1 1 0 012 0v3a1 1 0 11-2 0v-3z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {Number(product.test_count) > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 border-t border-slate-100 pt-4">
          <div>
            <p className="stat-label">Spend</p>
            <p className="stat-value text-slate-700">{fmt(product.total_spend)}</p>
          </div>
          <div>
            <p className="stat-label">Revenue</p>
            <p className="stat-value text-slate-700">{fmt(product.total_revenue)}</p>
          </div>
          <div>
            <p className="stat-label">Profit</p>
            <p className={`stat-value ${profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {fmt(profit)}
            </p>
          </div>
          <div>
            <p className="stat-label">ROAS</p>
            <p className="stat-value text-indigo-600">{fmtRoas(roas)}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Dashboard() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then(setProducts)
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (id) => {
    if (!confirm('Delete this product and all its tests?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    setProducts((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Ecom Test Tracker</h1>
          <p className="text-slate-500 text-sm mt-1">Track ad performance across your products</p>
        </div>
        <button className="btn-primary" onClick={() => setShowModal(true)}>
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
          </svg>
          Add Product
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-slate-500 font-medium">No products yet</p>
          <p className="text-slate-400 text-sm mt-1">Add your first product to get started</p>
          <button className="btn-primary mt-4" onClick={() => setShowModal(true)}>Add Product</button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-1">
          {products.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              onDelete={handleDelete}
              onClick={() => navigate(`/products/${p.id}`)}
            />
          ))}
        </div>
      )}

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onAdd={(p) => setProducts((prev) => [p, ...prev])}
        />
      )}
    </div>
  );
}
