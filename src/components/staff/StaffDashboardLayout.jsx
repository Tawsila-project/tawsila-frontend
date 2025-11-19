// src/components/staff/StaffDashboardLayout.jsx
import { useState } from "react";
import { Outlet, NavLink } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Box,
  Button,
} from "@mui/material";
import { Menu as MenuIcon, People, ShoppingCart, Logout } from "@mui/icons-material";

const drawerWidth = 240;

export default function StaffDashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu = [
    { name: "Staff", path: "/staff/dashboard/staff", icon: <People /> },
    { name: "Orders", path: "/staff/dashboard/orders", icon: <ShoppingCart /> },
  ];

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box sx={{ width: drawerWidth, bgcolor: "#0ABE51", color: "white", height: "100%", display: "flex", flexDirection: "column" }}>
      <Typography variant="h6" sx={{ m: 2 }}>Staff Dashboard</Typography>

      <List>
        {menu.map((item) => (
          <ListItem
            button
            key={item.name}
            component={NavLink}
            to={item.path}
            sx={{
              "&.active": { bgcolor: "#2CA9E3", color: "white" },
              "&:hover": { bgcolor: "#079b3a" },
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Button variant="contained" color="error" startIcon={<Logout />} fullWidth>
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* AppBar for mobile */}
      <AppBar position="fixed" sx={{ display: { md: "none" }, bgcolor: "#079b3a" }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>Staff Dashboard</Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav">
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{ display: { xs: "none", md: "block" }, "& .MuiDrawer-paper": { width: drawerWidth, boxSizing: "border-box" } }}
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
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
