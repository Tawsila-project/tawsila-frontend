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
navigate("/");
};

const menu = [
{ name: "Staff Management", path: "/staff/dashboard/staff", icon: <People /> },
{ name: "Orders Control", path: "/staff/dashboard/orders", icon: <ShoppingCart /> },
{ name: "Live Tracking", path: "/staff/dashboard/tracking", icon: <Map /> },
];

const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

const drawer = (
<Box sx={{ width: drawerWidth, bgcolor: "#0ABE51", color: "white", height: "100%", display: "flex", flexDirection: "column" }}>
<Typography variant="h6" sx={{ m: 2, fontWeight: 600 }}>Staff Panel</Typography>

<List sx={{ flexGrow: 1 }}>
{menu.map((item) => (
<ListItem
button
key={item.name}
component={NavLink}
to={item.path}
sx={{
"&.active": { bgcolor: "rgba(255,255,255,0.2)", color: "white" },
"&:hover": { bgcolor: "rgba(0,0,0,0.1)" },
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
color="error"
startIcon={<Logout />}
fullWidth
onClick={handleLogout}
>
Logout
</Button>
</Box>
</Box>
);

return (
<Box sx={{ display: "flex", minHeight: "100vh" }}>
<AppBar position="fixed" sx={{ display: { md: "none" }, bgcolor: "#0ABE51" }}>
<Toolbar>
<IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
<MenuIcon />
</IconButton>
<Typography variant="h6" noWrap>Staff Dashboard</Typography>
</Toolbar>
</AppBar>

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
<Box sx={{ display: { xs: "none", md: "block" }, height: 64 }} />
<Outlet />
</Box>
</Box>
);
}
