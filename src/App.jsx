import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/admin/Sidebar";
import StaffElPage from "./pages/StaffElPage";
import OrdersElPage from "./pages/OrdersElPage";
import LogisticsStatsPage from "./pages/LogisticsStatsPage";
import PlacesStatsPage from "./pages/PlacesStatsPage";
import StaffDashboardLayout from "./components/staff/StaffDashboardLayout";
import StaffPage from "./pages/staff/StaffPage";
import OrdersPage from "./pages/staff/OrdersPage";
import CustomerForm from "./components/CustomerForm";
import TrackingForm from "./components/TrackingForm";
import TrackOrderMap from "./components/TrackOrderMap";
import RateDelivery from "./components/RateDelivery";
import WelcomeCustomer from "./components/WelcomeCustomer";
import Login from "./pages/Login";
import Register from "./pages/Register";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/CustomerForm" element={<CustomerForm />} />
          <Route path="/TrackingForm" element={<TrackingForm />} />
          <Route path="/TrackOrderMap" element={<TrackOrderMap />} />
          <Route path="/RateDelivery" element={<RateDelivery />} />
          <Route path="/WelcomeCustomer" element={<WelcomeCustomer />} />
          <Route index element={<StaffElPage />} />
          <Route path="staffEL" element={<StaffPage />} />
          <Route path="OrdersElPage" element={<OrdersElPage />} />
          <Route path="logistics-stats" element={<LogisticsStatsPage />} />
          <Route path="places-stats" element={<PlacesStatsPage />} />


           {/* Staff Dashboard */}
        <Route path="/staff/dashboard" element={<StaffDashboardLayout />}>
          <Route path="staff" element={<StaffPage />} />
          <Route path="orders" element={<OrdersPage />} />
        </Route>

        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
