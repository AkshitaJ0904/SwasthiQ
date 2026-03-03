import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import { PharmacyProvider } from './context/PharmacyContext';

export default function App() {
  return (
    <PharmacyProvider>
      <BrowserRouter>
        <div style={{
          display: 'flex',
          minHeight: '100vh',
          background: '#F1F5F9',
          padding: 16,
          gap: 16,
          fontFamily: "'Inter', -apple-system, sans-serif"
        }}>
          <Sidebar />
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/inventory" element={<Inventory />} />
          </Routes>
        </div>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { fontFamily: 'Inter, sans-serif', fontSize: 13 },
            duration: 3000
          }}
        />
      </BrowserRouter>
    </PharmacyProvider>
  );
}
