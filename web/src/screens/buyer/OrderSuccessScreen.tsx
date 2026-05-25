import { useNavigate, useLocation } from 'react-router-dom';

export default function OrderSuccessScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { orderId: string; total: number } | null;

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">✅</div>
        <div className="success-title">Order Placed!</div>
        <div className="success-desc">
          Your order has been placed successfully. The farmer will confirm it shortly.
        </div>
        {state?.orderId && (
          <div style={{
            background: 'var(--bg)', border: '1px solid var(--border)', padding: 14,
            marginBottom: 24, fontFamily: 'monospace', fontSize: 13
          }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: 4 }}>Order ID</div>
            <div style={{ fontWeight: 700 }}>{state.orderId}</div>
          </div>
        )}
        {state?.total && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Amount</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--primary)' }}>
              ₹{state.total.toLocaleString('en-IN')}
            </div>
          </div>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {state?.orderId && (
            <button className="btn btn-secondary" onClick={() => navigate(`/buyer/orders/${state.orderId}`)}>
              Track Order
            </button>
          )}
          <button className="btn btn-primary" onClick={() => navigate('/buyer')}>
            Continue Shopping
          </button>
        </div>
      </div>
    </div>
  );
}
