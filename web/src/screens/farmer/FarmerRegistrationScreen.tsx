import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import logo from '../../assets/logo.png';

export default function FarmerRegistrationScreen() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: '', phone: '', language: 'telugu', aadhar_number: '',
    village: '', district: '', state: '', farm_size_acres: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.village || !form.district || !form.state) {
      setError('Please fill all required fields.'); return;
    }
    setSaving(true); setError('');
    try {
      const { data } = await apiClient.post('/users/register/farmer', {
        ...form,
        farm_size_acres: parseFloat(form.farm_size_acres) || 0,
      });
      setUser(data);
      navigate('/farmer', { replace: true });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Registration failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="auth-page" style={{ alignItems: 'flex-start', paddingTop: 48 }}>
      <div style={{ width: '100%', maxWidth: 580 }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, cursor: 'pointer' }} onClick={() => navigate('/')}>
          <img src={logo} alt="SetuFarm Logo" style={{ height: '48px', width: 'auto', objectFit: 'contain' }} />
        </div>
        <div className="auth-title">Farmer Enrollment</div>
        <div className="auth-sub" style={{ marginBottom: 24 }}>
          Establish your farm business profile to begin listing seasonal crops directly on our marketplace.
        </div>
        
        <div className="card" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--primary)', marginBottom: 16, textTransform: 'uppercase' }}>
              👤 Profile Details
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Raghava Naidu" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. +91 94401 23456" required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Preferred Language</label>
                <select className="form-select" value={form.language} onChange={(e) => set('language', e.target.value)}>
                  <option value="telugu">Telugu (తెలుగు)</option>
                  <option value="hindi">Hindi (हिन्दी)</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Aadhaar Number (Optional)</label>
                <input className="form-input" value={form.aadhar_number} onChange={(e) => set('aadhar_number', e.target.value)} placeholder="XXXX XXXX XXXX" maxLength={14} />
              </div>
            </div>

            <hr className="section-divider" style={{ margin: '24px 0' }} />
            
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--warning)', marginBottom: 16, textTransform: 'uppercase' }}>
              🌾 Farm Holdings & Location
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Village *</label>
                <input className="form-input" value={form.village} onChange={(e) => set('village', e.target.value)} placeholder="e.g. Setupalle" required />
              </div>
              <div className="form-group">
                <label className="form-label">District *</label>
                <input className="form-input" value={form.district} onChange={(e) => set('district', e.target.value)} placeholder="e.g. Chittoor" required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State *</label>
                <input className="form-input" value={form.state} onChange={(e) => set('state', e.target.value)} placeholder="e.g. Andhra Pradesh" required />
              </div>
              <div className="form-group">
                <label className="form-label">Total Land Holding (Acres)</label>
                <input className="form-input" type="number" step="0.1" value={form.farm_size_acres} onChange={(e) => set('farm_size_acres', e.target.value)} placeholder="e.g. 3.5" />
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
