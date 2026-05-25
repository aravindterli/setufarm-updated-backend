import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';
import logo from '../../assets/logo.png';

export default function DriverRegistrationScreen() {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [form, setForm] = useState({
    name: '', phone: '', language: 'telugu', aadhar_number: '',
    vehicle_type: 'two_wheeler', vehicle_number: '', license_number: '', upi_id: '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (field: string, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone || !form.vehicle_number || !form.license_number) {
      setError('Please fill all required fields.'); return;
    }
    setSaving(true); setError('');
    try {
      const { data } = await apiClient.post('/users/register/driver', form);
      setUser(data);
      navigate('/driver', { replace: true });
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
        <div className="auth-title">Driver Enrollment</div>
        <div className="auth-sub" style={{ marginBottom: 24 }}>
          Complete your GramFleet registration details to begin accepting rural dispatch invitations.
        </div>
        
        <div className="card" style={{ padding: '32px 28px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--primary)', marginBottom: 16, textTransform: 'uppercase' }}>
              👤 Personal Details
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input className="form-input" value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Ramesh Naidu" required />
              </div>
              <div className="form-group">
                <label className="form-label">Phone Number *</label>
                <input className="form-input" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="e.g. +91 98765 43210" required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Communication Language</label>
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
            
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: '1px', color: 'var(--info)', marginBottom: 16, textTransform: 'uppercase' }}>
              🚚 Logistics & Vehicle Details
            </div>

            <div className="form-group">
              <label className="form-label">Vehicle Category *</label>
              <select className="form-select" value={form.vehicle_type} onChange={(e) => set('vehicle_type', e.target.value)}>
                <option value="two_wheeler">Two Wheeler (Motorcycle/Scooter)</option>
                <option value="three_wheeler">Three Wheeler (Auto-Rickshaw)</option>
                <option value="mini_truck">Mini Truck (Tata Ace/Bolero)</option>
                <option value="truck">Heavy Commercial Truck</option>
              </select>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Vehicle Registration No. *</label>
                <input className="form-input" value={form.vehicle_number} onChange={(e) => set('vehicle_number', e.target.value)} placeholder="e.g. AP 01 AB 1234" required />
              </div>
              <div className="form-group">
                <label className="form-label">Driving License No. *</label>
                <input className="form-input" value={form.license_number} onChange={(e) => set('license_number', e.target.value)} placeholder="e.g. DL1420110012345" required />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">UPI ID for Payout Settlements</label>
              <input className="form-input" value={form.upi_id} onChange={(e) => set('upi_id', e.target.value)} placeholder="e.g. drivername@okaxis" />
              <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 500, marginTop: 4 }}>
                Direct bank transfers are settled instantly to this address.
              </span>
            </div>

            {error && (
              <div style={{ color: 'var(--danger)', fontSize: 13, fontWeight: 700, margin: '12px 0', padding: 10, background: 'var(--danger-bg)', border: '2px solid var(--border)' }}>
                ⚠️ {error}
              </div>
            )}

            <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={saving} style={{ marginTop: 12 }}>
              {saving ? 'Registering...' : 'Complete Account Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
