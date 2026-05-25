import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import apiClient from '../../api/client';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import type { CartItem } from '../../types';

interface DeliveryOption {
  type: string;
  label: string;
  description: string;
  price: number;
  available: boolean;
  icon: string;
}

export default function DeliveryOptionsScreen() {
  const { id: productId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const cartItems: CartItem[] = location.state?.cartItems ?? [];
  const [selected, setSelected] = useState<string | null>(null);
  const [buyerLat, setBuyerLat] = useState(17.385);
  const [buyerLng, setBuyerLng] = useState(78.4867);

  useEffect(() => {
    navigator.geolocation?.getCurrentPosition(
      (pos) => { setBuyerLat(pos.coords.latitude); setBuyerLng(pos.coords.longitude); }
    );
  }, []);

  const { data: options, isLoading } = useQuery({
    queryKey: ['delivery-options', productId, buyerLat, buyerLng],
    queryFn: () =>
      apiClient
        .get(`/orders/delivery-options/${productId}?buyer_lat=${buyerLat}&buyer_lng=${buyerLng}`)
        .then((r) => r.data),
  });

  const ICONS: Record<string, string> = { gramfleet: '🚚', farmer: '👨‍🌾', self_pickup: '🚶' };

  // Build options from API or fallback
  const deliveryOptions: DeliveryOption[] = options?.options
    ? options.options.map((opt: any) => {
        const type = opt.type === 'driver' ? 'gramfleet' : opt.type;
        return {
          type,
          label: type === 'gramfleet' ? 'GramFleet Delivery' : type === 'farmer' ? 'Farmer Delivers' : 'Self Pickup',
          description:
            type === 'gramfleet' ? 'A GramFleet transport driver will collect and deliver to your address.' :
            type === 'farmer' ? 'The farmer will personally transport and deliver your crop order.' :
            'Travel to the farm and pickup your fresh harvest directly.',
          price: opt.charge ?? 0,
          available: opt.available ?? true,
          icon: ICONS[type] ?? '📦',
        };
      })
    : [
        { type: 'gramfleet', label: 'GramFleet Delivery', description: 'A GramFleet transport driver will collect and deliver to your address.', price: 49, available: true, icon: '🚚' },
        { type: 'farmer', label: 'Farmer Delivers', description: 'The farmer will personally transport and deliver your crop order.', price: 30, available: true, icon: '👨‍🌾' },
        { type: 'self_pickup', label: 'Self Pickup', description: 'Travel to the farm and pickup your fresh harvest directly. Free!', price: 0, available: true, icon: '🚶' },
      ];

  const handleContinue = () => {
    if (!selected) return;
    navigate('/buyer/checkout', {
      state: { cartItems, deliveryType: selected, productId },
    });
  };

  if (isLoading) return <LoadingSpinner />;

  return (
    <div style={{ maxWidth: 640, margin: '0 auto' }}>
      <button className="btn btn-secondary mb-24" onClick={() => navigate('/buyer/cart')}>← Back to Cart</button>

      <div className="page-header">
        <div className="page-title">Choose Delivery</div>
        <div className="page-subtitle">Select how you want your farm crops transported to your location</div>
      </div>

      <div className="delivery-options mb-24">
        {deliveryOptions.map((opt) => (
          <div
            key={opt.type}
            className={`delivery-option${selected === opt.type ? ' selected' : ''}${!opt.available ? ' disabled' : ''}`}
            onClick={() => opt.available && setSelected(opt.type)}
          >
            <div className="delivery-option-icon">{opt.icon}</div>
            <div className="delivery-option-info">
              <div className="delivery-option-label">{opt.label}</div>
              <div className="delivery-option-sub">{opt.description}</div>
              {!opt.available && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 6, fontWeight: 700 }}>⚠️ Not available for this delivery routing distance</div>}
            </div>
            <div className="delivery-option-price" style={{ minWidth: 80, textAlign: 'right' }}>
              {opt.price === 0 ? 'Free' : `₹${opt.price}`}
            </div>
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary btn-full btn-lg"
        disabled={!selected}
        onClick={handleContinue}
      >
        Continue to Checkout summary →
      </button>
    </div>
  );
}
