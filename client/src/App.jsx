import { Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import ProductDetail from './pages/ProductDetail';
import TestDetail from './pages/TestDetail';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50">
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/products/:productId" element={<ProductDetail />} />
        <Route path="/tests/:testId" element={<TestDetail />} />
      </Routes>
    </div>
  );
}
