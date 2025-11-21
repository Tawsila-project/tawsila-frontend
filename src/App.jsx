import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import DashboardLayout from "./components/admin/Sidebar";
import StaffDashboardLayout from "./components/staff/StaffDashboardLayout";

import StaffElPage from "./pages/StaffElPage";
import OrdersElPage from "./pages/OrdersElPage";
import LogisticsStatsPage from "./pages/LogisticsStatsPage";
import PlacesStatsPage from "./pages/PlacesStatsPage";
import StaffPage from "./pages/staff/StaffPage";
import OrdersPage from "./pages/staff/OrdersPage";
import DriverTracking from "./components/staff/DriverTracking";
import CustomerForm from "./components/CustomerForm";
import TrackingForm from "./components/TrackingForm";
import TrackOrderMap from "./components/TrackOrderMap";
import RateDelivery from "./components/RateDelivery";
import WelcomeCustomer from "./components/WelcomeCustomer";

import Login from "./pages/Login";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* PUBLIC CUSTOMER PAGES */}
        <Route path="/" element={<CustomerForm />} />
        {/* <Route path="/CustomerForm" element={<CustomerForm />} /> */}
        <Route path="/TrackingForm" element={<TrackingForm />} />
        <Route path="/TrackOrderMap" element={<TrackOrderMap />} />
        <Route path="/RateDelivery" element={<RateDelivery />} />
        <Route path="/WelcomeCustomer" element={<WelcomeCustomer />} />

        {/* AUTH PAGES FOR ADMIN + STAFF */}
        <Route path="/login" element={<Login />} />

        {/* ADMIN DASHBOARD (protected) */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<StaffElPage />} />
          <Route path="staff" element={<StaffElPage />} />
          <Route path="orders" element={<OrdersElPage />} />
          <Route path="logistics-stats" element={<LogisticsStatsPage />} />
          <Route path="places-stats" element={<PlacesStatsPage />} />
        </Route>

        {/* STAFF DASHBOARD (protected) */}
        <Route
          path="/staff/dashboard"
          element={
            <ProtectedRoute allowedRoles={["staff", "admin"]}>
              <StaffDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="staff" element={<StaffPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="tracking" element={<DriverTracking />} />
        </Route>

      </Routes>
    </BrowserRouter>
  );
}

export default App;
