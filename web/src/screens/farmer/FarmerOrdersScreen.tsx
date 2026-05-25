import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import type { Order } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import EmptyState from '../../components/ui/EmptyState';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function FarmerOrdersScreen() {
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery<Order[]>({
    queryKey: ['farmer-orders'],
    queryFn: () => apiClient.get('/orders/my-orders?role=farmer').then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header">
        <div className="page-title">My Orders</div>
        <div className="page-subtitle">Track and process customer orders for your crop produce</div>
      </div>

      {!orders.length ? (
        <EmptyState
          icon="📦"
          title="No orders yet"
          description="Once buyers purchase your farm items, their orders and transport details will show up here."
        />
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Order Ref</th>
                <th>Crop Listing</th>
                <th>Buyer Name</th>
                <th>Quantity</th>
                <th>Total Earnings</th>
                <th>Delivery Selection</th>
                <th>Status</th>
                <th>Date Placed</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id}>
                  <td style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>
                    #{order.id.slice(0, 8).toUpperCase()}
                  </td>
                  <td style={{ fontWeight: 800, textTransform: 'uppercase' }}>{order.crop_name ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{order.buyer_name ?? '—'}</td>
                  <td style={{ fontWeight: 600 }}>{order.quantity_kg} kg</td>
                  <td style={{ fontWeight: 900, color: 'var(--primary)' }}>₹{order.total_amount.toLocaleString('en-IN')}</td>
                  <td style={{ fontSize: 12, fontWeight: 700, color: 'var(--info)', textTransform: 'uppercase' }}>
                    {order.delivery_type === 'driver' || order.delivery_type === 'gramfleet' ? 'GramFleet Delivery' : order.delivery_type === 'farmer' ? 'Farmer Delivers' : order.delivery_type === 'self_pickup' ? 'Self Pickup' : '—'}
                  </td>
                  <td><StatusBadge status={order.status} /></td>
                  <td style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                    {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/farmer/orders/${order.id}`)}>
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
