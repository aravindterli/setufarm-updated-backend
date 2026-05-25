import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import type { FarmerDashboard } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function FarmerDashboardScreen() {
  const navigate = useNavigate();
  const { data, isLoading } = useQuery<FarmerDashboard>({
    queryKey: ['farmer-dashboard'],
    queryFn: () => apiClient.get('/users/farmer/dashboard').then((r) => r.data),
    refetchInterval: 30000,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Farmer Dashboard</div>
          <div className="page-subtitle">Overview of your farm business activity</div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/farmer/crops/new')}>
          🌾 List New Crop
        </button>
      </div>

      <div className="stat-grid">
        <div className="stat-card card-primary">
          <div className="stat-value">₹{data?.weekly_earnings?.toLocaleString('en-IN') ?? 0}</div>
          <div className="stat-label">Weekly Earnings</div>
        </div>
        <div className="stat-card card-warning">
          <div className="stat-value">{data?.pending_orders ?? 0}</div>
          <div className="stat-label">Pending Orders</div>
        </div>
        <div className="stat-card card-success">
          <div className="stat-value">₹{data?.pending_payout?.toLocaleString('en-IN') ?? 0}</div>
          <div className="stat-label">Pending Payout</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="card-title">Recent Customer Orders</div>
          <button className="btn btn-secondary btn-sm" onClick={() => navigate('/farmer/orders')}>
            View All Orders →
          </button>
        </div>
        {!data?.recent_orders?.length ? (
          <div style={{ padding: '48px 0', textAlign: 'center', color: 'var(--text-muted)' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📦</div>
            <div style={{ fontWeight: 800, textTransform: 'uppercase', marginBottom: '8px' }}>No orders yet</div>
            <p className="fs-14">List your crops in the marketplace to start receiving buyer requests.</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Crop Listings</th>
                  <th>Qty (kg)</th>
                  <th>Total Amount</th>
                  <th>Delivery Status</th>
                  <th>Order Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.recent_orders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        {order.crop_photo ? (
                          <img src={order.crop_photo} alt={order.crop_name}
                            style={{ width: 40, height: 40, objectFit: 'cover', flexShrink: 0, border: '2px solid var(--border)' }} />
                        ) : (
                          <div style={{ width: 40, height: 40, background: 'var(--primary-light)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🌾</div>
                        )}
                        <span style={{ fontWeight: 700, textTransform: 'uppercase' }}>{order.crop_name}</span>
                      </div>
                    </td>
                    <td style={{ fontWeight: 600 }}>{order.quantity_kg} kg</td>
                    <td style={{ fontWeight: 800, color: 'var(--primary)' }}>₹{order.total_amount.toLocaleString('en-IN')}</td>
                    <td><StatusBadge status={order.status} /></td>
                    <td style={{ color: 'var(--text-muted)', fontSize: 13, fontWeight: 500 }}>
                      {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/farmer/orders/${order.id}`)}>
                        Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
