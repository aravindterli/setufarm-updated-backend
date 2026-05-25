import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { Address } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const BLANK = { label: 'Home', address_line: '', village: '', district: '', state: '', pincode: '', lat: '', lng: '', is_default: false };

export default function AddressesScreen() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK });

  const { data: addresses = [], isLoading } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/addresses/').then((r) => r.data),
  });

  const set = (field: string, val: any) => setForm((p) => ({ ...p, [field]: val }));

  const saveMutation = useMutation({
    mutationFn: (data: any) =>
      editId
        ? apiClient.put(`/addresses/${editId}`, data)
        : apiClient.post('/addresses/', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['addresses'] });
      setShowForm(false);
      setEditId(null);
      setForm({ ...BLANK });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiClient.delete(`/addresses/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['addresses'] }),
  });

  const handleEdit = (addr: Address) => {
    setEditId(addr.id);
    setForm({
      label: addr.label, address_line: addr.address_line, village: addr.village,
      district: addr.district, state: addr.state, pincode: addr.pincode,
      lat: String(addr.lat ?? ''), lng: String(addr.lng ?? ''), is_default: addr.is_default,
    });
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate({ ...form, lat: form.lat ? parseFloat(form.lat) : null, lng: form.lng ? parseFloat(form.lng) : null });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Saved Addresses</div>
          <div className="page-subtitle">Configure your default agricultural delivery location endpoints</div>
        </div>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => { setShowForm(true); setEditId(null); setForm({ ...BLANK }); }}>
            ➕ Add New Address
          </button>
        )}
      </div>

      {showForm && (
        <div className="card mb-24 card-primary">
          <div className="card-title mb-20" style={{ fontSize: 16 }}>{editId ? '🖊️ Edit Address Credentials' : '➕ Add Delivery Address'}</div>
          
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Address Tag Label</label>
                <select className="form-select" value={form.label} onChange={(e) => set('label', e.target.value)}>
                  <option>Home</option>
                  <option>Office</option>
                  <option>Farm</option>
                  <option>Other</option>
                </select>
              </div>
              <div className="form-group" style={{ justifyContent: 'center' }}>
                <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={form.is_default}
                    onChange={(e) => set('is_default', e.target.checked)}
                    style={{ width: 18, height: 18, border: '2px solid var(--border)', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 800, fontSize: 13 }}>Set as primary default address</span>
                </label>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Street Address / House No *</label>
              <input className="form-input" value={form.address_line} onChange={(e) => set('address_line', e.target.value)} placeholder="House/Flat No, Street details, Landmarked area" required />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Village / Locality *</label>
                <input className="form-input" value={form.village} onChange={(e) => set('village', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">District *</label>
                <input className="form-input" value={form.district} onChange={(e) => set('district', e.target.value)} required />
              </div>
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">State *</label>
                <input className="form-input" value={form.state} onChange={(e) => set('state', e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Pincode *</label>
                <input className="form-input" value={form.pincode} onChange={(e) => set('pincode', e.target.value)} maxLength={6} required />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: 12, borderTop: '2px solid var(--border-light)', paddingTop: '16px', marginTop: '8px' }}>
              <button className="btn btn-primary" type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? 'Saving address…' : editId ? 'Update Address' : 'Save Address'}
              </button>
              <button className="btn btn-secondary" type="button" onClick={() => { setShowForm(false); setEditId(null); }}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {!addresses.length && !showForm ? (
        <EmptyState
          icon="📍"
          title="No address destinations saved"
          description="Register a primary shipping location to speed up your crop procurement checkout process."
          action={
            <button className="btn btn-primary btn-lg" onClick={() => setShowForm(true)}>
              ➕ Add Delivery Address
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {addresses.map((addr) => (
            <div key={addr.id} className="card">
              <div className="flex-between mb-8">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 13, letterSpacing: '0.5px' }}>📍 {addr.label}</span>
                  {addr.is_default && (
                    <span className="badge badge-active" style={{ fontSize: 9, padding: '2px 8px' }}>Default</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => handleEdit(addr)}>🖊️ Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteMutation.mutate(addr.id)}>❌ Delete</button>
                </div>
              </div>
              <div className="fs-14" style={{ fontWeight: 600, borderTop: '2px solid var(--border-light)', paddingTop: '8px' }}>
                {addr.address_line && <div style={{ fontSize: 15, marginBottom: 4 }}>{addr.address_line}</div>}
                <div className="text-muted" style={{ fontWeight: 500 }}>
                  {[addr.village, addr.district, addr.state, addr.pincode].filter(Boolean).join(', ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
