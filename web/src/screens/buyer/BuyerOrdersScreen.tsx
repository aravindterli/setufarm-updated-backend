import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import type { Order } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function BuyerOrdersScreen() {
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['buyer-orders'],
    queryFn: () => apiClient.get('/orders/my-orders?role=buyer').then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">My Purchases</div>
          <div className="page-subtitle">Track and manage your agricultural crop orders</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/buyer')}>
          🛒 Browse Market
        </button>
      </div>

      {!orders.length ? (
        <EmptyState
          icon="📦"
          title="No purchases yet"
          description="Browse agricultural fresh crops from local farms to make your first purchase."
          action={
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/buyer')}>
              🛒 Browse Marketplace
            </button>
          }
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map((order) => (
            <div
              key={order.id}
              className="card card-primary"
              style={{ cursor: 'pointer', padding: 20 }}
              onClick={() => navigate(`/buyer/orders/${order.id}`)}
            >
              <div className="flex-between" style={{ marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 17, textTransform: 'uppercase' }}>{order.crop_name ?? 'Order'}</div>
                  <div className="fs-13 text-muted" style={{ fontWeight: 600, marginTop: 2 }}>👨‍🌾 Farmer: {order.farmer_name ?? 'Local Farm'}</div>
                </div>
                <StatusBadge status={order.status} />
              </div>
              
              <div className="flex-between fs-14" style={{ borderTop: '2px solid var(--border-light)', paddingTop: '10px' }}>
                <div className="text-muted" style={{ fontWeight: 600 }}>
                  Weight: <strong style={{ color: 'var(--text)' }}>{order.quantity_kg} kg</strong> ·{' '}
                  Mode: <strong style={{ color: 'var(--text)', textTransform: 'uppercase', fontSize: 11 }}>{order.delivery_type === 'driver' || order.delivery_type === 'gramfleet' ? 'GramFleet' : order.delivery_type === 'farmer' ? 'Farmer' : order.delivery_type === 'self_pickup' ? 'Self Pickup' : '—'}</strong>
                </div>
                <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 18 }}>
                  ₹{order.total_amount.toLocaleString('en-IN')}
                </div>
              </div>
              
              <div className="fs-12 text-muted" style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 500 }}>
                <span>Order Ref: #{order.id.slice(0, 8).toUpperCase()}</span>
                <span>{new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
