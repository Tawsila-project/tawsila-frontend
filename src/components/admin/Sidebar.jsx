import { useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
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
import { Menu as MenuIcon, People, ShoppingCart, BarChart, Map, Logout } from "@mui/icons-material";

const drawerWidth = 240;

export default function DashboardLayout() {
  const role = localStorage.getItem("role");
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    navigate("/login");
  };

  // Menu items based on role
  const menu = role === "admin"
    ? [
        { name: "Staff Management", path: "/admin/staff", icon: <People /> },
        { name: "Orders Control", path: "/admin/orders", icon: <ShoppingCart /> },
        { name: "Drivers logs", path: "/admin/driverLogs", icon: <BarChart /> },
        { name: "Places logs", path: "/admin/placeLogs", icon: <Map /> },
      ]
    : [
        { name: "Orders Control", path: "/staff/dashboard/orders", icon: <ShoppingCart /> },
        { name: "Live Tracking", path: "/staff/dashboard/tracking", icon: <Map /> },
      ];

  // const drawer = (
  //   <Box
  //     sx={{
  //       width: drawerWidth,
  //       bgcolor: "#0ABE51",
  //       color: "white",
  //       height: "100%",
  //       display: "flex",
  //       flexDirection: "column",
  //     }}
  //   >
  //     <Typography variant="h6" sx={{ m: 2, fontWeight: 600 }}>
  //       {role === "admin" ? "Admin Dashboard" : "Staff Panel"}
  //     </Typography>

  //     <List sx={{ flexGrow: 1 }}>
  //       {menu.map((item) => (
  //         <ListItem
  //           key={item.name}
  //           component={NavLink}
  //           to={item.path}
  //           end
  //           sx={{
  //             "&.active": { bgcolor: "#2CA9E3", color: "white" },
  //             "&:hover": { bgcolor: "#059a3b" },
  //           }}
  //         >
  //           <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
  //           <ListItemText primary={item.name} />
  //         </ListItem>

  //       ))}
  //     </List>

  //     <Box sx={{ p: 2 }}>
  //       <Button
  //         variant="contained"
  //         startIcon={<Logout />}
  //         fullWidth
  //         sx={{ backgroundColor: "#F44336", "&:hover": { backgroundColor: "#d32f2f" } }}
  //         onClick={handleLogout}
  //       >
  //         Logout
  //       </Button>
  //     </Box>
  //   </Box>
  // );


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
      {role === "admin" ? "Admin Dashboard" : "Staff Panel"}
    </Typography>

    <List sx={{ flexGrow: 1 }}>
      {menu.map((item) => (
        <ListItem
          key={item.name}
          component={NavLink}
          to={item.path}
          end
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
          <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" noWrap>
            {role === "admin" ? "Admin Dashboard" : "Staff Panel"}
          </Typography>
        </Toolbar>
      </AppBar>

      {/* Sidebar */}
      <Box component="nav" sx={{ flexShrink: { md: 0 } }}>
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
          ml: { md: `${drawerWidth}px` }, // ⚡ this fixes content behind sidebar
          mt: { xs: 7, md: 0 },
          bgcolor: "#f3f4f6",
          minHeight: "100vh",
          overflowY: "auto",
        }}
      >
        {/* Placeholder for mobile AppBar */}
        <Box sx={{ display: { xs: "block", md: "none" }, height: 64 }} />
        <Outlet />
      </Box>
    </Box>
  );
}


// import { useState } from "react";
// import { Outlet, NavLink, useNavigate } from "react-router-dom";
// import {
//   Drawer,
//   List,
//   ListItem,
//   ListItemIcon,
//   ListItemText,
//   AppBar,
//   Toolbar,
//   IconButton,
//   Typography,
//   Box,
//   Button,
// } from "@mui/material";
// import {
//   Menu as MenuIcon,
//   People,
//   ShoppingCart,
//   BarChart,
//   Map,
//   Logout,
// } from "@mui/icons-material";

// const drawerWidth = 240;

// export default function DashboardLayout() {

//   const role = localStorage.getItem("role");
//   const [mobileOpen, setMobileOpen] = useState(false);
//   const navigate = useNavigate();

//   const handleDrawerToggle = () => setMobileOpen(!mobileOpen);
//   const handleLogout = () => {
//     localStorage.removeItem("token");
//     localStorage.removeItem("role");
//     navigate("/login");
//   };

//   // const menu = [
//   //   { name: "Staff Management", path: "/staff/dashboard/staff", icon: <People /> },
//   //   { name: "Orders Control", path: "/staff/dashboard/orders", icon: <ShoppingCart /> },
//   //   { name: "Logistics Stats", path: "/logistics-stats", icon: <BarChart /> },
//   //   { name: "Places Stats", path: "/places-stats", icon: <Map /> },
//   // ];

//   const menu = role === "admin"
//   ? [
//       { name: "Staff Management", path: "/admin/staff", icon: <People /> },
//       { name: "Orders Control", path: "/admin/orders", icon: <ShoppingCart /> },
//       { name: "Logistics Stats", path: "/admin/logistics-stats", icon: <BarChart /> },
//       { name: "Places Stats", path: "/admin/places-stats", icon: <Map /> },
//     ]
//   : [
//       { name: "Orders Control", path: "/staff/dashboard/orders", icon: <ShoppingCart /> },
//       { name: "Live Tracking", path: "/staff/dashboard/tracking", icon: <Map /> },
//     ];

//   const drawer = (
//     <Box
//       sx={{
//         width: drawerWidth,
//         bgcolor: "#0ABE51",
//         color: "white",
//         height: "100%",
//         display: "flex",
//         flexDirection: "column",
//       }}
//     >
//       <Typography variant="h6" sx={{ m: 2, fontWeight: 600 }}>
//         Dashboard
//       </Typography>

//       <List sx={{ flexGrow: 1 }}>
//         {menu.map((item) => (
//           <ListItem
//             button
//             key={item.name}
//             component={NavLink}
//             to={item.path}
//             end
//             sx={{
//               "&.active": { bgcolor: "#2CA9E3", color: "white" },
//               "&:hover": { bgcolor: "#059a3b" },
//             }}
//           >
//             <ListItemIcon sx={{ color: "inherit" }}>{item.icon}</ListItemIcon>
//             <ListItemText primary={item.name} />
//           </ListItem>
//         ))}
//       </List>

//       <Box sx={{ p: 2 }}>
//         <Button
//           variant="contained"
//           startIcon={<Logout />}
//           fullWidth
//           sx={{ backgroundColor: "#F44336", "&:hover": { backgroundColor: "#d32f2f" } }}
//           onClick={handleLogout}
//         >
//           Logout
//         </Button>
//       </Box>
//     </Box>
//   );

//   return (
//     <Box sx={{ display: "flex", minHeight: "100vh" }}>
//       {/* Mobile AppBar */}
//       <AppBar position="fixed" sx={{ display: { md: "none" }, bgcolor: "#0ABE51" }}>
//         <Toolbar>
//           <IconButton color="inherit" edge="start" onClick={handleDrawerToggle} sx={{ mr: 2 }}>
//             <MenuIcon />
//           </IconButton>
//           <Typography variant="h6" noWrap>
//             Dashboard
//           </Typography>
//         </Toolbar>
//       </AppBar>

//       {/* Sidebar */}
//       <Box component="nav" sx={{ flexShrink: { md: 0 } }}>
//         <Drawer
//           variant="temporary"
//           open={mobileOpen}
//           onClose={handleDrawerToggle}
//           ModalProps={{ keepMounted: true }}
//           sx={{
//             display: { xs: "block", md: "none" },
//             "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
//           }}
//         >
//           {drawer}
//         </Drawer>

//         <Drawer
//           variant="permanent"
//           sx={{
//             display: { xs: "none", md: "block" },
//             "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
//           }}
//           open
//         >
//           {drawer}
//         </Drawer>
//       </Box>

//       {/* Main Content */}
//       <Box
//         component="main"
//         sx={{
//           flexGrow: 1,
//           p: 3,
//           width: { md: `calc(100% - ${drawerWidth}px)` },
//           mt: { xs: 7, md: 0 }, // spacing for mobile AppBar
//           bgcolor: "#f3f4f6",
//           minHeight: "100vh",
//           overflowY: "auto",
//         }}
//       >
//         <Outlet />
//       </Box>
//     </Box>
//   );
// }
