import { NavLink, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTheme } from '../../hooks/useTheme';
import logo from '../../assets/logo.png';

const navItems = [
  { path: '/driver',          label: 'Dashboard', icon: '📊' },
  { path: '/driver/requests', label: 'Requests',  icon: '🔔' },
  { path: '/driver/profile',  label: 'Profile',   icon: '👤' },
];

export default function DriverLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand" style={{ display: 'flex', flexDirection: 'column', gap: '4px', padding: '16px 20px', borderBottom: '1px solid var(--border-light)' }}>
          <img 
            src={logo} 
            alt="SetuFarm Logo" 
            style={{ 
              height: '36px', 
              width: 'auto', 
              cursor: 'pointer',
              objectFit: 'contain',
              alignSelf: 'flex-start'
            }} 
            onClick={() => navigate('/driver')}
          />
          <div className="sidebar-brand-sub" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-light)', letterSpacing: '0.5px', textTransform: 'uppercase', marginTop: '2px' }}>Driver Portal</div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/driver'}
              className={({ isActive }) =>
                `sidebar-link${isActive ? ' active' : ''}`
              }
            >
              <span className="sidebar-link-icon">{item.icon}</span>
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="flex-between mb-12">
            <div className="sidebar-user" style={{ marginBottom: 0 }}>
              <strong>{user?.name ?? 'Driver'}</strong>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                {user?.vehicle_type?.replace(/_/g, ' ')}
              </span>
            </div>
            <button className="theme-toggle-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
              {theme === 'light' ? '🌙' : '☀️'}
            </button>
          </div>
          <button className="btn btn-ghost btn-sm btn-full" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>
      <main className="main-content">
        <div className="main-inner">{children}</div>
      </main>
    </div>
  );
}
