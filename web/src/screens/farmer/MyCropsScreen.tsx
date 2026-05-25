import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import type { Product } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function MyCropsScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['my-listings'],
    queryFn: () => apiClient.get('/products/my-listings').then((r) => r.data),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      apiClient.patch(`/products/${id}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-listings'] }),
  });

  if (isLoading) return <LoadingSpinner />;
  const crops = data?.products ?? [];

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">My Crops</div>
          <div className="page-subtitle">Manage your marketplace crop listings</div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/farmer/crops/new')}>
          🌾 List New Crop
        </button>
      </div>

      {!crops.length ? (
        <EmptyState
          icon="🌾"
          title="No crops listed yet"
          description="Start listing your agricultural crops in the market to connect with buyers directly."
          action={
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/farmer/crops/new')}>
              List Your First Crop Now
            </button>
          }
        />
      ) : (
        <div className="product-grid">
          {crops.map((crop) => (
            <div key={crop.id} className="product-card">
              <div className="product-card-img-placeholder">
                🌾
              </div>
              <div className="product-card-body">
                <div className="flex-between">
                  <div className="product-card-name" style={{ fontWeight: 800 }}>{crop.crop_name}</div>
                  <StatusBadge status={crop.status} />
                </div>
                <div className="product-card-price" style={{ margin: '8px 0 12px' }}>₹{crop.price_per_kg}/kg</div>
                <div className="product-card-meta" style={{ padding: '8px 0', borderTop: '2px solid var(--border-light)' }}>
                  <span className="product-card-qty" style={{ fontWeight: 700 }}>
                    {crop.quantity_kg} kg available
                  </span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>
                    {new Date(crop.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="flex gap-8 mt-12" style={{ borderTop: '2px solid var(--border-light)', paddingTop: '12px' }}>
                  {crop.status === 'active' ? (
                    <button
                      className="btn btn-danger btn-sm btn-full"
                      onClick={() => updateStatus.mutate({ id: crop.id, status: 'sold_out' })}
                    >
                      Mark Sold Out
                    </button>
                  ) : (
                    <button
                      className="btn btn-primary btn-sm btn-full"
                      onClick={() => updateStatus.mutate({ id: crop.id, status: 'active' })}
                    >
                      Mark Active
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
