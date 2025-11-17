import { BrowserRouter, Routes, Route } from "react-router-dom";
import DashboardLayout from "./components/admin/Sidebar";
import StaffPage from "./pages/StaffPage";
import OrdersPage from "./pages/OrdersPage";
import LogisticsStatsPage from "./pages/LogisticsStatsPage";
import PlacesStatsPage from "./pages/PlacesStatsPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DashboardLayout />}>
          <Route index element={<StaffPage />} />
          <Route path="staff" element={<StaffPage />} />
          <Route path="orders" element={<OrdersPage />} />
          <Route path="logistics-stats" element={<LogisticsStatsPage />} />
          <Route path="places-stats" element={<PlacesStatsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
