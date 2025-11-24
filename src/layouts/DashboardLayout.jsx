import DashboardSidebar from "../components/admin/Sidebar";
import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";

const drawerWidth = 240; // make sure it matches the sidebar width

export default function DashboardLayout() {
  return (
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <DashboardSidebar /> {/* MUI Drawer or custom sidebar */}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` }, // ensures content doesn't go under sidebar
          mt: { xs: 7, md: 0 }, // offset AppBar on mobile
          bgcolor: "#f3f4f6",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
