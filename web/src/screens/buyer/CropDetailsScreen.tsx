import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/cartStore';
import type { Product } from '../../types';

export default function CropDetailsScreen() {
  useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { addItem, items } = useCartStore();

  const product: Product | undefined = location.state?.product;
  const [qty, setQty] = useState(1);

  const getCategoryEmoji = (catName?: string) => {
    const list = [
      { name: 'Vegetables', emoji: '🥦' },
      { name: 'Fruits', emoji: '🍎' },
      { name: 'Grains', emoji: '🌾' },
      { name: 'Pulses', emoji: '🫘' },
      { name: 'Spices', emoji: '🌶️' },
      { name: 'Leafy Greens', emoji: '🥬' },
      { name: 'Oilseeds', emoji: '🌻' }
    ];
    const found = list.find((c) => c.name === catName);
    return found ? found.emoji : '🌾';
  };

  if (!product) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Crops listing not found.</p>
        <button className="btn btn-secondary mt-16" onClick={() => navigate('/buyer')}>← Back to Marketplace</button>
      </div>
    );
  }

  const inCart = items.find((i) => i.product.id === product.id);

  const handleAddToCart = () => {
    addItem(product, qty);
    navigate('/buyer/cart');
  };

  const handleBuyNow = () => {
    addItem(product, qty);
    navigate('/buyer/cart');
  };

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <button className="btn btn-secondary mb-24" onClick={() => navigate('/buyer')}>
        ← Back to Marketplace
      </button>
      
      <div className="grid-2col">
        {/* Left Column: Image and Description */}
        <div>
          {product.photos && product.photos.length > 0 ? (
            <div style={{ marginBottom: 24, position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
              <div className="delivery-tag" style={{ zIndex: 1 }}>⚡ 30 MIN DISPATCH</div>
              <img
                className="crop-detail-img"
                src={product.photos[0]}
                alt={product.crop_name}
                style={{ width: '100%', height: '320px', objectFit: 'cover', borderRadius: '16px', display: 'block', border: '1px solid var(--border-light)' }}
              />
            </div>
          ) : (
            <div className="crop-detail-img-placeholder" style={{ marginBottom: 24, position: 'relative', borderRadius: '16px', overflow: 'hidden' }}>
              <div className="delivery-tag">⚡ 30 MIN DISPATCH</div>
              {getCategoryEmoji(product.category)}
            </div>
          )}
          
          <div className="card">
            <div className="card-header">
              <div className="card-title">Crop Description</div>
            </div>
            {product.description ? (
              <p style={{ fontSize: 15, lineHeight: 1.7, color: 'var(--text)' }}>
                {product.description}
              </p>
            ) : (
              <p style={{ fontSize: 14, color: 'var(--text-muted)', fontStyle: 'italic' }}>
                No additional description provided by the farmer.
              </p>
            )}
          </div>
        </div>

        {/* Right Column: Checkout Action Ledger */}
        <div>
          <div className="card card-primary mb-24">
            <div className="flex-between" style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 24, fontWeight: 900, textTransform: 'uppercase' }}>{product.crop_name}</div>
            </div>
            
            <div style={{ display: 'inline-block', background: 'var(--primary-light)', color: 'var(--primary)', fontSize: 12, fontWeight: 800, padding: '4px 12px', border: '2px solid var(--border)', textTransform: 'uppercase', marginBottom: 16 }}>
              {product.category}
            </div>

            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--primary)', margin: '8px 0 16px', lineHeight: 1 }}>
              ₹{product.price_per_kg}/kg
            </div>

            <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-light)', borderTop: '2px solid var(--border-light)', paddingTop: '12px', marginBottom: 16 }}>
              👨‍🌾 Farmer: <strong style={{ color: 'var(--text)' }}>{product.farmer_name ?? 'Local Farmer'}</strong>
            </div>

            <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>
              📦 Available Stock: <strong style={{ color: 'var(--text)' }}>{product.quantity_kg} kg</strong>
              {product.distance_km != null && ` · 📍 ${product.distance_km.toFixed(1)} km away`}
            </div>
          </div>

          {/* Sticky quantitative purchase card */}
          <div className="card">
            <div className="card-title" style={{ fontSize: 16, marginBottom: 16 }}>Configure Order Quantity</div>
            
            <div className="form-group" style={{ marginBottom: 20 }}>
              <label className="form-label" style={{ marginBottom: 8 }}>Quantity (kg)</label>
              <div className="qty-control" style={{ display: 'inline-flex' }}>
                <button className="qty-btn" type="button" onClick={() => setQty(Math.max(1, qty - 1))}>−</button>
                <span className="qty-value">{qty}</span>
                <button className="qty-btn" type="button" onClick={() => setQty(Math.min(product.quantity_kg, qty + 1))}>+</button>
              </div>
            </div>
            
            <div className="flex-between" style={{ padding: '12px 0', borderTop: '2px dashed var(--border-light)', borderBottom: '2px dashed var(--border-light)', marginBottom: 20 }}>
              <span style={{ fontWeight: 800, textTransform: 'uppercase', fontSize: 13, color: 'var(--text-muted)' }}>Estimated Subtotal</span>
              <span className="cart-total" style={{ fontSize: 24, fontWeight: 900 }}>₹{(product.price_per_kg * qty).toLocaleString('en-IN')}</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <button className="btn btn-secondary" onClick={handleAddToCart}>
                {inCart ? '✓ In Cart' : '🛒 Add to Cart'}
              </button>
              <button className="btn btn-primary" onClick={handleBuyNow}>
                ⚡ Buy Now
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
