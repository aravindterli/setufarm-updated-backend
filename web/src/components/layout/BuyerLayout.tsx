import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useCartStore } from '../../store/cartStore';
import { useTheme } from '../../hooks/useTheme';
import logo from '../../assets/logo.png';

export default function BuyerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuthStore();
  const { itemCount, searchQuery, setSearchQuery } = useCartStore();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const count = itemCount();

  const [showAccount, setShowAccount] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    setShowAccount(false);
    logout();
    navigate('/');
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAccount(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      <header className="top-header" style={{ padding: '0 24px', height: '80px', borderBottom: '1px solid var(--border-light)' }}>
        {/* Brand & Address */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', flexShrink: 0 }}>
          <img 
            src={logo} 
            alt="SetuFarm Logo" 
            style={{ 
              height: '38px', 
              width: 'auto', 
              cursor: 'pointer',
              objectFit: 'contain'
            }} 
            onClick={() => navigate('/buyer')}
          />
          
          <div 
            onClick={() => navigate('/buyer/addresses')} 
            title="Select Saved Address"
            style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
          >
            <span style={{ color: 'var(--text)', fontWeight: 800, fontSize: '13px' }}>
              Delivery in 8 minutes
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                Home - Madhapur, Hyderabad
              </span>
              <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>▼</span>
            </div>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="header-search-bar" style={{ flex: 1, maxWidth: '600px', margin: '0 32px' }}>
          <span className="header-search-icon" style={{ fontSize: '16px' }}>🔍</span>
          <input
            className="header-search-input"
            placeholder='Search "paneer", "tomatoes" or other fresh crops...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ borderRadius: '10px', height: '46px' }}
          />
        </div>

        {/* Header Actions (Account, Cart, Theme) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexShrink: 0 }}>
          {/* Theme Toggle */}
          <button 
            className="btn btn-ghost" 
            onClick={toggleTheme} 
            title="Toggle Dark/Light Mode"
            style={{ border: '1px solid var(--border-light)', borderRadius: '8px', padding: '10px 12px', boxShadow: 'none' }}
          >
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {/* Account Dropdown */}
          <div className="account-dropdown-wrapper" ref={dropdownRef}>
            <div 
              className="account-dropdown-btn" 
              onClick={() => setShowAccount(!showAccount)}
              style={{ padding: '10px 16px', border: '1px solid var(--border-light)', background: 'transparent', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, fontSize: '14px', borderRadius: '8px' }}
            >
              <span>Account</span>
              <span style={{ fontSize: '10px' }}>{showAccount ? '▲' : '▼'}</span>
            </div>

            {showAccount && (
              <div className="account-dropdown-popup" style={{ border: '1px solid var(--border-light)', borderRadius: '12px', top: '52px', right: 0, width: '320px', padding: '20px', background: 'var(--white)', boxShadow: '0 10px 40px rgba(0,0,0,0.08)' }}>
                <div className="account-popup-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '12px', marginBottom: '12px' }}>
                  <div className="account-popup-title" style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text)' }}>My Account</div>
                  <div className="account-popup-subtitle" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
                    {user?.name || 'Aravind Buyer'}
                  </div>
                </div>

                <ul className="account-popup-menu" style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '2px', padding: 0, margin: 0 }}>
                  <li 
                    className="account-popup-item" 
                    onClick={() => { setShowAccount(false); navigate('/buyer/orders'); }}
                    style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    My Orders
                  </li>
                  <li 
                    className="account-popup-item" 
                    onClick={() => { setShowAccount(false); navigate('/buyer/addresses'); }}
                    style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    Saved Addresses
                  </li>
                  <li 
                    className="account-popup-item" 
                    onClick={() => { setShowAccount(false); navigate('/buyer/profile'); }}
                    style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--text)', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    My Profile
                  </li>
                  <li 
                    className="account-popup-item" 
                    onClick={handleLogout}
                    style={{ padding: '10px 12px', fontSize: '13px', fontWeight: 700, color: 'var(--danger)', cursor: 'pointer', borderRadius: '6px' }}
                  >
                    Log Out
                  </li>
                </ul>

                <div className="qr-box" style={{ display: 'flex', gap: '12px', marginTop: '16px', padding: '12px', background: 'var(--bg)', border: '1px solid var(--border-light)', borderRadius: '8px', alignItems: 'center' }}>
                  <div className="qr-graphic" style={{ width: '64px', height: '64px', background: 'var(--white)', border: '1px solid var(--border-light)', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '2px', padding: '4px', flexShrink: 0, borderRadius: '6px' }}>
                    {[1, 0, 1, 1, 0, 0, 1, 0, 1, 1, 1, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1].map((dot, i) => (
                      <div key={i} style={{ background: dot ? 'var(--text)' : 'transparent', width: '100%', height: '100%', borderRadius: '0px' }} />
                    ))}
                  </div>
                  <div className="qr-desc" style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text)', lineHeight: 1.3 }}>
                    <strong>Simple way to get crops at your doorstep</strong>
                    <div style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                      Scan the QR code and download SetuFarm app
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Cart Button */}
          <button
            className="btn"
            onClick={() => navigate('/buyer/cart')}
            style={{
              background: 'var(--primary)',
              color: 'var(--white)',
              border: '2px solid var(--primary)',
              boxShadow: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              padding: '0 16px',
              fontWeight: 800,
              fontSize: '14px',
              cursor: 'pointer',
              borderRadius: '8px'
            }}
          >
            🛒
            <span style={{ fontWeight: 800 }}>My Cart</span>
            {count > 0 && (
              <span style={{
                background: 'var(--white)',
                color: 'var(--primary)',
                padding: '2px 6px',
                fontSize: '11px',
                fontWeight: 900,
                marginLeft: '4px',
                borderRadius: '6px'
              }}>
                {count}
              </span>
            )}
          </button>
        </div>
      </header>
      
      <div className="layout-body">
        <div className="layout-inner" style={{ paddingBottom: count > 0 ? 100 : 40 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
