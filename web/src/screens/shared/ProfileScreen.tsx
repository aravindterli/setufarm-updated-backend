import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import apiClient from '../../api/client';

export default function ProfileScreen() {
  const { user, setUser } = useAuthStore();
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(''); setSaved(false);
    try {
      const { data } = await apiClient.patch('/users/me', { name, phone });
      setUser(data);
      setSaved(true);
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const roleIcon = user?.role === 'farmer' ? '👨‍🌾' : user?.role === 'buyer' ? '🛒' : '🚚';

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Profile</div>
        <div className="page-subtitle">Manage your account information</div>
      </div>

      <div className="profile-header">
        <div className="profile-avatar">{roleIcon}</div>
        <div>
          <div className="profile-name">{user?.name ?? '—'}</div>
          <div className="profile-role" style={{ textTransform: 'capitalize' }}>
            {user?.role} · {user?.email}
          </div>
          {user?.language && (
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
              Language: {user.language}
            </div>
          )}
        </div>
      </div>

      <div className="card" style={{ maxWidth: 500 }}>
        <div className="card-title" style={{ marginBottom: 20 }}>Edit Profile</div>
        <form onSubmit={handleSave}>
          <div className="form-group">
            <label className="form-label">Full Name</label>
            <input className="form-input" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input className="form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 XXXXX XXXXX" />
          </div>

          {/* Role-specific read-only info */}
          {user?.role === 'farmer' && (
            <>
              <hr className="section-divider" />
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>FARM DETAILS</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Village</label>
                  <input className="form-input" value={user.village ?? ''} readOnly style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">District</label>
                  <input className="form-input" value={user.district ?? ''} readOnly style={{ background: 'var(--bg)' }} />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">State</label>
                  <input className="form-input" value={user.state ?? ''} readOnly style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Farm Size (acres)</label>
                  <input className="form-input" value={user.farm_size_acres ?? ''} readOnly style={{ background: 'var(--bg)' }} />
                </div>
              </div>
            </>
          )}

          {user?.role === 'driver' && (
            <>
              <hr className="section-divider" />
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 12, color: 'var(--text-muted)' }}>VEHICLE DETAILS</div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Vehicle Type</label>
                  <input className="form-input" value={user.vehicle_type ?? ''} readOnly style={{ background: 'var(--bg)' }} />
                </div>
                <div className="form-group">
                  <label className="form-label">Vehicle Number</label>
                  <input className="form-input" value={user.vehicle_number ?? ''} readOnly style={{ background: 'var(--bg)' }} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">License Number</label>
                <input className="form-input" value={user.license_number ?? ''} readOnly style={{ background: 'var(--bg)' }} />
              </div>
            </>
          )}

          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 12 }}>{error}</div>}
          {saved && <div style={{ color: 'var(--success)', fontSize: 13, marginBottom: 12 }}>✓ Profile updated successfully</div>}

          <button className="btn btn-primary btn-full" type="submit" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        </form>
      </div>
    </div>
  );
}
