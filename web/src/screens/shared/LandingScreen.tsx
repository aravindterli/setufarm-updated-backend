import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useEffect } from 'react';

export default function LandingScreen() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user) {
      if (user.role === 'farmer') navigate('/farmer');
      else if (user.role === 'buyer') navigate('/buyer');
      else if (user.role === 'driver') navigate('/driver');
    }
  }, [user, navigate]);

  return (
    <div className="landing">
      <section className="landing-hero" style={{ padding: '80px 24px', borderBottom: '4px solid var(--border)' }}>
        <h1 style={{ fontSize: 'min(48px, 9vw)', lineHeight: 1.15, marginBottom: 20 }}>
          Farm to Table.<br />Direct. Fresh. Fair.
        </h1>
        <p style={{ fontSize: 16, maxWidth: 640, margin: '0 auto 36px', color: 'var(--text)', fontWeight: 600 }}>
          SetuFarm connects rural farmers directly with buyers and local delivery partners —
          bypassing commission agents, maximizing harvest value, and enabling instant payouts.
        </p>
        <div className="landing-hero-actions">
          <button
            className="btn btn-lg btn-primary"
            onClick={() => navigate('/role-selection')}
          >
            Get Started 🌾
          </button>
          <button
            className="btn btn-lg btn-secondary"
            onClick={() => navigate('/login')}
          >
            Sign In Account
          </button>
        </div>
      </section>

      <section className="landing-section" style={{ padding: '60px 20px' }}>
        <h2 style={{ fontSize: 24, marginBottom: 32 }}>Who uses SetuFarm?</h2>
        <div className="role-cards" style={{ maxWidth: 800, margin: '0 auto' }}>
          <div className="role-card" onClick={() => navigate('/role-selection')} style={{ borderLeftWidth: 6, borderLeftColor: 'var(--primary)' }}>
            <div className="role-card-icon" style={{ fontSize: 32 }}>👨‍🌾</div>
            <div className="role-card-text">
              <div className="role-card-title">Local Farmers</div>
              <div className="role-card-desc" style={{ fontWeight: 500 }}>
                List your harvested crops, accept direct bookings, coordinate transport with drivers, and receive instant digital settlements.
              </div>
            </div>
            <span className="role-card-badge badge-sell">SELL HARVEST</span>
          </div>
          
          <div className="role-card" onClick={() => navigate('/role-selection')} style={{ borderLeftWidth: 6, borderLeftColor: 'var(--info)' }}>
            <div className="role-card-icon" style={{ fontSize: 32 }}>🛒</div>
            <div className="role-card-text">
              <div className="role-card-title">Wholesale & Retail Buyers</div>
              <div className="role-card-desc" style={{ fontWeight: 500 }}>
                Browse verified local farm listings, secure cold-chain delivery contracts, and purchase fresh produce directly from origin.
              </div>
            </div>
            <span className="role-card-badge badge-buy">SECURE SUPPLY</span>
          </div>
          
          <div className="role-card" onClick={() => navigate('/role-selection')} style={{ borderLeftWidth: 6, borderLeftColor: 'var(--warning)' }}>
            <div className="role-card-icon" style={{ fontSize: 32 }}>🚚</div>
            <div className="role-card-text">
              <div className="role-card-title">GramFleet Drivers</div>
              <div className="role-card-desc" style={{ fontWeight: 500 }}>
                Deliver fresh produce from farm gates directly to buyer drop-offs. Earn transparent fees per transport contract.
              </div>
            </div>
            <span className="role-card-badge badge-earn">EARN WEEKLY</span>
          </div>
        </div>
      </section>

      <section style={{ borderTop: '4px solid var(--border)', background: 'var(--primary-light)', padding: '56px 20px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, marginBottom: 10, fontSize: 24, textTransform: 'uppercase' }}>
          Ready to trade directly?
        </h2>
        <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 24, fontWeight: 600 }}>
          Join thousands of Indian farmers, wholesale buyers, and logistics partners on SetuFarm.
        </p>
        <button
          className="btn btn-lg btn-primary"
          onClick={() => navigate('/role-selection')}
        >
          Join SetuFarm Platform
        </button>
      </section>
    </div>
  );
}
