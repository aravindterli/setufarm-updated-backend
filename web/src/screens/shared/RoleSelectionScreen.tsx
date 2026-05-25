import { useNavigate } from 'react-router-dom';
import type { Role } from '../../types';
import logo from '../../assets/logo.png';

const roles: { role: Role; icon: string; title: string; desc: string; badge: string; badgeClass: string }[] = [
  {
    role: 'farmer',
    icon: '👨‍🌾',
    title: 'Farmer',
    desc: 'List your crops, manage orders, and grow your business.',
    badge: 'SELL',
    badgeClass: 'badge-sell',
  },
  {
    role: 'buyer',
    icon: '🛒',
    title: 'Buyer',
    desc: 'Browse fresh produce, order directly from farms, and save.',
    badge: 'BUY',
    badgeClass: 'badge-buy',
  },
  {
    role: 'driver',
    icon: '🚚',
    title: 'GramFleet Driver',
    desc: 'Deliver fresh produce from farms to buyers and earn money.',
    badge: 'EARN',
    badgeClass: 'badge-earn',
  },
];

export default function RoleSelectionScreen() {
  const navigate = useNavigate();

  return (
    <div className="auth-page" style={{ background: 'var(--bg)' }}>
      <div style={{ width: '100%', maxWidth: 500 }}>
        <div style={{ marginBottom: 28, textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>
            <img src={logo} alt="SetuFarm Logo" style={{ height: '56px', width: 'auto', objectFit: 'contain' }} />
          </div>
          <div className="auth-title" style={{ fontSize: 26, marginBottom: 6 }}>Enrollment Category</div>
          <div className="auth-sub" style={{ fontSize: 13, fontWeight: 600 }}>
            Select how you would like to participate in the marketplace.
          </div>
        </div>
        
        <div className="role-cards">
          {roles.map((r) => (
            <div
              key={r.role}
              className="role-card"
              onClick={() => navigate('/login', { state: { mode: 'signup', role: r.role } })}
              style={{ borderLeftWidth: 6, borderLeftColor: r.role === 'farmer' ? 'var(--primary)' : r.role === 'buyer' ? 'var(--info)' : 'var(--warning)' }}
            >
              <div className="role-card-icon" style={{ fontSize: 36 }}>{r.icon}</div>
              <div className="role-card-text">
                <div className="role-card-title" style={{ fontSize: 16 }}>{r.title}</div>
                <div className="role-card-desc" style={{ fontSize: 12, fontWeight: 500 }}>{r.desc}</div>
              </div>
              <span className={`role-card-badge ${r.badgeClass}`} style={{ fontSize: 10 }}>{r.badge}</span>
            </div>
          ))}
        </div>
        
        <div style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
          Already registered?{' '}
          <span
            style={{ color: 'var(--primary)', fontWeight: 800, cursor: 'pointer', textDecoration: 'underline' }}
            onClick={() => navigate('/login')}
          >
            Sign In Account
          </span>
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/')}>
            ← Return to Landing Page
          </button>
        </div>
      </div>
    </div>
  );
}
