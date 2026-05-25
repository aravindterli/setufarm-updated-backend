import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import logo from '../../assets/logo.png';

export default function BuyerRegistrationScreen() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: '', phone: '', language: 'english',
    village: '', district: '', state: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.district || !form.state) {
      setError('Please fill all required fields.'); return;
    }
    setSaving(true); setError('');
    try {
      const { data } = await apiClient.post('/users/register/buyer', form);
      setUser(data);
      navigate('/buyer', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Registration failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 48 }}>
      <div style={{ width: '100%', maxWidth: 540 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={logo} alt="SetuFarm Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <div className="auth-title">Buyer Enrollment</div>
        <div className="auth-sub" style={{ marginBottom: 24 }}>
          Establish your buyer profile to browse nearby seasonal crops and order fresh agricultural harvest directly from local farms.
        </div>
        
        <div className="card" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--primary)', marginBottom: 16, textTransform: 'uppercase' }}>
              👤 Profile Details
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Anand Kumar" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. +91 91234 56789" required />
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Preferred Interface Language</label>
              <select className="form-select" value={form.language} onChange={(e) => set('language', e.target.value)}>
                <option value="english">English</option>
                <option value="telugu">Telugu (తెలుగు)</option>
                <option value="hindi">Hindi (हिन्दी)</option>
              </select>
            </div>

            <hr className="section-divider" style={{ margin: '24px 0' }} />
            
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--info)', marginBottom: 16, textTransform: 'uppercase' }}>
              📍 Standard Delivery Coordinates
            </div>

            <div className="form-group">
              <label className="form-label">Village / Area Location</label>
              <input className="form-input" value={form.village} onChange={(e) => set('village', e.target.value)} placeholder="e.g. Shanti Nagar or Madanapalle" />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">District *</label>
                <input className="form-input" value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="e.g. Chittoor" required />
              </div>
              <div className="form-group">
                <label className="form-label">State *</label>
                <input className="form-input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Andhra Pradesh" required />
              </div>
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 700, margin: '12px 0', padding: 10, background: 'var(--danger-bg)', border: '2px solid var(--border)' }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Creating Profile...' : 'Complete Profile Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
