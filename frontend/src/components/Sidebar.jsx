import { Search, LayoutDashboard, Menu, Activity, Calendar, Users, Stethoscope, Paperclip, Plus, Sparkles, Settings } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { icon: Search, path: null },
  { icon: LayoutDashboard, path: '/' },
  { icon: Menu, path: null },
  { icon: Activity, path: null },
  { icon: Calendar, path: null },
  { icon: Users, path: null },
  { icon: Stethoscope, path: null },
  { icon: Paperclip, path: '/inventory' },
  { icon: Plus, path: null },
  { icon: Sparkles, path: null },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div style={{
      width: 60,
      minHeight: '100vh',
      background: 'white',
      borderRadius: 16,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '20px 0',
      gap: 6,
      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      flexShrink: 0
    }}>
      {navItems.map(({ icon: Icon, path }, idx) => {
        const isActive = path && location.pathname === path;
        return (
          <button
            key={idx}
            onClick={() => path && navigate(path)}
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              border: 'none',
              background: isActive ? '#EEF2FF' : 'transparent',
              color: isActive ? '#4F46E5' : '#9CA3AF',
              cursor: path ? 'pointer' : 'default',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease'
            }}
          >
            <Icon size={18} />
          </button>
        );
      })}

      <div style={{ flex: 1 }} />

      <button style={{
        width: 40, height: 40, borderRadius: 10, border: 'none',
        background: 'transparent', color: '#9CA3AF', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Settings size={18} />
      </button>
    </div>
  );
}
