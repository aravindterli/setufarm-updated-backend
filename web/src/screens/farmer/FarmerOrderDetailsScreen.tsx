import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { Order, DriverInfo } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';



export default function FarmerOrderDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [requestedDriverId, setRequestedDriverId] = useState<string | null>(null);

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then((r) => r.data),
    refetchInterval: 15000,
  });

  const { data: drivers = [] } = useQuery<DriverInfo[]>({
    queryKey: ['nearby-drivers'],
    queryFn: () => apiClient.get('/users/drivers/nearby').then((r) => r.data),
    enabled: order?.status === 'ready_for_pickup' && !order?.assigned_driver_id,
  });

  const updateStatus = useMutation({
    mutationFn: (status: string) =>
      apiClient.patch(`/orders/${id}/status?status=${status}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order', id] }),
  });

  const requestDriver = useMutation({
    mutationFn: (driverId: string) =>
      apiClient.post(`/users/driver/request/${id}/${driverId}`),
    onSuccess: (_, driverId) => setRequestedDriverId(driverId),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div>Order not found.</div>;

  let action: { next: string; label: string } | undefined = undefined;
  if (order.status === 'pending') {
    action = { next: 'confirmed', label: 'Confirm Order' };
  } else if (order.status === 'confirmed') {
    action = { next: 'ready_for_pickup', label: 'Mark Ready for Pickup' };
  } else if (order.status === 'ready_for_pickup') {
    if (order.delivery_type === 'self_pickup') {
      action = { next: 'delivered', label: 'Confirm Handover & Deliver (Complete Order)' };
    } else if (order.delivery_type === 'farmer') {
      action = { next: 'delivered', label: 'Mark Delivered to Buyer (Complete Order)' };
    }
  }

  return (
    <div>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Order Details</div>
          <div className="page-subtitle" style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700 }}>
            Order ID: #{order.id}
          </div>
        </div>
        <button className="btn btn-secondary" onClick={() => navigate('/farmer/orders')}>
          ← Back to Orders
        </button>
      </div>

      <div className="grid-2col">
        <div>
          {/* Order Summary */}
          <div className="card mb-24">
            <div className="card-header">
              <div className="card-title">Order Ledger Summary</div>
              <StatusBadge status={order.status} />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 20 }}>
              <div>
                <div className="form-label" style={{ color: 'var(--text-muted)' }}>Crop Produce</div>
                <div style={{ fontWeight: 800, fontSize: 18, textTransform: 'uppercase', marginTop: 4 }}>{order.crop_name ?? '—'}</div>
              </div>
              <div>
                <div className="form-label" style={{ color: 'var(--text-muted)' }}>Quantity Ordered</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>{order.quantity_kg} kg</div>
              </div>
              <div>
                <div className="form-label" style={{ color: 'var(--text-muted)' }}>Price Per kg</div>
                <div style={{ fontWeight: 800, fontSize: 18, marginTop: 4 }}>₹{order.price_per_kg}</div>
              </div>
              <div>
                <div className="form-label" style={{ color: 'var(--text-muted)' }}>Total Earnings</div>
                <div style={{ fontWeight: 900, fontSize: 24, color: 'var(--primary)', marginTop: 4 }}>
                  ₹{order.total_amount.toLocaleString('en-IN')}
                </div>
              </div>
              <div>
                <div className="form-label" style={{ color: 'var(--text-muted)' }}>Delivery Selection</div>
                <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: 14, color: 'var(--info)', marginTop: 4 }}>
                  {order.delivery_type === 'driver' || order.delivery_type === 'gramfleet' ? 'GramFleet Delivery' : order.delivery_type === 'farmer' ? 'Farmer Delivers' : order.delivery_type === 'self_pickup' ? 'Self Pickup' : 'Not selected'}
                </div>
              </div>
              <div>
                <div className="form-label" style={{ color: 'var(--text-muted)' }}>Placed On</div>
                <div style={{ fontWeight: 600, fontSize: 14, marginTop: 4 }}>{new Date(order.created_at).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
              </div>
            </div>
          </div>

          {/* Buyer Info */}
          <div className="card mb-24">
            <div className="card-header" style={{ marginBottom: 12, paddingBottom: 8 }}>
              <div className="card-title" style={{ fontSize: 16 }}>Buyer Information</div>
            </div>
            <div style={{ fontWeight: 800, fontSize: 16, textTransform: 'uppercase' }}>{order.buyer_name ?? '—'}</div>
            {order.buyer_phone && (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📞</span> <span>{order.buyer_phone}</span>
              </div>
            )}
            {order.delivery_address && (
              <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>📍</span> <span>{order.delivery_address}</span>
              </div>
            )}
          </div>

          {/* OTP */}
          {order.pickup_otp && (
            <div className="card card-success mb-24" style={{ background: 'var(--success-bg)' }}>
              <div className="card-title" style={{ fontSize: 16, marginBottom: 8 }}>Pickup Verification OTP</div>
              <div style={{ fontSize: 36, fontWeight: 900, letterSpacing: 8, color: 'var(--success)', fontFamily: 'monospace' }}>
                {order.pickup_otp}
              </div>
              <div className="fs-13 text-muted mt-8" style={{ fontWeight: 600 }}>
                Share this secure OTP passcode with the transport driver to verify crop pickup.
              </div>
            </div>
          )}
        </div>

        {/* Actions & Driver Selection */}
        <div>
          {action && (
            <div className="card card-primary mb-24">
              <div className="card-title" style={{ fontSize: 16, marginBottom: 12 }}>Process Order</div>
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={() => updateStatus.mutate(action.next)}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? 'Updating…' : action.label}
              </button>
            </div>
          )}

          {/* Driver Assignment */}
          {order.status === 'ready_for_pickup' && (order.delivery_type === 'gramfleet' || order.delivery_type === 'driver') && !order.assigned_driver_id && (
            <div className="card card-warning">
              <div className="card-title" style={{ fontSize: 16, marginBottom: 16 }}>Invite Nearby Drivers</div>
              {!drivers.length ? (
                <div style={{ textAlign: 'center', padding: '16px 0', color: 'var(--text-muted)' }}>
                  <div style={{ fontSize: 32, marginBottom: 8 }}>🛰️</div>
                  <p className="fs-13" style={{ fontWeight: 600 }}>Scanning for active GramFleet drivers nearby...</p>
                </div>
              ) : (
                drivers.map((driver) => (
                  <div key={driver.id} style={{ border: '2px solid var(--border)', padding: 16, marginBottom: 12, background: 'var(--white)' }}>
                    <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 14 }}>{driver.name}</div>
                    <div className="fs-13 text-muted" style={{ margin: '8px 0', fontWeight: 500, lineHeight: 1.4 }}>
                      Vehicle: {driver.vehicle_type?.replace(/_/g, ' ')} <br />
                      No: {driver.vehicle_number} <br />
                      Rating: ⭐ {driver.rating?.toFixed(1)} <br />
                      Distance: 📍 {driver.distance_km?.toFixed(1)} km away
                    </div>
                    <button
                      className={`btn btn-sm ${requestedDriverId === driver.id ? 'btn-ghost' : 'btn-primary'} btn-full`}
                      onClick={() => requestDriver.mutate(driver.id)}
                      disabled={!!requestedDriverId}
                    >
                      {requestedDriverId === driver.id ? '✓ Requested' : '🚀 Send Invite'}
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {order.assigned_driver_id && (
            <div className="card card-success" style={{ background: 'var(--success-bg)' }}>
              <div className="card-header" style={{ marginBottom: 12, paddingBottom: 8, borderBottom: '1px solid rgba(0, 0, 0, 0.05)' }}>
                <div className="card-title" style={{ fontSize: 15 }}>Driver Information</div>
              </div>
              <div style={{ fontWeight: 800, fontSize: 16, textTransform: 'uppercase' }}>
                {order.assigned_driver?.name ?? order.driver_name ?? 'GramFleet Driver'}
              </div>
              {order.assigned_driver?.phone && (
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>📞</span> <span>{order.assigned_driver.phone}</span>
                </div>
              )}
              {order.assigned_driver?.vehicle_type && (
                <div style={{ fontSize: 14, color: 'var(--text-muted)', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span>🚚</span> <span style={{ textTransform: 'capitalize' }}>
                    {order.assigned_driver.vehicle_type.replace(/_/g, ' ')} {order.assigned_driver.vehicle_number ? `· ${order.assigned_driver.vehicle_number}` : ''}
                  </span>
                </div>
              )}
              <div className="fs-13 text-muted" style={{ marginTop: 12, fontWeight: 600 }}>
                Status: Driver accepted payload and is heading to your farm.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
