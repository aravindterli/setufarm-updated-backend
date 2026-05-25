import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';

// Layouts
import FarmerLayout from './components/layout/FarmerLayout';
import BuyerLayout from './components/layout/BuyerLayout';
import DriverLayout from './components/layout/DriverLayout';

// Shared
import LandingScreen from './screens/shared/LandingScreen';
import RoleSelectionScreen from './screens/shared/RoleSelectionScreen';
import LoginScreen from './screens/shared/LoginScreen';
import ProfileScreen from './screens/shared/ProfileScreen';

// Registration
import FarmerRegistrationScreen from './screens/farmer/FarmerRegistrationScreen';
import BuyerRegistrationScreen from './screens/buyer/BuyerRegistrationScreen';
import DriverRegistrationScreen from './screens/driver/DriverRegistrationScreen';

// Farmer
import FarmerDashboard from './screens/farmer/FarmerDashboard';
import MyCropsScreen from './screens/farmer/MyCropsScreen';
import ListCropScreen from './screens/farmer/ListCropScreen';
import FarmerOrdersScreen from './screens/farmer/FarmerOrdersScreen';
import FarmerOrderDetailsScreen from './screens/farmer/FarmerOrderDetailsScreen';

// Buyer
import BuyerHomeScreen from './screens/buyer/BuyerHomeScreen';
import CropDetailsScreen from './screens/buyer/CropDetailsScreen';
import CartScreen from './screens/buyer/CartScreen';
import DeliveryOptionsScreen from './screens/buyer/DeliveryOptionsScreen';
import CheckoutScreen from './screens/buyer/CheckoutScreen';
import OrderSuccessScreen from './screens/buyer/OrderSuccessScreen';
import BuyerOrdersScreen from './screens/buyer/BuyerOrdersScreen';
import OrderTrackingScreen from './screens/buyer/OrderTrackingScreen';
import AddressesScreen from './screens/buyer/AddressesScreen';

// Driver
import DriverDashboard from './screens/driver/DriverDashboard';
import DriverRequestsScreen from './screens/driver/DriverRequestsScreen';
import DriverOrderDetailsScreen from './screens/driver/DriverOrderDetailsScreen';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 10000 },
  },
});

// Protected route wrapper
function RequireAuth({ children, role }: { children: React.ReactNode; role?: string }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (!user.name) return <Navigate to={`/register/${user.role}`} replace />;
  if (role && user.role !== role) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

// RequireAuthNoProfile — for registration screens
function RequireAuthNoProfile({ children }: { children: React.ReactNode }) {
  const { user, token } = useAuthStore();
  if (!token || !user) return <Navigate to="/login" replace />;
  if (user.name) return <Navigate to={`/${user.role}`} replace />;
  return <>{children}</>;
}

function App() {
  const { loadAuth } = useAuthStore();
  useEffect(() => { loadAuth(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public */}
          <Route path="/" element={<LandingScreen />} />
          <Route path="/role-selection" element={<RoleSelectionScreen />} />
          <Route path="/login" element={<LoginScreen />} />

          {/* Registration (auth required but no profile yet) */}
          <Route path="/register/farmer" element={<RequireAuthNoProfile><FarmerRegistrationScreen /></RequireAuthNoProfile>} />
          <Route path="/register/buyer"  element={<RequireAuthNoProfile><BuyerRegistrationScreen /></RequireAuthNoProfile>} />
          <Route path="/register/driver" element={<RequireAuthNoProfile><DriverRegistrationScreen /></RequireAuthNoProfile>} />

          {/* Farmer Portal */}
          <Route path="/farmer" element={<RequireAuth role="farmer"><FarmerLayout><FarmerDashboard /></FarmerLayout></RequireAuth>} />
          <Route path="/farmer/crops" element={<RequireAuth role="farmer"><FarmerLayout><MyCropsScreen /></FarmerLayout></RequireAuth>} />
          <Route path="/farmer/crops/new" element={<RequireAuth role="farmer"><FarmerLayout><ListCropScreen /></FarmerLayout></RequireAuth>} />
          <Route path="/farmer/orders" element={<RequireAuth role="farmer"><FarmerLayout><FarmerOrdersScreen /></FarmerLayout></RequireAuth>} />
          <Route path="/farmer/orders/:id" element={<RequireAuth role="farmer"><FarmerLayout><FarmerOrderDetailsScreen /></FarmerLayout></RequireAuth>} />
          <Route path="/farmer/profile" element={<RequireAuth role="farmer"><FarmerLayout><ProfileScreen /></FarmerLayout></RequireAuth>} />

          {/* Buyer Portal */}
          <Route path="/buyer" element={<RequireAuth role="buyer"><BuyerLayout><BuyerHomeScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/product/:id" element={<RequireAuth role="buyer"><BuyerLayout><CropDetailsScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/cart" element={<RequireAuth role="buyer"><BuyerLayout><CartScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/delivery/:id" element={<RequireAuth role="buyer"><BuyerLayout><DeliveryOptionsScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/checkout" element={<RequireAuth role="buyer"><BuyerLayout><CheckoutScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/order-success" element={<RequireAuth role="buyer"><OrderSuccessScreen /></RequireAuth>} />
          <Route path="/buyer/orders" element={<RequireAuth role="buyer"><BuyerLayout><BuyerOrdersScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/orders/:id" element={<RequireAuth role="buyer"><BuyerLayout><OrderTrackingScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/addresses" element={<RequireAuth role="buyer"><BuyerLayout><AddressesScreen /></BuyerLayout></RequireAuth>} />
          <Route path="/buyer/profile" element={<RequireAuth role="buyer"><BuyerLayout><ProfileScreen /></BuyerLayout></RequireAuth>} />

          {/* Driver Portal */}
          <Route path="/driver" element={<RequireAuth role="driver"><DriverLayout><DriverDashboard /></DriverLayout></RequireAuth>} />
          <Route path="/driver/requests" element={<RequireAuth role="driver"><DriverLayout><DriverRequestsScreen /></DriverLayout></RequireAuth>} />
          <Route path="/driver/orders/:id" element={<RequireAuth role="driver"><DriverLayout><DriverOrderDetailsScreen /></DriverLayout></RequireAuth>} />
          <Route path="/driver/profile" element={<RequireAuth role="driver"><DriverLayout><ProfileScreen /></DriverLayout></RequireAuth>} />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
