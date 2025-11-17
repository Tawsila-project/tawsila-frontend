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
import {
  Menu as MenuIcon,
  People,
  ShoppingCart,
  BarChart,
  Map,
  Logout,
} from "@mui/icons-material";

const drawerWidth = 240;

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  const menu = [
    { name: "Staff", path: "/staff", icon: <People /> },
    { name: "Orders", path: "/orders", icon: <ShoppingCart /> },
    { name: "Logistics Stats", path: "/logistics-stats", icon: <BarChart /> },
    { name: "Places Stats", path: "/places-stats", icon: <Map /> },
  ];

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const drawer = (
    <Box
      sx={{
        width: drawerWidth,
        bgcolor: "#0ABE51", // primary green sidebar
        color: "white",
        height: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Typography variant="h6" sx={{ m: 2, fontWeight: 600 }}>
        Dashboard
      </Typography>

      <List>
        {menu.map((item) => (
          <ListItem
            button
            key={item.name}
            component={NavLink}
            to={item.path}
            end
            sx={{
              "&.active": { bgcolor: "#2CA9E3", color: "white" }, // active blue
              "&:hover": { bgcolor: "#059a3b" }, // hover darker green
            }}
          >
            <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.name} />
          </ListItem>
        ))}
      </List>

      <Box sx={{ mt: "auto", p: 2 }}>
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#F44336",
            "&:hover": { backgroundColor: "#d32f2f" },
          }}
          startIcon={<Logout />}
          fullWidth
        >
          Logout
        </Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      {/* Mobile AppBar */}
      <AppBar
        position="fixed"
        sx={{ display: { md: "none" }, bgcolor: "#0ABE51" }} // same green as sidebar
      >
        <Toolbar>
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            Dashboard
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box component="nav">
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
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
          bgcolor: "#f3f4f6", // light background for main content
        }}
      >
        
        <Outlet />

      </Box>
    </Box>
  );
}
