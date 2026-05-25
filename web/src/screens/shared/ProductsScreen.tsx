import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import '../../components/Commerce.css';
import logo from '../../assets/logo.png';

const DEFAULT_LAT = 17.3850;
const DEFAULT_LNG = 78.4867;
const API_BASE = import.meta.env.VITE_API_URL || 'https://setufarm-updated-backend-1.onrender.com/api/v1';

const CATEGORIES = [
  { label: 'all', icon: '🌾', value: '' },
  { label: 'vegetables', icon: '🥦', value: 'vegetables' },
  { label: 'fruits', icon: '🍎', value: 'fruits' },
  { label: 'grains', icon: '🌾', value: 'grains' },
  { label: 'pulses', icon: '🫘', value: 'pulses' },
  { label: 'spices', icon: '🌶️', value: 'spices' },
  { label: 'dairy', icon: '🥛', value: 'dairy' },
];

function SkeletonCard() {
  return (
    <div className="ske-card">
      <div className="ske ske-img" />
      <div className="ske-body">
        <div className="ske ske-h" />
        <div className="ske ske-s" />
        <div className="ske ske-f" />
        <div className="ske ske-b" />
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: any }) {
  const farmerName = product.farmer?.name || 'local farmer';
  const initial = farmerName.charAt(0).toUpperCase();
  const rating = product.farmer?.rating ?? 0;

  return (
    <div className="pcard">
      {/* image */}
      <div className="pcard-img-wrap">
        {product.photos?.length > 0 ? (
          <img src={product.photos[0]} alt={product.crop_name} loading="lazy" />
        ) : (
          <div className="pcard-no-img">
            <span>🌿</span>
            <p>no photo yet</p>
          </div>
        )}
        <span className="badge-fresh">fresh</span>
        <span className="badge-direct">🌱 farm direct</span>
      </div>

      {/* body */}
      <div className="pcard-body">
        <div className="pcard-name">{product.crop_name}</div>
        <div className="pcard-loc">
          <span>📍</span>
          <span>
            {product.village || 'nearby'}
            {product.district ? `, ${product.district}` : ''}
            {product.distance_km > 0 ? ` · ${product.distance_km.toFixed(1)} km` : ''}
          </span>
        </div>

        <div className="pcard-row">
          <div className="pcard-price">
            <span className="val">₹{product.price_per_kg}</span>
            <span className="unit">per kilogram</span>
          </div>
          <span className="pcard-qty">{product.quantity_kg} kg</span>
        </div>

        <div className="pcard-farmer">
          <div className="f-avatar">
            {product.farmer?.profile_photo
              ? <img src={product.farmer.profile_photo} alt={farmerName} />
              : initial
            }
          </div>
          <div className="f-info">
            <div className="f-name">{farmerName}</div>
            <div className="f-rating">⭐ {rating > 0 ? rating.toFixed(1) : 'new farmer'}</div>
          </div>
        </div>

        <button className="btn-cart">
          <span>🛒</span> add to cart
        </button>
      </div>
    </div>
  );
}

export default function ProductsScreen() {
  const [location, setLocation] = useState({ lat: DEFAULT_LAT, lng: DEFAULT_LNG });
  const [category, setCategory] = useState('');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('distance');

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => { }
    );
  }, []);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['products', location.lat, location.lng, category],
    queryFn: async () => {
      const p = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        radius_km: '50',
        ...(category ? { crop_type: category } : {}),
      });
      const res = await fetch(`${API_BASE}/products/nearby?${p}`);
      if (!res.ok) throw new Error('failed to fetch');
      return res.json();
    },
  });

  const products: any[] = (data?.products ?? [])
    .filter((p: any) =>
      !search.trim() ||
      p.crop_name.toLowerCase().includes(search.toLowerCase()) ||
      p.village?.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a: any, b: any) => {
      if (sort === 'price_asc') return a.price_per_kg - b.price_per_kg;
      if (sort === 'price_desc') return b.price_per_kg - a.price_per_kg;
      return (a.distance_km || 0) - (b.distance_km || 0);
    });

  return (
    <>
      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav className="navbar">
        <div className="navbar-inner">
          <Link to="/" className="navbar-logo" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src={logo} alt="SetuFarm Logo" style={{ height: '36px', width: 'auto', objectFit: 'contain' }} />
          </Link>

          <div className="navbar-search">
            <span className="search-ico">🔍</span>
            <input
              id="search-input"
              type="text"
              placeholder="search crops, vegetables, fruits…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="navbar-end">
            <button className="nav-chip">📍 detect location</button>
            <div className="nav-divider" />
            <Link to="/login"><button className="btn-nav-login">login</button></Link>
            <Link to="/role-selection"><button className="btn-nav-cta">get started →</button></Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-inner">
          <div className="hero-eyebrow">🌱 100% farm to table</div>
          <h1 className="hero-title">
            fresh produce,<br /><em>straight from the farm</em>
          </h1>
          <p className="hero-sub">
            buy directly from local farmers with zero middlemen.
            better prices, fresher produce, delivered to your doorstep.
          </p>
          <div className="hero-pills">
            <span className="hero-pill">✅ verified farmers</span>
            <span className="hero-pill">🚚 same-day delivery</span>
            <span className="hero-pill">💰 lowest prices</span>
            <span className="hero-pill">🌿 organic options</span>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <span className="stat-val">500<span>+</span></span>
              <span className="stat-lbl">local farmers</span>
            </div>
            <div className="hero-stat">
              <span className="stat-val">1.2<span>k+</span></span>
              <span className="stat-lbl">products listed</span>
            </div>
            <div className="hero-stat">
              <span className="stat-val">50<span>km</span></span>
              <span className="stat-lbl">delivery radius</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Category Bar ───────────────────────────────────── */}
      <div className="cat-bar">
        <div className="cat-list">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.value}
              className={`cat-btn ${category === cat.value ? 'active' : ''}`}
              onClick={() => setCategory(cat.value)}
            >
              <span>{cat.icon}</span>{cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Products ───────────────────────────────────────── */}
      <main className="content-wrap">
        <div className="toolbar">
          <div className="toolbar-left">
            <span className="toolbar-title">available products</span>
            {!isLoading && (
              <span className="toolbar-count">{products.length} results</span>
            )}
          </div>
          <select
            id="sort-select"
            className="sort-box"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="distance">nearest first</option>
            <option value="price_asc">price: low → high</option>
            <option value="price_desc">price: high → low</option>
          </select>
        </div>

        <div className="product-grid">
          {isLoading && Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}

          {isError && (
            <div className="state-box">
              <div className="state-icon">⚠️</div>
              <div className="state-title">could not load products</div>
              <div className="state-desc">please check your backend connection and try again.</div>
            </div>
          )}

          {!isLoading && !isError && products.length === 0 && (
            <div className="state-box">
              <div className="state-icon">🌿</div>
              <div className="state-title">no products found</div>
              <div className="state-desc">try a different category or clear your search.</div>
            </div>
          )}

          {!isLoading && products.map((p: any) => <ProductCard key={p.id} product={p} />)}
        </div>
      </main>

      {/* ── Footer ────────────────────────────────────────── */}
      <footer className="footer">
        <div className="footer-logo" style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          <img src={logo} alt="SetuFarm Logo" style={{ height: '28px', width: 'auto', objectFit: 'contain', opacity: 0.75 }} />
        </div>
        <p className="footer-tagline">connecting farmers directly with buyers · © 2026 setufarm</p>
      </footer>
    </>
  );
}
