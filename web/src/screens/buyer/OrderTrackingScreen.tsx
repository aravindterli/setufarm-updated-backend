import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { Order, OrderStatus } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

const getStepsForOrder = (deliveryType?: string): { key: OrderStatus; label: string; desc: string }[] => {
  if (deliveryType === 'self_pickup') {
    return [
      { key: 'pending',          label: 'Order Placed',      desc: 'Your crop order has been registered successfully.' },
      { key: 'confirmed',        label: 'Confirmed',         desc: 'Farmer accepted and packing your crop produce.' },
      { key: 'ready_for_pickup', label: 'Ready for Pickup',  desc: 'Crops are packed! Please visit the farm for self-pickup.' },
      { key: 'delivered',        label: 'Collected',         desc: 'Crops collected and order completed successfully.' },
    ];
  }
  if (deliveryType === 'farmer') {
    return [
      { key: 'pending',          label: 'Order Placed',      desc: 'Your crop order has been registered successfully.' },
      { key: 'confirmed',        label: 'Confirmed',         desc: 'Farmer accepted and packing your crop produce.' },
      { key: 'ready_for_pickup', label: 'Ready for Dispatch',desc: 'Farmer is preparing to deliver your fresh harvest.' },
      { key: 'delivered',        label: 'Delivered',         desc: 'Crops delivered successfully to your location.' },
    ];
  }
  return [
    { key: 'pending',          label: 'Order Placed',      desc: 'Your crop order has been registered successfully.' },
    { key: 'confirmed',        label: 'Confirmed',         desc: 'Farmer accepted and packing your crop produce.' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup',  desc: 'Crops are securely loaded and ready for transport.' },
    { key: 'in_transit',       label: 'In Transit',        desc: 'Logistical driver is currently shipping to you.' },
    { key: 'delivered',        label: 'Delivered',         desc: 'Order delivered successfully at your location.' },
  ];
};

export default function OrderTrackingScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: () => apiClient.get(`/orders/${id}`).then((r) => r.data),
    refetchInterval: 15000,
  });

  if (isLoading) return <LoadingSpinner />;
  if (!order) return <div style={{ padding: 48, textAlign: 'center', fontWeight: 600 }}>Order not found.</div>;

  const steps = getStepsForOrder(order.delivery_type);
  const currentIdx = steps.findIndex((s) => s.key === order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-secondary mb-24" onClick={() => navigate('/buyer/orders')}>
        ← Back to My Orders
      </button>

      <div className="page-header">
        <div className="page-title">Order Dispatch Tracking</div>
        <div className="page-subtitle" style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: 700, textTransform: 'uppercase' }}>
          Reference: #{order.id}
        </div>
      </div>

      {/* Order Info */}
      <div className="card mb-24">
        <div className="flex-between mb-12">
          <div>
            <div style={{ fontWeight: 900, fontSize: 18, textTransform: 'uppercase' }}>{order.crop_name ?? '—'}</div>
            <div className="fs-13 text-muted" style={{ fontWeight: 600, marginTop: 2 }}>Farmer: {order.farmer_name ?? 'Local Farm'}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--primary)' }}>
              ₹{order.total_amount.toLocaleString('en-IN')}
            </div>
            <div className="fs-13 text-muted" style={{ fontWeight: 700 }}>{order.quantity_kg} kg purchased</div>
          </div>
        </div>
        {order.delivery_type && (
          <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', background: 'var(--primary-light)', color: 'var(--primary)', padding: '6px 12px', display: 'inline-block', border: '2px solid var(--border)' }}>
            Delivery Mode: {order.delivery_type === 'driver' || order.delivery_type === 'gramfleet' ? 'GramFleet Delivery' : order.delivery_type === 'farmer' ? 'Farmer Delivers' : 'Self Pickup'}
          </div>
        )}
      </div>

      {isCancelled ? (
        <div className="card card-danger" style={{ background: 'var(--danger-bg)', textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>❌</div>
          <div style={{ fontWeight: 900, color: 'var(--danger)', fontSize: 20, textTransform: 'uppercase' }}>Order Cancelled</div>
          <p className="fs-14 text-muted mt-8" style={{ fontWeight: 600 }}>This transaction was terminated. Please contact customer support if you paid.</p>
        </div>
      ) : (
        <div className="card">
          <div className="card-title mb-24" style={{ fontSize: 16 }}>Delivery Journey Timeline</div>
          <div className="timeline">
            {steps.map((step, idx) => {
              const isDone = idx <= currentIdx;
              const isActive = idx === currentIdx;
              const isLast = idx === steps.length - 1;
              return (
                <div key={step.key} className="timeline-step">
                  <div className="timeline-dot-col">
                    <div className={`timeline-dot${isDone ? ' done' : ''}${isActive ? ' active' : ''}`} />
                    {!isLast && <div className={`timeline-line${isDone && !isActive ? ' done' : ''}`} />}
                  </div>
                  <div className="timeline-content">
                    <div className={`timeline-label${isActive ? ' text-primary font-bold' : isDone ? ' text-success' : ' text-muted'}`} style={{ fontSize: 14 }}>
                      {step.label}
                    </div>
                    {(isDone || isActive) && (
                      <div className="timeline-time" style={{ fontWeight: 500, lineHeight: 1.4 }}>{step.desc}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Farm Location Details for Self Pickup */}
      {order.delivery_type === 'self_pickup' && order.farmer && (
        <div className="card mt-24" style={{ border: '1px solid var(--primary)', background: 'var(--primary-light)', borderRadius: '12px' }}>
          <div className="card-title mb-8" style={{ fontSize: 15, color: 'var(--primary)' }}>📍 Farm Collection Point</div>
          <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 14 }}>{order.farmer.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, fontWeight: 600 }}>
            Village: {order.farmer.village || 'Nearby Farm'}, District: {order.farmer.district || ''}
          </div>
          {order.farmer.phone && (
            <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 8, fontWeight: 700 }}>
              📞 Call Farmer: {order.farmer.phone}
            </div>
          )}
        </div>
      )}

      {/* Driver Info when assigned */}
      {order.assigned_driver && (
        <div className="card mt-24" style={{ border: '1px solid var(--primary)', background: 'var(--primary-light)', borderRadius: '12px' }}>
          <div className="card-title mb-8" style={{ fontSize: 15, color: 'var(--primary)' }}>🚚 GramFleet Delivery Agent</div>
          <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 14 }}>{order.assigned_driver.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4, fontWeight: 600 }}>
            Status: {order.status === 'ready_for_pickup' ? 'Heading to the farm for pickup' : 'On the way to your location'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 8, fontWeight: 700 }}>
            📞 Call Driver: {order.assigned_driver.phone}
          </div>
        </div>
      )}

      {/* Delivery proof */}
      {order.delivery_proof_url && (
        <div className="card mt-24">
          <div className="card-title mb-12" style={{ fontSize: 15 }}>Delivery Cargo Proof photo</div>
          <img src={order.delivery_proof_url} alt="Delivery proof" style={{ maxWidth: '100%', border: '2px solid var(--border)' }} />
        </div>
      )}
    </div>
  );
}
