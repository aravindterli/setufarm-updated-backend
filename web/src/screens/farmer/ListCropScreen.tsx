import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';

const CROP_CATEGORIES = [
  'Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Leafy Greens', 'Oilseeds', 'Other',
];

export default function ListCropScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [form, setForm] = useState({
    crop_name: '',
    category: 'Vegetables',
    price_per_kg: '',
    quantity_kg: '',
    description: '',
    lat: '',
    lng: '',
  });
  const [error, setError] = useState('');

  const set = (field: string, val: string) =>
    setForm((prev) => ({ ...prev, [field]: val }));

  const mutation = useMutation({
    mutationFn: (payload: any) => apiClient.post('/products', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-listings'] });
      navigate('/farmer/crops');
    },
    onError: (err: any) => {
      setError(err?.response?.data?.detail ?? 'Failed to list crop. Please try again.');
    },
  });

  const getLocation = () => {
    if (!navigator.geolocation) { setError('Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        set('lat', String(pos.coords.latitude));
        set('lng', String(pos.coords.longitude));
      },
      () => setError('Could not get your location.')
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.crop_name || !form.price_per_kg || !form.quantity_kg) {
      setError('Please fill all required fields.'); return;
    }
    setError('');
    mutation.mutate({
      crop_name: form.crop_name,
      category: form.category,
      price_per_kg: parseFloat(form.price_per_kg),
      quantity_kg: parseFloat(form.quantity_kg),
      description: form.description,
      lat: form.lat ? parseFloat(form.lat) : null,
      lng: form.lng ? parseFloat(form.lng) : null,
      status: 'active',
    });
  };

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">List New Crop</div>
          <div className="page-subtitle">Add agricultural harvest produce for buyers to discover</div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/farmer/crops')}>
          ← Back to My Crops
        </button>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Crop Produce Name *</label>
            <input className="form-input" value={form.crop_name} onChange={(e) => set('crop_name', e.target.value)} placeholder="e.g. Tomatoes, Basmati Rice, Red Potatoes" autoFocus />
          </div>
          
          <div className="form-group">
            <label className="form-label">Crop Category</label>
            <select className="form-select" value={form.category} onChange={(e) => set('category', e.target.value)}>
              {CROP_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Price per kg (₹) *</label>
              <input className="form-input" type="number" min="0" step="0.01" value={form.price_per_kg} onChange={(e) => set('price_per_kg', e.target.value)} placeholder="e.g. 25" />
            </div>
            <div className="form-group">
              <label className="form-label">Available Quantity (kg) *</label>
              <input className="form-input" type="number" min="0" step="0.1" value={form.quantity_kg} onChange={(e) => set('quantity_kg', e.target.value)} placeholder="e.g. 100" />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Harvest / Quality Description</label>
            <textarea className="form-textarea" value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Describe your crop quality, freshness, organic details, harvest date..." />
          </div>

          <hr className="section-divider" />
          
          <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 16, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📍 FARM PICKUP GEOLOCATION</div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input" value={form.lat} onChange={(e) => set('lat', e.target.value)} placeholder="e.g. 17.3850" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input" value={form.lng} onChange={(e) => set('lng', e.target.value)} placeholder="e.g. 78.4867" />
            </div>
          </div>
          
          <button type="button" className="btn btn-secondary btn-sm" onClick={getLocation} style={{ marginBottom: 24 }}>
            📍 Fetch Current GPS Coordinate
          </button>

          {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16, fontWeight: 700 }}>{error}</div>}
          
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'Publishing crop details…' : '🌾 Publish Crop Listing'}
          </button>
        </form>
      </div>
    </div>
  );
}
