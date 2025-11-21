// src/components/tracking/DriverTracking.jsx

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Driver Icon
const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -20],
});

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function DriverTracking({ orderNumber, driverId }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Ready…");
  const [socketConnected, setSocketConnected] = useState(false);

  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setStatusMsg("Connected ✔ Ready to track");
      socket.emit("driver-join", driverId);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      setStatusMsg("Disconnected… Reconnecting");
    });

    return () => socket.disconnect();
  }, [driverId]);

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Your device does not support GPS.");
      return;
    }

    setIsTracking(true);
    setStatusMsg("Sending live location…");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setCurrentPos([latitude, longitude]);

        if (socketRef.current?.connected) {
          socketRef.current.emit("update-location", {
            orderId: orderNumber,
            driverId,
            lat: latitude,
            lng: longitude,
          });
        }
      },
      (err) => {
        setStatusMsg("GPS Error: " + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      }
    );
  };

  // Stop Tracking
  const stopTracking = () => {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;

    setIsTracking(false);
    setStatusMsg("Tracking stopped.");
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        mt: 4,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: "900px",
          p: 3,
          borderRadius: 4,
          background: "#ffffff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.07)",
        }}
      >
        <Typography fontWeight={700} variant="h4" textAlign="center" mb={2}>
          🚗 Live Driver Tracking
        </Typography>

        {/* Status Block */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            background: socketConnected ? "#e3fce5" : "#ffe7e7",
            border: socketConnected ? "1px solid #52c15a" : "1px solid #d9534f",
          }}
        >
          <Typography variant="body1" fontWeight={600}>
            Server Status:{" "}
            <span style={{ color: socketConnected ? "#2e7d32" : "#c62828" }}>
              {socketConnected ? "Connected 🟢" : "Offline 🔴"}
            </span>
          </Typography>
        </Paper>

        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            background: "#f7f9fc",
            border: "1px solid #e0e6ed",
          }}
        >
          <Typography>
            <strong>Order ID:</strong> {orderNumber}
          </Typography>
          <Typography>
            <strong>Driver ID:</strong> {driverId}
          </Typography>
          <Typography>
            <strong>Status:</strong> {statusMsg}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* MAP */}
        <Box
          sx={{
            height: 400,
            borderRadius: 3,
            overflow: "hidden",
            mb: 3,
            border: "1px solid #ddd",
          }}
        >
          {currentPos ? (
            <MapContainer
              center={currentPos}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={currentPos} icon={driverIcon}>
                <Popup>You</Popup>
              </Marker>
            </MapContainer>
          ) : (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#555",
              }}
            >
              <CircularProgress />
              <Typography ml={2}>Waiting for GPS…</Typography>
            </Box>
          )}
        </Box>

        {/* BUTTONS */}
        <Box display="flex" gap={2}>
          {!isTracking ? (
            <Button
              variant="contained"
              fullWidth
              color="success"
              onClick={startTracking}
              size="large"
              sx={{
                py: 1.8,
                fontSize: "1.1rem",
                borderRadius: 3,
              }}
            >
              Start Delivery 🚀
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              color="error"
              onClick={stopTracking}
              size="large"
              sx={{
                py: 1.8,
                fontSize: "1.1rem",
                borderRadius: 3,
              }}
            >
              Stop Delivery 🛑
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}




// // src/components/tracking/DriverTracking.jsx

// import { useEffect, useState, useRef } from "react";
// import { Box, Button, Typography, Paper, Alert, CircularProgress } from "@mui/material";
// import { io } from "socket.io-client";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";

// // --- 1. إعداد أيقونة السائق ---
// const driverIcon = new L.Icon({
//   iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png", // نفس أيقونة السيارة الحمراء
//   iconSize: [40, 40],
//   iconAnchor: [20, 20],
//   popupAnchor: [0, -20],
// });

// // --- 2. رابط السيرفر ---
// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// export default function DriverTracking({ orderNumber, driverId }) {
//   const [isTracking, setIsTracking] = useState(false);
//   const [currentPos, setCurrentPos] = useState(null);
//   const [statusMsg, setStatusMsg] = useState("Ready to start...");
//   const [socketConnected, setSocketConnected] = useState(false);

//   const watchIdRef = useRef(null);
//   const socketRef = useRef(null);

//   // --- 3. الاتصال بالسوكيت عند فتح الصفحة ---
//   useEffect(() => {
//     // تهيئة الاتصال
//     const socket = io(SOCKET_URL);
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       console.log("🟢 Driver Socket Connected:", socket.id);
//       setSocketConnected(true);
//       setStatusMsg("Connected to server. Ready to track.");
      
//       // تسجيل السائق في السيرفر
//       socket.emit("driver-join", driverId);
//     });

//     socket.on("disconnect", () => {
//       console.log("🔴 Driver Socket Disconnected");
//       setSocketConnected(false);
//       setStatusMsg("Connection lost. Reconnecting...");
//     });

//     return () => {
//       socket.disconnect();
//     };
//   }, [driverId]);

//   // --- 4. بدء التتبع (GPS) ---
//   const startTracking = () => {
//     if (!navigator.geolocation) {
//       alert("Geolocation is not supported by your browser");
//       return;
//     }

//     setIsTracking(true);
//     setStatusMsg("🚀 Tracking started! Sending location...");

//     // استخدام watchPosition لمراقبة التحرك المستمر
//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (position) => {
//         const { latitude, longitude } = position.coords;
        
//         // 1. تحديث الخريطة المحلية للسائق (ليرى نفسه)
//         setCurrentPos([latitude, longitude]);

//         // 2. إرسال الموقع للسيرفر عبر السوكيت
//         if (socketRef.current && socketRef.current.connected) {
//           socketRef.current.emit("update-location", {
//             orderId: orderNumber,
//             driverId: driverId,
//             lat: latitude,
//             lng: longitude,
//           });
//           console.log(`📤 Sent: ${latitude}, ${longitude}`);
//         }
//       },
//       (error) => {
//         console.error("GPS Error:", error);
//         setStatusMsg("❌ GPS Error: " + error.message);
//       },
//       {
//         enableHighAccuracy: true, // دقة عالية (مهم جداً للتوصيل)
//         timeout: 10000,
//         maximumAge: 0,
//       }
//     );
//   };

//   // --- 5. إيقاف التتبع ---
//   const stopTracking = () => {
//     if (watchIdRef.current !== null) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//       watchIdRef.current = null;
//     }
//     setIsTracking(false);
//     setStatusMsg("🛑 Tracking stopped.");
//   };

//   return (
//     <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: "auto", mt: 4, borderRadius: 3 }}>
//       <Typography variant="h5" fontWeight="bold" gutterBottom align="center">
//         🚦 Driver Dashboard
//       </Typography>
      
//       <Box sx={{ mb: 2, p: 2, bgcolor: "#f8f9fa", borderRadius: 1 }}>
//         <Typography variant="body2"><strong>Order ID:</strong> {orderNumber}</Typography>
//         <Typography variant="body2"><strong>Driver ID:</strong> {driverId}</Typography>
//         <Typography variant="body2" color={socketConnected ? "success.main" : "error.main"}>
//             <strong>Server Status:</strong> {socketConnected ? "Online 🟢" : "Offline 🔴"}
//         </Typography>
//       </Box>

//       {/* خريطة صغيرة للسائق ليتأكد أن الـ GPS يعمل */}
//       <Box sx={{ height: 300, width: "100%", mb: 2, borderRadius: 2, overflow: "hidden", border: "1px solid #eee" }}>
//         {currentPos ? (
//           <MapContainer center={currentPos} zoom={15} style={{ height: "100%", width: "100%" }}>
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//             <Marker position={currentPos} icon={driverIcon}>
//               <Popup>You are here</Popup>
//             </Marker>
//           </MapContainer>
//         ) : (
//           <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#eee" }}>
//             <Typography color="text.secondary">Waiting for GPS signal...</Typography>
//           </Box>
//         )}
//       </Box>

//       <Alert severity={isTracking ? "success" : "info"} sx={{ mb: 2 }}>
//         {statusMsg}
//       </Alert>

//       <Box display="flex" gap={2}>
//         {!isTracking ? (
//           <Button 
//             variant="contained" 
//             color="primary" 
//             fullWidth 
//             onClick={startTracking}
//             disabled={!socketConnected}
//             size="large"
//           >
//             Start Delivery 🚀
//           </Button>
//         ) : (
//           <Button 
//             variant="contained" 
//             color="error" 
//             fullWidth 
//             onClick={stopTracking}
//             size="large"
//           >
//             Stop Delivery 🛑
//           </Button>
//         )}
//       </Box>
//     </Paper>
//   );
// }


