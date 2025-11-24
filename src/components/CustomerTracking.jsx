import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "./api";

const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
  iconSize: [36, 36],
  iconAnchor: [18, 18],
  popupAnchor: [0, -20]
});

const homeIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619153.png",
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36]
});

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

function MapController({ driverLoc, customerLoc }) {
  const map = useMap();
  useEffect(() => {
    if (!customerLoc) return;
    if (driverLoc) map.fitBounds([[driverLoc.lat, driverLoc.lng], [customerLoc.lat, customerLoc.lng]], { padding: [40, 40], animate: true });
    else map.setView([customerLoc.lat, customerLoc.lng], 14, { animate: true });
  }, [driverLoc, customerLoc, map]);
  return null;
}

export default function CustomerTracking() {
  const location = useLocation();
  const [orderId, setOrderId] = useState(location.state?.orderNumber || "");
  const [driverLocation, setDriverLocation] = useState(null);
  const [customerLocation, setCustomerLocation] = useState(null);
  const [status, setStatus] = useState("Connecting...");
  const socketRef = useRef(null);

  useEffect(() => {
    if (!orderId) return;
    const fetchData = async () => {
      try {
        const { data } = await api.get(`/public/order/track/${orderId}`);
        setStatus(`Order Status: ${data.status || "Unknown"}`);
        setCustomerLocation(data.customer?.coords || { lat: 34.12, lng: 35.65 });
        setDriverLocation((data.status?.toLowerCase() === "in_transit" && data.tracked_location?.lat) ? data.tracked_location : null);
      } catch {
        setStatus("Error: Could not retrieve order data.");
      }
    };
    fetchData();
  }, [orderId]);

  useEffect(() => {
    if (!orderId) return;
    const socket = io(SOCKET_URL);
    socketRef.current = socket;
    socket.on("connect", () => socket.emit("join-order", orderId));
    socket.on("location-updated", (data) => {
      if (data && typeof data.lat === "number" && typeof data.lng === "number") setDriverLocation({ lat: data.lat, lng: data.lng });
      else if (data?.lat === null || data?.lng === null) setDriverLocation(null);
    });
    return () => socket.disconnect();
  }, [orderId]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
      <Paper
        elevation={3}
        sx={{
          maxWidth: { xs: 360, sm: 600, md: 720 },
          m: "16px auto",
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
          <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>🚚 Delivery Tracking</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>Order #{orderId}</Typography>
          <Box mt={1}>
            <Typography variant="caption" fontWeight="bold" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>{status}</Typography>
            {!driverLocation && <LinearProgress sx={{ mt: 1, height: 5, borderRadius: 1 }} />}
          </Box>
        </Box>

        <Box sx={{ height: { xs: 300, sm: 400, md: 450 }, width: "100%", position: "relative" }}>
          {!driverLocation && customerLocation && (
            <Box sx={{
              position: 'absolute', zIndex: 999, top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)', bgcolor: 'rgba(255,255,255,0.9)',
              p: 1.5, borderRadius: 1.5, boxShadow: 2, fontSize: { xs: "0.7rem", sm: "0.85rem" }
            }}>
              Waiting for driver to start moving...
            </Box>
          )}

          <MapContainer center={customerLocation || [33.888, 35.495]} zoom={13} style={{ height: "100%", width: "100%" }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            {customerLocation && <Marker position={[customerLocation.lat, customerLocation.lng]} icon={homeIcon}><Popup><b>My Location</b><br/>Delivery Destination</Popup></Marker>}
            {driverLocation && <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}><Popup><b>Driver is here!</b></Popup></Marker>}
            {driverLocation && customerLocation && <Polyline positions={[[driverLocation.lat, driverLocation.lng], [customerLocation.lat, customerLocation.lng]]} color="blue" dashArray="10,10" opacity={0.6} />}
            <MapController driverLoc={driverLocation} customerLoc={customerLocation} />
          </MapContainer>
        </Box>
      </Paper>
    </motion.div>
  );
}



// // src/components/tracking/CustomerTracking.jsx

// import { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";
// import { Box, Paper, Typography, LinearProgress } from "@mui/material";
// import { useLocation } from "react-router-dom";
// import { io } from "socket.io-client";
// import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import api from "./api"; // ـ api

// const driverIcon = new L.Icon({
//     iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",  
//     iconSize: [40, 40],
//     iconAnchor: [20, 20], 
//     popupAnchor: [0, -20]
// });

// const homeIcon = new L.Icon({
//     iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619153.png", 
//     iconSize: [40, 40],
//     iconAnchor: [20, 40],
//     popupAnchor: [0, -40]
// });



// function MapController({ driverLoc, customerLoc }) {
//     const map = useMap();

//     useEffect(() => {
//         // لا يمكننا فعل شيء بدون موقع العميل
//         if (!customerLoc) return; 

//         // 🛑 التعديل: إذا كان موقع السائق متاحاً، اضبط حدود الخريطة لتشمل كلتا النقطتين.
//         if (driverLoc) {
//             const bounds = L.latLngBounds([
//                 [driverLoc.lat, driverLoc.lng],
//                 [customerLoc.lat, customerLoc.lng]
//             ]);
            
//             // map.fitBounds سيقوم بالقفز وتحديد أفضل مستوى تكبير تلقائياً (طرابلس وبيروت)
//             // قمنا بإزالة maxZoom: 16 للسماح بتصغير الخريطة إذا لزم الأمر
//             map.fitBounds(bounds, { padding: [50, 50], animate: true }); 
            
//         } else {
//             // إذا لم يكن السائق متوفراً، ركّز فقط على موقع العميل
//             map.setView([customerLoc.lat, customerLoc.lng], 15, { animate: true });
//         }

//     }, [driverLoc, customerLoc, map]);

//     return null;
// }

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// export default function CustomerTracking() {
//     const location = useLocation();
//     const [orderId, setOrderId] = useState("");
    
//     const [driverLocation, setDriverLocation] = useState(null);
    
//     const [customerLocation, setCustomerLocation] = useState(null);
    
//     const [status, setStatus] = useState("Connecting...");
//     const socketRef = useRef(null);

//     useEffect(() => {
//         if (location.state?.orderNumber) {
//             setOrderId(location.state.orderNumber);
//         }
//     }, [location.state]);


// useEffect(() => {
//     if (!orderId) return;

//     const fetchInitialData = async () => {
//         try {
//             const res = await api.get(`/public/order/track/${orderId}`);
//             const data = res.data;

//             const currentStatus = data.status ? data.status.toLowerCase() : "unknown";
//             setStatus(`Order Status: ${data.status}`);

//             // ----------------------------------------------------
//             // 🟦 1. Set Customer Location (Tripoli fallback)
//             // ----------------------------------------------------
//             if (data.customer && data.customer.coords) {
//                 setCustomerLocation({
//                     lat: data.customer.coords.lat,
//                     lng: data.customer.coords.lng,
//                 });
//             } else {
//                 console.warn("Customer coordinates missing. Using Tripoli fallback.");
//                 setCustomerLocation({
//                     lat: 34.12,
//                     lng: 35.65,
//                 });
//             }

//             // ----------------------------------------------------
//             // 🟦 2. Set Driver Location (null if not in transit)
//             // ----------------------------------------------------
//             if (
//                 currentStatus === "in_transit" &&
//                 data.tracked_location &&
//                 data.tracked_location.lat
//             ) {
//                 setDriverLocation(data.tracked_location);
//             } else {
//                 setDriverLocation(null);
//             }

//         } catch (err) {
//             console.error("Error fetching order:", err);
//             setStatus("Error: Could not retrieve order data.");
//         }
//     };

//     fetchInitialData();
// }, [orderId]);



//     // useEffect(() => {
//     //     if (!orderId) return;
//     //     const fetchInitialData = async () => {
//     //         try {
//     //             const res = await api.get(`/public/order/track/${orderId}`);
//     //             const data = res.data;
                
//     //             if (data.customer && data.customer.lat) {
//     //                 setCustomerLocation({ lat: data.customer.lat, lng: data.customer.lng });
//     //             }

//     //             if (data.tracked_location && data.tracked_location.lat) {
//     //                 setDriverLocation(data.tracked_location);
//     //             }
//     //             setStatus(`Order Status: ${data.status}`);
//     //         } catch (err) {
//     //             console.error("Error fetching order:", err);
//     //         }
//     //     };
//     //     fetchInitialData();
//     // }, [orderId]);

//     useEffect(() => {
//         if (!orderId) return;

//         const socket = io(SOCKET_URL);
//         socketRef.current = socket;

//         socket.on("connect", () => {
//             console.log("🟢 Connected to tracking server");
//             socket.emit("join-order", orderId);
//         });

//         socket.on("location-updated", (data) => {
//         console.log("📍 New Driver Location:", data);
        

//         if (data && (data.lat === null || data.lng === null)) {
//            console.log("🚗 Driver stopped tracking, removing icon.");
//              setDriverLocation(null);
//         }
//         // ✅ FIX: يجب التحقق من أن الكائن ليس فارغاً وأن الإحداثيات موجودة قبل محاولة استخدامها
//     //    else if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
//     //       setDriverLocation({ lat: data.lat, lng: data.lng });
//     //       } else {
//     //         console.warn("⚠️ Received invalid or incomplete location data, skipping state update.");
//     //    }

//     else if (data && typeof data.lat === 'number' && typeof data.lng === 'number') {
//         setDriverLocation({ lat: data.lat, lng: data.lng });
//       } else {
//         console.warn("⚠️ Received invalid or incomplete location data, skipping state update.");
//        }
//     });

//         return () => socket.disconnect();
//     }, [orderId]);

//     return (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
//             <Paper elevation={4} sx={{ maxWidth: 800, margin: "20px auto", borderRadius: 3, overflow: 'hidden' }}>
                
//                 {/* Header Info */}
//                 <Box sx={{ p: 3, bgcolor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
//                     <Typography variant="h5" fontWeight="bold">🚚 Delivery Tracking</Typography>
//                     <Typography variant="body2" color="text.secondary">Order #{orderId}</Typography>
//                     <Box mt={2}>
//                         <Typography variant="caption" fontWeight="bold">{status}</Typography>
//                         {!driverLocation && <LinearProgress sx={{ mt: 1 }} />}
//                     </Box>
//                 </Box>

//                 {/* Map Area */}
//                 <Box sx={{ height: "500px", width: "100%", position: "relative" }}>
//                     {!driverLocation && customerLocation && (
//                         <Box sx={{ 
//                             position: 'absolute', zIndex: 999, top: '50%', left: '50%', 
//                             transform: 'translate(-50%, -50%)', bgcolor: 'rgba(255,255,255,0.9)', 
//                             p: 2, borderRadius: 2, boxShadow: 3 
//                         }}>
//                             <Typography>Waiting for driver to start moving...</Typography>
//                         </Box>
//                     )}

//                     <MapContainer 
//                         center={customerLocation || [33.888, 35.495]}
//                         zoom={13} 
//                         style={{ height: "100%", width: "100%" }}
//                     >

//                         {console.log("STATE Customer (Home Icon):", customerLocation)}
//                         {console.log("STATE Driver (Car Icon):", driverLocation)}
//                         <TileLayer 
//                             url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
//                             attribution="&copy; OpenStreetMap contributors"
//                         />

//                         {customerLocation && (
//                             <Marker position={[customerLocation.lat, customerLocation.lng]} icon={homeIcon}>
//                                 <Popup><b>My Location</b><br/>Delivery Destination</Popup>
//                             </Marker>
//                         )}

//                         {driverLocation && (
//                             <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
//                                 <Popup><b>Driver is here!</b></Popup>
//                             </Marker>
//                         )}

//                         {driverLocation && customerLocation && (
//                             <Polyline 
//                                 positions={[
//                                     [driverLocation.lat, driverLocation.lng],
//                                     [customerLocation.lat, customerLocation.lng]
//                                 ]}
//                                 color="blue"
//                                 dashArray="10, 10" 
//                                 opacity={0.6}
//                             />
//                         )}

//                         <MapController driverLoc={driverLocation} customerLoc={customerLocation} />

//                     </MapContainer>
//                 </Box>
//             </Paper>
//         </motion.div>
//     );
// }