import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { Order } from '../../types';
import StatusBadge from '../../components/ui/StatusBadge';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function DriverOrderDetailsScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then((r) => r.data),
    refetchInterval: 15000,
  });

  const markDelivered = useMutation({
    mutationFn: () => apiClient.patch(`/orders/${id}/status?status=delivered`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order', id] });
      qc.invalidateQueries({ queryKey: ['driver-dashboard'] });
    },
  });

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div className="card" style={{ textAlign: 'center', padding: 40 }}>Order not found.</div>;

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <button className="btn btn-ghost mb-24" onClick={() => navigate('/driver/requests')}>
        ← Back to Requests
      </button>

      <div className="page-header flex-between" style={{ paddingBottom: 16, marginBottom: 24 }}>
        <div>
          <div className="page-title" style={{ fontSize: 24 }}>Logistics Dispatch Sheet</div>
          <div className="page-subtitle" style={{ fontSize: 13 }}>ID: #{order.id.slice(-8).toUpperCase()} · Managed by GramFleet</div>
        </div>
        <StatusBadge status={order.status} />
      </div>

      <div className="grid-2col">
        {/* Left Side: Route Sheet */}
        <div>
          <div className="card mb-20" style={{ padding: 24 }}>
            <div className="card-title" style={{ fontSize: 16, marginBottom: 20 }}>🗺️ Delivery Route Timeline</div>
            
            <div className="timeline">
              {/* Pickup step */}
              <div className="timeline-step">
                <div className="timeline-dot-col">
                  <div className={`timeline-dot ${order.status !== 'ready_for_pickup' ? 'done' : 'active'}`} style={{ borderStyle: 'solid' }}></div>
                  <div className={`timeline-line ${order.status !== 'ready_for_pickup' ? 'done' : ''}`} style={{ minHeight: 64 }}></div>
                </div>
                <div className="timeline-content" style={{ paddingBottom: 24 }}>
                  <div className="timeline-label" style={{ fontSize: 12, color: 'var(--warning)', fontWeight: 800 }}>📍 FARM PICKUP</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{order.farmer_name ?? '—'}</span>
                    {order.farmer?.phone && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>(📞 {order.farmer.phone})</span>
                    )}
                  </div>
                  <div className="timeline-time" style={{ fontSize: 12, fontWeight: 500 }}>
                    Pickup fresh harvest ({order.quantity_kg} kg of {order.crop_name}). Check quality and enter pickup OTP from farmer to release payload.
                  </div>
                </div>
              </div>

              {/* Drop-off step */}
              <div className="timeline-step">
                <div className="timeline-dot-col">
                  <div className={`timeline-dot ${order.status === 'delivered' ? 'done' : order.status === 'in_transit' ? 'active' : ''}`}></div>
                </div>
                <div className="timeline-content">
                  <div className="timeline-label" style={{ fontSize: 12, color: 'var(--info)', fontWeight: 800 }}>📦 BUYER DROPOFF</div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginTop: 4, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span>{order.buyer_name ?? '—'}</span>
                    {order.buyer_phone && (
                      <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 500 }}>(📞 {order.buyer_phone})</span>
                    )}
                  </div>
                  {order.delivery_address && (
                    <div style={{ margin: '8px 0', padding: 12, background: 'var(--primary-light)', border: '2px solid var(--border)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>
                      {order.delivery_address}
                    </div>
                  )}
                  <div className="timeline-time" style={{ fontSize: 12, fontWeight: 500 }}>
                    Safe drop-off to receiver. Handover produce and mark order as complete in this dashboard.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Cargo Ledger & Payments */}
        <div>
          {/* Details */}
          <div className="card mb-20" style={{ padding: 20 }}>
            <div className="card-title" style={{ fontSize: 15, marginBottom: 14 }}>📦 Cargo Details</div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Produce</span>
                <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 13 }}>{order.crop_name ?? '—'}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--border-light)', paddingBottom: 6 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Weight</span>
                <span style={{ fontWeight: 800, fontSize: 13 }}>{order.quantity_kg} kg</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Payout Fee</span>
                <span style={{ fontWeight: 900, fontSize: 18, color: 'var(--primary)' }}>₹{order.delivery_charge ?? '—'}</span>
              </div>
            </div>
          </div>

          {/* Action panels based on status */}
          {order.status === 'in_transit' && (
            <div className="card" style={{ background: 'var(--primary-light)', borderLeft: '6px solid var(--primary)' }}>
              <div className="card-title" style={{ fontSize: 15, marginBottom: 10 }}>Complete Shipment</div>
              <p className="fs-13 text-muted" style={{ marginBottom: 16, fontWeight: 600 }}>
                Once you successfully reach the buyer and deliver all goods safely, press the button below.
              </p>
              <button
                className="btn btn-primary btn-full btn-lg"
                onClick={() => markDelivered.mutate()}
                disabled={markDelivered.isPending}
              >
                {markDelivered.isPending ? 'Updating Ledgers…' : '✓ Mark as Delivered'}
              </button>
            </div>
          )}

          {order.status === 'delivered' && (
            <div className="card" style={{ background: 'var(--success-bg)', borderLeft: '6px solid var(--success)', textAlign: 'center', padding: '24px 16px' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontWeight: 800, color: 'var(--success)', fontSize: 16, textTransform: 'uppercase' }}>Contract Fulfilled</div>
              <p className="fs-13 text-muted" style={{ marginTop: 8, fontWeight: 600 }}>
                Your dispatch fee of ₹{order.delivery_charge} has been posted to your pending payouts ledger.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
