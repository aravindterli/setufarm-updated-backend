export type Role = 'farmer' | 'buyer' | 'driver';
export type Language = 'telugu' | 'hindi' | 'english';
export type OrderStatus =
  | 'pending'
  | 'confirmed'
  | 'ready_for_pickup'
  | 'in_transit'
  | 'delivered'
  | 'cancelled';
export type DeliveryType = 'gramfleet' | 'farmer' | 'self_pickup' | 'driver';

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string;
  role: Role;
  language: Language;
  // Farmer-specific
  village?: string;
  district?: string;
  state?: string;
  farm_size_acres?: number;
  aadhar_number?: string;
  lat?: number;
  lng?: number;
  // Driver-specific
  vehicle_type?: string;
  vehicle_number?: string;
  license_number?: string;
}

export interface Product {
  id: string;
  farmer_id: string;
  farmer_name?: string;
  crop_name: string;
  category?: string;
  price_per_kg: number;
  quantity_kg: number;
  available_kg?: number;
  description?: string;
  status: 'active' | 'sold_out' | 'draft';
  lat?: number;
  lng?: number;
  distance_km?: number;
  photos?: string[];
  created_at: string;
}

export interface Order {
  id: string;
  product_id: string;
  buyer_id: string;
  farmer_id: string;
  assigned_driver_id?: string;
  crop_name?: string;
  farmer_name?: string;
  buyer_name?: string;
  buyer_phone?: string;
  driver_name?: string;
  quantity_kg: number;
  price_per_kg: number;
  total_amount: number;
  delivery_charge?: number;
  delivery_type?: DeliveryType;
  status: OrderStatus;
  pickup_otp?: string;
  address_id?: string;
  delivery_address?: string;
  delivery_proof_url?: string;
  created_at: string;
  delivered_at?: string;
  farmer?: {
    id: string;
    name: string;
    phone?: string;
    village?: string;
    district?: string;
    rating?: number;
  };
  assigned_driver?: {
    id: string;
    name: string;
    phone: string;
    profile_photo?: string;
    vehicle_type?: string;
    vehicle_number?: string;
  };
}

export interface Address {
  id: string;
  user_id: string;
  label: string;
  address_line: string;
  village: string;
  district: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  is_default: boolean;
  created_at: string;
}

export interface DeliveryOption {
  type: DeliveryType;
  label: string;
  price: number;
  distance_km?: number;
  eta_minutes?: number;
  available: boolean;
  driver_id?: string;
  driver_name?: string;
}

export interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  vehicle_type: string;
  vehicle_number: string;
  rating: number;
  distance_km: number;
  lat?: number;
  lng?: number;
}

export interface FarmerDashboard {
  weekly_earnings: number;
  pending_orders: number;
  pending_payout: number;
  recent_orders: Array<{
    id: string;
    crop_name: string;
    crop_photo?: string;
    quantity_kg: number;
    status: OrderStatus;
    total_amount: number;
    created_at: string;
  }>;
}

export interface DriverDashboard {
  today_earnings: number;
  total_deliveries: number;
  pending_payout: number;
  incoming_requests: Array<{
    id: string;
    crop_name: string;
    farmer_name: string;
    quantity_kg: number;
    delivery_charge: number;
    created_at: string;
  }>;
  available_orders: Array<{
    id: string;
    crop_name: string;
    delivery_charge: number;
    distance_km: number;
  }>;
  my_active_orders: Array<{
    id: string;
    crop_name: string;
    status: OrderStatus;
    delivery_charge: number;
    created_at: string;
  }>;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface AuthResponse {
  access_token: string;
  user: User;
}
