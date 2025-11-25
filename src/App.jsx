import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";

import DashboardLayout from "./components/admin/Sidebar";
import StaffDashboardLayout from "./components/staff/StaffDashboardLayout";

// import StaffElPage from "./pages/StaffElPage";
// import OrdersElPage from "./pages/OrdersElPage";
import DriversLogs from "./pages/driversLogsPage";
import PlacesLogs from "./pages/placeLogsPage";
import StaffPage from "./pages/staff/StaffPage";
import OrdersPage from "./pages/staff/OrdersPage";
import CustomerForm from "./components/CustomerForm";
import StaffTrackingPage from "./pages/staff/StaffTrackingPage";
import TrackingForm from "./components/TrackingForm";
import TrackOrderMap from "./components/TrackOrderMap";
import RateDelivery from "./components/RateDelivery";
import WelcomeCustomer from "./components/WelcomeCustomer";

import Login from "./pages/Login";

function App() {
  return (

    <BrowserRouter>
  <Routes>

    {/* PUBLIC PAGES */}
    <Route path="/" element={<CustomerForm />} />
    <Route path="/TrackingForm" element={<TrackingForm />} />
    <Route path="/TrackOrderMap" element={<TrackOrderMap />} />
    <Route path="/RateDelivery" element={<RateDelivery />} />
    <Route path="/WelcomeCustomer" element={<WelcomeCustomer />} />
    <Route path="/login" element={<Login />} />

    {/* ADMIN DASHBOARD */}
    <Route
      path="/admin"
      element={
        <ProtectedRoute allowedRoles={["admin"]}>
          <DashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path="driverLogs" element={<DriversLogs />} />
      <Route path="placeLogs" element={<PlacesLogs />} />
      <Route
        path="staff"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <StaffPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="orders"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <OrdersPage />
          </ProtectedRoute>
        }
      />
    </Route>

    {/* STAFF DASHBOARD */}
    <Route
      path="/staff/dashboard"
      element={
        <ProtectedRoute allowedRoles={["staff"]}>
          <StaffDashboardLayout />
        </ProtectedRoute>
      }
    >
      <Route path="staff" element={<StaffPage />} />
      <Route path="orders" element={<OrdersPage />} />
      <Route path="tracking" element={<StaffTrackingPage />} />
    </Route>

  </Routes>
</BrowserRouter>

    // <BrowserRouter>
    //   <Routes>

    //       <Route path="/" element={<CustomerForm />} />
    //       <Route path="/TrackingForm" element={<TrackingForm />} />
    //       <Route path="/TrackOrderMap" element={<TrackOrderMap />} />
    //       <Route path="/RateDelivery" element={<RateDelivery />} />
    //       <Route path="/WelcomeCustomer" element={<WelcomeCustomer />} />
    //       <Route path="/login" element={<Login />} />
    //       <Route path="logistics-stats" element={<LogisticsStatsPage />} />
    //       <Route path="places-stats" element={<PlacesStatsPage />} />

        


    //     <Route
    //       path="/admin"
    //       element={
    //         <ProtectedRoute allowedRoles={["admin"]}>
    //           <DashboardLayout />
    //         </ProtectedRoute>
    //       }
    //     >
    //       <Route path="logistics-stats" element={<LogisticsStatsPage />} />
    //       <Route path="places-stats" element={<PlacesStatsPage />} />

    //       <Route path="staff" element={
    //         <ProtectedRoute allowedRoles={["admin", "staff"]}>
    //           <StaffPage />
    //         </ProtectedRoute>
    //       } />
    //       <Route path="orders" element={
    //         <ProtectedRoute allowedRoles={["admin", "staff"]}>
    //           <OrdersPage />
    //         </ProtectedRoute>
    //       } />
    //     </Route>

    //     <Route
    //       path="/staff/dashboard"
    //       element={
    //         <ProtectedRoute allowedRoles={["staff", "admin"]}>
    //           <StaffDashboardLayout />
    //         </ProtectedRoute>
    //       }
    //     >
    //       <Route path="staff" element={<StaffPage />} />
    //       <Route path="orders" element={<OrdersPage />} />
    //       <Route path="tracking" element={<StaffTrackingPage />} />
    //     </Route>


    //   </Routes>
    // </BrowserRouter>
  );
}

export default App;
