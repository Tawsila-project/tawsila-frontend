// src/components/staff/StaffDashboardLayout.jsx
import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import { Menu as MenuIcon, People, Map, ShoppingCart, Logout } from "@mui/icons-material";

const drawerWidth = 240;

export default function StaffDashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  const menu = [
    { name: "Staff Management", path: "/staff/dashboard/staff", icon: <People /> },
    { name: "Orders Control", path: "/staff/dashboard/orders", icon: <ShoppingCart /> },
    { name: "Live Tracking", path: "/staff/dashboard/tracking", icon: <Map /> },
  ];

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);


  const drawer = (
  <Box
    sx={{
      width: drawerWidth,
      bgcolor: "#0ABE51", // main green
      color: "white",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      borderRight: "2px solid #2CA9E3", // subtle blue accent
    }}
  >
    <Typography
      variant="h6"
      sx={{
        m: 2,
        fontWeight: 700,
        letterSpacing: 1,
        textTransform: "uppercase",
        color: "#ffffff",
      }}
    >
      Staff Panel
    </Typography>

    <List sx={{ flexGrow: 1 }}>
      {menu.map((item) => (
        <ListItem
          key={item.name}
          component={NavLink}
          to={item.path}
          sx={{
            borderRadius: 1,
            mb: 1,
            mx: 1,
            color: "white",
            "&.active": {
              bgcolor: "#2CA9E3", // active blue
              color: "white",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
            },
            "&:hover": {
              bgcolor: "rgba(255,255,255,0.1)",
              color: "white",
            },
            transition: "all 0.3s ease",
          }}
        >
          <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
          <ListItemText primary={item.name} />
        </ListItem>
      ))}
    </List>

    <Box sx={{ p: 2 }}>
      <Button
        variant="contained"
        startIcon={<Logout />}
        fullWidth
        sx={{
          backgroundColor: "#F44336",
          "&:hover": { backgroundColor: "#d32f2f" },
          fontWeight: 600,
        }}
        onClick={handleLogout}
      >
        Logout
      </Button>
    </Box>
  </Box>
);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile AppBar */}
      <AppBar position="fixed" sx={{ display: { md: "none" }, bgcolor: "#0ABE51" }}>
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Staff Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box
        component="nav"
        sx={{
          width: { md: drawerWidth },
          flexShrink: { md: 0 },
        }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
        >
          {drawer}
        </Drawer>

        {/* Permanent Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 7, md: 0 },
          bgcolor: "#f3f4f6",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Placeholder to offset AppBar on mobile */}
        <Box sx={{ display: { xs: "block", md: "none" }, height: 64 }} />
        <Outlet />
      </Box>
    </Box>
  );
}
