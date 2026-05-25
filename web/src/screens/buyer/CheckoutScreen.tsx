import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import type { CartItem, Address } from '../../types';
import { useCartStore } from '../../store/cartStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';

export default function CheckoutScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as { cartItems: CartItem[]; deliveryType: string; productId: string } | null;
  const cartItems = state?.cartItems ?? [];
  const deliveryType = state?.deliveryType ?? 'self_pickup';
  const { clearCart } = useCartStore();
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const { data: addresses = [], isLoading: loadingAddresses } = useQuery<Address[]>({
    queryKey: ['addresses'],
    queryFn: () => apiClient.get('/addresses/').then((r) => r.data),
  });

  const subtotal = cartItems.reduce((s, i) => s + i.product.price_per_kg * i.quantity, 0);
  const deliveryFee = deliveryType === 'self_pickup' ? 0 : deliveryType === 'farmer' ? 30 : 49;
  const total = subtotal + deliveryFee;

  const handlePlaceOrder = async () => {
    if (!selectedAddressId && deliveryType !== 'self_pickup') {
      setError('Please select a delivery address.'); return;
    }
    setPlacing(true); setError('');
    try {
      const orderedIds: string[] = [];
      for (const item of cartItems) {
        // 1. Create the draft order
        const { data } = await apiClient.post('/orders', {
          product_id: item.product.id,
          quantity_kg: item.quantity,
          address_id: selectedAddressId,
        });

        // 2. Select delivery option (map 'gramfleet' to 'driver' for backend constraint compatibility)
        const dbDeliveryType = deliveryType === 'gramfleet' ? 'driver' : deliveryType;
        await apiClient.post(`/orders/${data.id}/select-delivery`, {
          type: dbDeliveryType,
          charge: deliveryFee,
        });

        // 3. Confirm and update status to pending
        await apiClient.patch(`/orders/${data.id}/status?status=pending`);

        orderedIds.push(data.id);
      }
      clearCart();
      navigate('/buyer/order-success', {
        replace: true,
        state: { orderId: orderedIds[0], total },
      });
    } catch (err: any) {
      setError(err?.response?.data?.detail ?? 'Failed to place order. Please try again.');
    } finally {
      setPlacing(false);
    }
  };

  if (loadingAddresses) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <button className="btn btn-secondary mb-24" onClick={() => navigate(-1)}>← Back</button>

      <div className="page-header">
        <div className="page-title">Checkout Summary</div>
        <div className="page-subtitle">Review your agricultural order ledger and address credentials</div>
      </div>

      <div className="grid-2col">
        <div>
          {/* Delivery Address */}
          {deliveryType !== 'self_pickup' && (
            <div className="card mb-24">
              <div className="card-header" style={{ marginBottom: 16, paddingBottom: 10 }}>
                <div className="card-title">Select Delivery Address</div>
                <button className="btn btn-secondary btn-sm" onClick={() => navigate('/buyer/addresses')}>
                  Manage Addresses
                </button>
              </div>
              {!addresses.length ? (
                <div style={{ padding: '12px 0' }}>
                  <p className="fs-13 text-muted mb-12" style={{ fontWeight: 600 }}>No saved addresses found in your account.</p>
                  <button className="btn btn-primary btn-sm" onClick={() => navigate('/buyer/addresses')}>
                    ➕ Add Delivery Address
                  </button>
                </div>
              ) : (
                addresses.map((addr) => (
                  <div
                    key={addr.id}
                    style={{
                      border: `2px solid ${selectedAddressId === addr.id ? 'var(--primary)' : 'var(--border)'}`,
                      padding: 16,
                      marginBottom: 12,
                      cursor: 'pointer',
                      background: selectedAddressId === addr.id ? 'var(--primary-light)' : 'var(--white)',
                      boxShadow: selectedAddressId === addr.id ? 'var(--shadow-press)' : 'var(--shadow-flat-sm)',
                    }}
                    onClick={() => setSelectedAddressId(addr.id)}
                  >
                    <div style={{ fontWeight: 800, marginBottom: 6, display: 'flex', alignItems: 'center', justifyContent: 'between' }}>
                      <span style={{ textTransform: 'uppercase', fontSize: 13, letterSpacing: '0.5px' }}>📍 {addr.label}</span>
                      {addr.is_default && <span className="badge badge-active" style={{ fontSize: 9, marginLeft: 8, padding: '2px 6px' }}>Default</span>}
                    </div>
                    <div className="fs-13 text-muted" style={{ fontWeight: 500, lineHeight: 1.4 }}>
                      {addr.address_line}, {addr.village}, {addr.district}, {addr.state} - <strong style={{ color: 'var(--text)' }}>{addr.pincode}</strong>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Items */}
          <div className="card mb-24">
            <div className="card-header" style={{ marginBottom: 16, paddingBottom: 10 }}>
              <div className="card-title">Order Produce Items</div>
            </div>
            {cartItems.map((item) => (
              <div key={item.product.id} className="flex-between mb-16 fs-14" style={{ borderBottom: '2px solid var(--border-light)', paddingBottom: '12px' }}>
                <div>
                  <div style={{ fontWeight: 800, textTransform: 'uppercase' }}>{item.product.crop_name}</div>
                  <div className="text-muted fs-12" style={{ fontWeight: 600, marginTop: 2 }}>{item.quantity} kg × ₹{item.product.price_per_kg}/kg</div>
                </div>
                <div style={{ fontWeight: 900, fontSize: 16 }}>₹{(item.product.price_per_kg * item.quantity).toLocaleString('en-IN')}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Price Summary */}
        <div>
          <div className="card card-primary mb-24">
            <div className="card-title" style={{ fontSize: 16, marginBottom: 16 }}>Price ledger Details</div>
            
            <div className="flex-between mb-12 fs-14" style={{ fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Crops Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex-between mb-12 fs-14" style={{ fontWeight: 600 }}>
              <span style={{ color: 'var(--text-muted)' }}>Transport Charge ({deliveryType?.replace(/_/g, ' ')})</span>
              <span style={{ color: 'var(--info)' }}>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
            </div>
            
            <hr className="section-divider" style={{ margin: '14px 0' }} />
            
            <div className="flex-between mb-20">
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 14 }}>Grand total</span>
              <span style={{ fontSize: 26, fontWeight: 900, color: 'var(--primary)' }}>
                ₹{total.toLocaleString('en-IN')}
              </span>
            </div>

            <div style={{ background: 'var(--bg)', border: '2px solid var(--border)', padding: 16, marginBottom: 20 }}>
              <div style={{ fontWeight: 800, marginBottom: 6, textTransform: 'uppercase', fontSize: 12, color: 'var(--primary)', letterSpacing: '0.5px' }}>💳 SECURE CHECKOUT</div>
              <p className="text-muted" style={{ fontSize: 12, fontWeight: 600, lineHeight: 1.4 }}>
                SetuFarm runs mock payments for safety. Click below to instantly pay and generate farm dispatch requests.
              </p>
            </div>

            {error && <div style={{ color: 'var(--danger)', fontSize: 13, marginBottom: 16, fontWeight: 700 }}>{error}</div>}
            
            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={handlePlaceOrder}
              disabled={placing}
            >
              {placing ? 'Placing Order…' : `⚡ Confirm & Pay · ₹${total.toLocaleString('en-IN')}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
