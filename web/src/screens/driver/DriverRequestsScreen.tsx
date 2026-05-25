import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import type { DriverDashboard } from '../../types';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

export default function DriverRequestsScreen() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [otpInputs, setOtpInputs] = useState<Record<string, string>>({});
  const [otpError, setOtpError] = useState<Record<string, string>>({});

  const { data, isLoading } = useQuery<DriverDashboard>({
    queryKey: ['driver-dashboard'],
    queryFn: () => apiClient.get('/users/driver/dashboard').then((r) => r.data),
    refetchInterval: 15000,
  });

  const respond = useMutation({
    mutationFn: ({ orderId, accept }: { orderId: string; accept: boolean }) =>
      apiClient.post(`/users/driver/respond/${orderId}?accept=${accept}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['driver-dashboard'] }),
  });

  const verifyPickup = useMutation({
    mutationFn: ({ orderId, otp }: { orderId: string; otp: string }) =>
      apiClient.post(`/users/driver/verify-pickup/${orderId}?otp=${otp}`),
    onSuccess: (_, vars) => {
      setOtpInputs((prev) => ({ ...prev, [vars.orderId]: '' }));
      setOtpError((prev) => ({ ...prev, [vars.orderId]: '' }));
      qc.invalidateQueries({ queryKey: ['driver-dashboard'] });
    },
    onError: (err: any, vars) => {
      setOtpError((prev) => ({ ...prev, [vars.orderId]: err?.response?.data?.detail ?? 'Invalid OTP' }));
    },
  });

  if (isLoading) return <LoadingSpinner />;

  const incoming = data?.incoming_requests ?? [];
  const active = data?.my_active_orders ?? [];

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Delivery Requests</div>
        <div className="page-subtitle">Accept fresh harvest transport invites and coordinate active trips</div>
      </div>

      <div className="grid-2col">
        {/* Left Col: Incoming Invites */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>🔔 Direct Farm Invites</span>
            {incoming.length > 0 && (
              <span className="badge badge-pending" style={{ padding: '3px 8px', fontSize: 11 }}>{incoming.length} New</span>
            )}
          </div>
          
          {!incoming.length ? (
            <EmptyState icon="🔔" title="No direct invites" description="When farmers explicitly assign you to deliver their crops, the dispatch cards will load instantly here." />
          ) : (
            incoming.map((req) => (
              <div key={req.id} className="request-card" style={{ borderLeft: '6px solid var(--warning)' }}>
                <div style={{ width: 48, height: 48, background: 'var(--primary-light)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                  🌾
                </div>
                <div className="request-card-info">
                  <div className="request-card-title" style={{ fontSize: 16 }}>{req.crop_name}</div>
                  <div className="request-card-sub" style={{ margin: '4px 0 10px', fontWeight: 600 }}>
                    Farmer: <span style={{ color: 'var(--text)' }}>{req.farmer_name}</span> · Quantity: {req.quantity_kg} kg
                  </div>
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 14 }}>
                    <span className="request-card-price">₹{req.delivery_charge}</span>
                    <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>dispatch fee</span>
                  </div>
                  <div className="request-actions">
                    <button
                      className="btn btn-primary btn-sm"
                      onClick={() => respond.mutate({ orderId: req.id, accept: true })}
                      disabled={respond.isPending}
                    >
                      ✓ Accept
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => respond.mutate({ orderId: req.id, accept: false })}
                      disabled={respond.isPending}
                    >
                      ✗ Reject
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/driver/orders/${req.id}`)}>
                      Details
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Right Col: Active Shipments */}
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 18 }}>
            🚚 Active Deliveries
          </div>

          {!active.length ? (
            <div className="card" style={{ textAlign: 'center', padding: '36px 20px', borderStyle: 'dashed' }}>
              <div style={{ fontSize: 32, marginBottom: 10 }}>📦</div>
              <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 13, color: 'var(--text-muted)' }}>No active transit contracts</div>
            </div>
          ) : (
            active.map((order) => (
              <div key={order.id} className="card card-info" style={{ marginBottom: 16, borderLeftWidth: 6 }}>
                <div className="flex-between" style={{ marginBottom: 14, borderBottom: '2px solid var(--border-light)', paddingBottom: 10 }}>
                  <div>
                    <div style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 15 }}>{order.crop_name}</div>
                    <div style={{ fontSize: 13, color: 'var(--primary)', fontWeight: 700, marginTop: 2 }}>
                      Pay: ₹{order.delivery_charge}
                    </div>
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => navigate(`/driver/orders/${order.id}`)}>
                    Route Details →
                  </button>
                </div>

                {order.status === 'ready_for_pickup' ? (
                  <div style={{ background: 'var(--warning-bg)', border: '2px solid var(--warning)', padding: 16 }}>
                    <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--warning)', textTransform: 'uppercase', marginBottom: 6 }}>
                      🔑 Enter Farm Pickup OTP
                    </div>
                    <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 12, fontWeight: 600 }}>
                      Ask the farmer for the 6-digit verification code to release cargo.
                    </p>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <input
                        className="form-input"
                        style={{ maxWidth: 140, letterSpacing: 4, fontWeight: 800, fontSize: 16, textTransform: 'uppercase', textAlign: 'center' }}
                        placeholder="••••••"
                        maxLength={6}
                        value={otpInputs[order.id] ?? ''}
                        onChange={(e) => setOtpInputs((p) => ({ ...p, [order.id]: e.target.value }))}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => verifyPickup.mutate({ orderId: order.id, otp: otpInputs[order.id] ?? '' })}
                        disabled={verifyPickup.isPending}
                      >
                        {verifyPickup.isPending ? 'Verifying…' : 'Verify & Start Trip'}
                      </button>
                    </div>
                    {otpError[order.id] && (
                      <div style={{ color: 'var(--danger)', fontSize: 12, fontWeight: 700, marginTop: 8 }}>
                        ⚠️ {otpError[order.id]}
                      </div>
                    )}
                  </div>
                ) : (
                  <div style={{ background: 'var(--primary-light)', padding: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 18 }}>🚀</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
                      In Transit · Delivery in Progress
                    </span>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

