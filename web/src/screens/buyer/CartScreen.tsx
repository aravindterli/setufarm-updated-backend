import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import EmptyState from '../../components/ui/EmptyState';

export default function CartScreen() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, total } = useCartStore();

  if (!items.length) {
    return (
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div className="page-header">
          <div className="page-title">Your Cart</div>
        </div>
        <EmptyState
          icon="🛒"
          title="Your shopping cart is empty"
          description="Browse agricultural fresh crops from local farms to add items to your cart."
          action={
            <button className="btn btn-primary btn-lg" onClick={() => navigate('/buyer')}>
              🛒 Browse Marketplace
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div className="page-header flex-between">
        <div>
          <div className="page-title">Your Shopping Cart</div>
          <div className="page-subtitle">Configure quantities before selecting delivery options</div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => navigate('/buyer')}>
          ➕ Add More Crops
        </button>
      </div>

      <div className="grid-2col">
        {/* Left Column: Cart items */}
        <div>
          {items.map((item) => (
            <div key={item.product.id} className="cart-item" style={{ flexDirection: 'column', alignItems: 'stretch', gap: 16 }}>
              <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ width: 60, height: 60, background: 'var(--primary-light)', border: '2px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>
                  🌾
                </div>
                <div className="cart-item-info">
                  <div className="cart-item-name" style={{ fontWeight: 800 }}>{item.product.crop_name}</div>
                  <div className="cart-item-price" style={{ fontWeight: 600, color: 'var(--text-muted)' }}>
                    ₹{item.product.price_per_kg}/kg · <span style={{ textTransform: 'uppercase', fontSize: 11, color: 'var(--primary)' }}>{item.product.farmer_name ?? 'Local Farm'}</span>
                  </div>
                </div>
              </div>

              <div className="flex-between" style={{ borderTop: '2px solid var(--border-light)', paddingTop: '12px' }}>
                <div className="qty-control">
                  <button type="button" className="qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity - 1)}>−</button>
                  <span className="qty-value">{item.quantity}</span>
                  <button type="button" className="qty-btn" onClick={() => updateQuantity(item.product.id, item.quantity + 1)}>+</button>
                </div>
                
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600 }}>Subtotal</div>
                  <div style={{ fontWeight: 900, color: 'var(--primary)', fontSize: 18 }}>
                    ₹{(item.product.price_per_kg * item.quantity).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '2px solid var(--border-light)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={() => removeItem(item.product.id)}
                  style={{ padding: '4px 12px', fontSize: 12 }}
                >
                  ❌ Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Right Column: Ledger Summary */}
        <div>
          <div className="card card-primary">
            <div className="card-title" style={{ fontSize: 16, marginBottom: 16 }}>Purchase Summary</div>
            
            {items.map((item) => (
              <div key={item.product.id} className="flex-between mb-12 fs-14" style={{ fontWeight: 600 }}>
                <span style={{ textTransform: 'uppercase' }}>{item.product.crop_name} ({item.quantity}kg)</span>
                <span>₹{(item.product.price_per_kg * item.quantity).toLocaleString('en-IN')}</span>
              </div>
            ))}
            
            <hr className="section-divider" style={{ margin: '16px 0' }} />
            
            <div className="flex-between" style={{ marginBottom: 20 }}>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 14 }}>Subtotal amount</span>
              <span className="cart-total" style={{ fontSize: 24, fontWeight: 900 }}>₹{total().toLocaleString('en-IN')}</span>
            </div>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20, fontWeight: 600, lineHeight: 1.4 }}>
              * Logistical transport rates & ETA options will be calculated in the next step based on farm-to-buyer distances.
            </p>

            <button
              className="btn btn-primary btn-full btn-lg"
              onClick={() => navigate(`/buyer/delivery/${items[0].product.id}`, { state: { cartItems: items } })}
            >
              🚚 Choose Delivery Method →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
