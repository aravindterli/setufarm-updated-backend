import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../api/client';
import type { Product } from '../../types';
import { useCartStore } from '../../store/cartStore';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import EmptyState from '../../components/ui/EmptyState';

const CATEGORIES = [
  { name: 'All', emoji: '🌾' },
  { name: 'Vegetables', emoji: '🥦' },
  { name: 'Fruits', emoji: '🍎' },
  { name: 'Grains', emoji: '🌾' },
  { name: 'Pulses', emoji: '🫘' },
  { name: 'Spices', emoji: '🌶️' },
  { name: 'Leafy Greens', emoji: '🥬' },
  { name: 'Oilseeds', emoji: '🌻' }
];

const getCategoryEmoji = (catName?: string) => {
  const found = CATEGORIES.find((c) => c.name === catName);
  return found ? found.emoji : '🌾';
};

export default function BuyerHomeScreen() {
  const navigate = useNavigate();
  const { items, addItem, updateQuantity, total, itemCount, searchQuery } = useCartStore();
  const [category, setCategory] = useState('All');
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => console.warn('Could not get location. Showing all available crops.')
    );
  }, []);

  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['nearby-products', location, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (location) {
        params.set('lat', String(location.lat));
        params.set('lng', String(location.lng));
        params.set('radius_km', '50');
      } else {
        params.set('lat', '17.3850');
        params.set('lng', '78.4867');
        params.set('radius_km', '500');
      }
      if (category !== 'All') params.set('crop_type', category);
      return apiClient.get(`/products/nearby?${params.toString()}`).then((r) => r.data);
    },
  });

  const filtered = (data?.products ?? []).filter((p) =>
    searchQuery ? p.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) : true
  );

  const cartTotalAmount = total();
  const cartItemCount = itemCount();

  // Group products by category when 'All' is selected
  const getGroupedProducts = () => {
    const groups: { [key: string]: Product[] } = {};
    filtered.forEach((product) => {
      const cat = (product.category && CATEGORIES.some((c) => c.name === product.category)) ? product.category : 'Grains';
      if (!groups[cat]) {
        groups[cat] = [];
      }
      groups[cat].push(product);
    });
    return groups;
  };

  const renderProductCard = (product: Product) => {
    const cartItem = items.find((i) => i.product.id === product.id);
    return (
      <div
        key={product.id}
        className="product-card"
        style={{
          position: 'relative',
          background: 'var(--white)',
          border: '1px solid var(--border-light)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '16px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
          transition: 'all 0.15s'
        }}
      >
        {/* Speed tag overlay removed to keep card minimal, using card-speed-info below instead */}
        <div
          className="product-card-img-placeholder"
          onClick={() => navigate(`/buyer/product/${product.id}`, { state: { product } })}
          style={{
            height: '140px',
            background: 'var(--bg)',
            border: '1px solid var(--border-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '32px',
            cursor: 'pointer',
            borderRadius: '12px',
            overflow: 'hidden'
          }}
        >
          {product.photos && product.photos.length > 0 ? (
            <img
              src={product.photos[0]}
              alt={product.crop_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            getCategoryEmoji(product.category)
          )}
        </div>

        <div className="card-speed-info" style={{ marginTop: '12px' }}>
          <span>⏰ 8 MINS</span>
        </div>

        <div
          className="product-card-name"
          onClick={() => navigate(`/buyer/product/${product.id}`, { state: { product } })}
          style={{
            cursor: 'pointer',
            fontWeight: 800,
            fontSize: '14px',
            color: 'var(--text)',
            marginTop: '6px',
            minHeight: '38px',
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical'
          }}
        >
          {product.crop_name}
        </div>

        {product.farmer_name && (
          <div className="product-card-farmer" style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, marginTop: '2px' }}>
            by {product.farmer_name}
          </div>
        )}

        <div className="product-card-meta" style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1px solid var(--border-light)', marginTop: '8px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>{product.quantity_kg} kg avail.</span>
          {product.distance_km != null && (
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary)' }}>📍 {product.distance_km.toFixed(1)} km</span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '10px' }}>
          <span className="product-card-price" style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text)' }}>
            ₹{product.price_per_kg}/kg
          </span>

          <div style={{ width: '85px', height: '36px', display: 'flex', alignItems: 'center' }}>
            {cartItem ? (
              <div className="inline-qty-control" style={{ height: '34px' }}>
                <button
                  type="button"
                  className="inline-qty-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(product.id, cartItem.quantity - 1);
                  }}
                  style={{ padding: '0 8px' }}
                >
                  −
                </button>
                <span className="inline-qty-val">{cartItem.quantity}</span>
                <button
                  type="button"
                  className="inline-qty-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    updateQuantity(product.id, cartItem.quantity + 1);
                  }}
                  style={{ padding: '0 8px' }}
                >
                  +
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="btn-quick-add"
                onClick={(e) => {
                  e.stopPropagation();
                  addItem(product, 1);
                }}
                style={{ height: '34px', fontSize: '12px' }}
              >
                ADD
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const grouped = getGroupedProducts();

  return (
    <div style={{ paddingBottom: cartItemCount > 0 ? 80 : 0 }}>
      {/* Category selector row */}
      <div className="visual-category-grid" style={{ marginBottom: '24px', gridTemplateColumns: 'repeat(8, 1fr)', gap: '12px' }}>
        {CATEGORIES.map((c) => (
          <div
            key={c.name}
            className={`visual-category-box${category === c.name ? ' active' : ''}`}
            onClick={() => setCategory(c.name)}
            style={{
              border: category === c.name ? '2px solid var(--primary)' : '1px solid var(--border-light)',
              borderRadius: '12px',
              background: category === c.name ? 'var(--primary-light)' : 'var(--white)',
              padding: '12px 6px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: 'none',
              transition: 'all 0.15s'
            }}
          >
            <span className="visual-category-icon" style={{ fontSize: '24px', marginBottom: '4px' }}>{c.emoji}</span>
            <span className="visual-category-label" style={{ fontSize: '11px', fontWeight: 800, textTransform: 'uppercase', color: category === c.name ? 'var(--primary)' : 'var(--text)' }}>
              {c.name}
            </span>
          </div>
        ))}
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : !filtered.length ? (
        <EmptyState
          icon="🌾"
          title="No crops listed in this category"
          description="We couldn't find any listings matching your filters. Try picking a different crop group or search query."
        />
      ) : (
        <div>
          {category === 'All' ? (
            // Grouped Category Rows
            CATEGORIES.filter((c) => c.name !== 'All').map((cat) => {
              const products = grouped[cat.name] || [];
              if (products.length === 0) return null;

              return (
                <div key={cat.name} style={{ marginBottom: '32px' }}>
                  <div className="home-section-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                    <div className="home-section-title" style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text)' }}>
                      {cat.emoji} {cat.name}
                    </div>
                    <div
                      className="home-section-see-all"
                      onClick={() => setCategory(cat.name)}
                      style={{ fontSize: '12px', fontWeight: 800, color: 'var(--primary)', cursor: 'pointer' }}
                    >
                      see all
                    </div>
                  </div>

                  <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                    {products.slice(0, 4).map(renderProductCard)}
                  </div>
                </div>
              );
            })
          ) : (
            // Single Category Grid
            <div>
              <div className="home-section-header" style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                <div className="home-section-title" style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text)' }}>
                  {category}
                </div>
              </div>

              <div className="product-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px' }}>
                {filtered.map(renderProductCard)}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Persistent Floating Bottom Cart Bar */}
      {cartItemCount > 0 && (
        <div
          className="floating-cart-bar"
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '1000px',
            background: 'var(--primary)',
            color: 'var(--white)',
            padding: '16px 24px',
            border: '2px solid var(--primary)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            zIndex: 999,
            borderRadius: '16px',
            boxShadow: '0 8px 30px rgba(12,131,31,0.2)'
          }}
        >
          <div className="floating-cart-text" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '15px', fontWeight: 700 }}>
            <span>🛍️ {cartItemCount} Item{cartItemCount > 1 ? 's' : ''}</span>
            <span style={{ opacity: 0.6 }}>|</span>
            <span>₹{cartTotalAmount.toLocaleString('en-IN')}</span>
          </div>
          <button
            className="floating-cart-btn"
            onClick={() => navigate('/buyer/cart')}
            style={{
              background: 'var(--white)',
              color: 'var(--primary)',
              padding: '10px 20px',
              fontWeight: 800,
              fontSize: '13px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              border: 'none',
              borderRadius: '8px',
              boxShadow: 'none',
              transition: 'all 0.15s'
            }}
          >
            View Cart 🛒 →
          </button>
        </div>
      )}
    </div>
  );
}
