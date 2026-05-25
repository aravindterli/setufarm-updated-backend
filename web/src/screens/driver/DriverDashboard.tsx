import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import type { DriverDashboard } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import StatusBadge from '../../components/ui/StatusBadge';

export default function DriverDashboardScreen() {
  const navigate = useNavigate();

  const { data, isLoading } = useQuery<DriverDashboard>({
    queryKey: ['driver-dashboard'],
    queryFn: () => apiClient.get('/users/driver/dashboard').then((r) => r.data),
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingSpinner />;

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Driver Dashboard</div>
          <div className="page-subtitle">Track and coordinate your logistical agricultural delivery tasks</div>
        </div>
        <div style={{ background: 'var(--primary-light)', padding: '6px 16px', border: '2px solid var(--border)', fontWeight: 800, fontSize: 13, textTransform: 'uppercase', color: 'var(--primary)' }}>
          🟢 Connected Online
        </div>
      </div>

      {/* Stats */}
      <div className="stat-grid">
        <div className="stat-card card-primary">
          <div className="stat-value">₹{data?.today_earnings?.toLocaleString('en-IN') ?? 0}</div>
          <div className="stat-label">Today's Earnings</div>
        </div>
        <div className="stat-card card-info">
          <div className="stat-value">{data?.total_deliveries ?? 0}</div>
          <div className="stat-label">Total Deliveries</div>
        </div>
        <div className="stat-card card-success">
          <div className="stat-value">₹{data?.pending_payout?.toLocaleString('en-IN') ?? 0}</div>
          <div className="stat-label">Pending Payout</div>
        </div>
      </div>

      <div className="grid-2col">
        {/* Left: Active Deliveries & Incoming Requests */}
        <div>
          {/* Incoming Requests */}
          {!!data?.incoming_requests?.length && (
            <div className="card card-warning mb-24" style={{ background: 'var(--warning-bg)' }}>
              <div className="card-header" style={{ marginBottom: 16, paddingBottom: 8 }}>
                <div className="card-title" style={{ fontSize: 16 }}>🔔 Direct Farmer Requests ({data.incoming_requests.length})</div>
                <button className="btn btn-primary btn-sm" onClick={() => navigate('/driver/requests')}>
                  Respond Now
                </button>
              </div>
              
              {data.incoming_requests.slice(0, 3).map((req) => (
                <div key={req.id} style={{ border: '2px solid var(--border)', padding: 16, marginBottom: 12, background: 'var(--white)', boxShadow: 'var(--shadow-flat-sm)' }}>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 15 }}>{req.crop_name}</div>
                  <div className="fs-13 text-muted" style={{ margin: '6px 0 12px', fontWeight: 600 }}>
                    Farmer: {req.farmer_name} · Qty: {req.quantity_kg} kg
                  </div>
                  <div className="flex-between" style={{ borderTop: '2px solid var(--border-light)', paddingTop: '10px' }}>
                    <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 20 }}>
                      ₹{req.delivery_charge}
                    </span>
                    <button className="btn btn-secondary btn-sm" onClick={() => navigate('/driver/requests')}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Active Deliveries */}
          {!!data?.my_active_orders?.length && (
            <div className="card mb-24">
              <div className="card-header" style={{ marginBottom: 16, paddingBottom: 8 }}>
                <div className="card-title" style={{ fontSize: 16 }}>🚚 Active Shipments In Transit</div>
              </div>
              
              {data.my_active_orders.map((order) => (
                <div key={order.id} style={{ border: '2px solid var(--border)', padding: 18, marginBottom: 12, background: 'var(--white)', boxShadow: 'var(--shadow-flat-sm)' }}>
                  <div className="flex-between" style={{ marginBottom: 10 }}>
                    <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{order.crop_name}</div>
                    <StatusBadge status={order.status} />
                  </div>
                  <div className="flex-between fs-13 text-muted" style={{ borderTop: '2px solid var(--border-light)', paddingTop: '10px', marginTop: '6px' }}>
                    <span style={{ fontWeight: 600 }}>Placed: {new Date(order.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <span style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 16 }}>₹{order.delivery_charge}</span>
                      <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/driver/orders/${order.id}`)}>
                        View Route
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Available Orders pool */}
        <div>
          {/* Available Orders */}
          {!!data?.available_orders?.length && (
            <div className="card card-primary">
              <div className="card-header" style={{ marginBottom: 16, paddingBottom: 8 }}>
                <div className="card-title" style={{ fontSize: 16 }}>📦 Available Market Deliveries</div>
              </div>
              
              {data.available_orders.map((order) => (
                <div key={order.id} style={{ border: '2px solid var(--border)', padding: 16, marginBottom: 12, background: 'var(--white)', boxShadow: 'var(--shadow-flat-sm)' }}>
                  <div className="flex-between">
                    <div>
                      <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{order.crop_name}</div>
                      <div className="fs-13 text-muted" style={{ marginTop: 4, fontWeight: 600 }}>📍 Distance: {order.distance_km?.toFixed(1)} km away</div>
                    </div>
                    <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 18 }}>
                      ₹{order.delivery_charge}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {!data?.incoming_requests?.length && !data?.my_active_orders?.length && !data?.available_orders?.length && (
            <div className="card" style={{ textAlign: 'center', padding: 48 }}>
              <div style={{ fontSize: 56, marginBottom: 16 }}>🚚</div>
              <div style={{ fontWeight: 800, fontSize: 18, textTransform: 'uppercase', marginBottom: 8 }}>No deliveries scheduled</div>
              <p className="text-muted fs-14" style={{ fontWeight: 600 }}>Stay active and online to instantly capture nearby crop delivery dispatch requests.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
