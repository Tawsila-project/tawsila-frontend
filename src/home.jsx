import { Outlet } from "react-router-dom";
import DashboardSidebar from "./components/admin/Sidebar";

export default function Home() {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <DashboardSidebar />

      {/* Main content */}
      <main className="flex-1 p-6 md:ml-64">
        <h1 className="text-2xl font-bold mb-4">Dashboard Content</h1>
        <Outlet />
      </main>
    </div>
  );
}
