import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Box, Paper, Typography, LinearProgress, Modal, Button } from "@mui/material"; // 🚨 تم إضافة Modal و Button
import CheckCircleIcon from "@mui/icons-material/CheckCircle"; // 🚨 تم إضافة CheckCircleIcon
import { useNavigate, useLocation } from "react-router-dom"; // 🚨 تم إضافة useNavigate
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "./api";
import Logo from "../../public/logo.png";


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
    const navigate = useNavigate(); // 🚨 Hook to navigate
    const [orderId, setOrderId] = useState(location.state?.orderNumber || "");
    const [driverLocation, setDriverLocation] = useState(null);
    const [customerLocation, setCustomerLocation] = useState(null);
    const [status, setStatus] = useState("Connecting...");
    const socketRef = useRef(null);

    // 🆕 حالة النافذة المنبثقة للتسليم
    const [isDeliveryComplete, setIsDeliveryComplete] = useState(false);

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

        // 🚨 مستمع الحدث الجديد من الخادم
        socket.on("delivery-complete", () => {
            setStatus("Order Status: Delivered! 🎉");
            setDriverLocation(null); // إزالة موقع السائق من الخريطة
            setIsDeliveryComplete(true); // عرض النافذة المنبثقة للتقييم
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
                    <img
                        src={Logo}
                        alt="Company Logo"
                        style={{ width: 90, height: "90", display: "flex" , marginLeft: "auto", marginRight: "auto", marginBottom: 8}}
                    />
                    <Typography variant="h6" textAlign={'center'} fontWeight="bold" sx={{fontSize: { xs: "1rem", sm: "1.25rem" } }} >🚚 Delivery Tracking
                    </Typography>

                    
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
                
                {/* 🚨 النافذة المنبثقة للتسليم والتقييم */}
                <Modal open={isDeliveryComplete} onClose={() => setIsDeliveryComplete(false)}>
                    <Paper 
                        sx={{
                            position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                            width: { xs: "85%", sm: 400 }, p: 4, textAlign: "center", borderRadius: 3,
                            boxShadow: 24, outline: 'none',
                        }}
                    >
                        <CheckCircleIcon sx={{ fontSize: 60, color: "#4CAF50", mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} mb={1}>
                            Delivery Complete! 🎉
                        </Typography>
                        <Typography variant="body1" color="text.secondary" mb={3}>
                            Your order **#{orderId}** has been successfully delivered.
                        </Typography>
                        <Button
                            variant="contained"
                            color="primary"
                            fullWidth
                            // 🚀 هذا هو التعديل المطلوب: نغلق النافذة أولاً قبل الانتقال
                            onClick={() => {
                                setIsDeliveryComplete(false);
                                navigate(`/RateDelivery?orderId=${orderId}`);
                            }} 
                            sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600, mb: 1.5 }}
                        >
                            Rate Your Experience ⭐
                        </Button>
                        <Button
                            variant="outlined"
                            color="inherit"
                            fullWidth
                            onClick={() => {
                                setIsDeliveryComplete(false); // إغلاق النافذة أولاً
                                navigate("/"); // الانتقال إلى صفحة CustomerForm
                            }}
                        >
                            Close
                        </Button>
                    </Paper>
                </Modal>
            </Paper>
        </motion.div>
    );
}

// import { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";
// import { Box, Paper, Typography, LinearProgress } from "@mui/material";
// import { useLocation } from "react-router-dom";
// import { io } from "socket.io-client";
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import api from "./api";
// import Logo from "../../public/logo.png";


// const driverIcon = new L.Icon({
//   iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
//   iconSize: [36, 36],
//   iconAnchor: [18, 18],
//   popupAnchor: [0, -20]
// });

// const homeIcon = new L.Icon({
//   iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619153.png",
//   iconSize: [36, 36],
//   iconAnchor: [18, 36],
//   popupAnchor: [0, -36]
// });

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// function MapController({ driverLoc, customerLoc }) {
//   const map = useMap();
//   useEffect(() => {
//     if (!customerLoc) return;
//     if (driverLoc) map.fitBounds([[driverLoc.lat, driverLoc.lng], [customerLoc.lat, customerLoc.lng]], { padding: [40, 40], animate: true });
//     else map.setView([customerLoc.lat, customerLoc.lng], 14, { animate: true });
//   }, [driverLoc, customerLoc, map]);
//   return null;
// }

// export default function CustomerTracking() {
//   const location = useLocation();
//   const [orderId, setOrderId] = useState(location.state?.orderNumber || "");
//   const [driverLocation, setDriverLocation] = useState(null);
//   const [customerLocation, setCustomerLocation] = useState(null);
//   const [status, setStatus] = useState("Connecting...");
//   const socketRef = useRef(null);

//   useEffect(() => {
//     if (!orderId) return;
//     const fetchData = async () => {
//       try {
//         const { data } = await api.get(`/public/order/track/${orderId}`);
//         setStatus(`Order Status: ${data.status || "Unknown"}`);
//         setCustomerLocation(data.customer?.coords || { lat: 34.12, lng: 35.65 });
//         setDriverLocation((data.status?.toLowerCase() === "in_transit" && data.tracked_location?.lat) ? data.tracked_location : null);
//       } catch {
//         setStatus("Error: Could not retrieve order data.");
//       }
//     };
//     fetchData();
//   }, [orderId]);

//   useEffect(() => {
//     if (!orderId) return;
//     const socket = io(SOCKET_URL);
//     socketRef.current = socket;
//     socket.on("connect", () => socket.emit("join-order", orderId));
//     socket.on("location-updated", (data) => {
//       if (data && typeof data.lat === "number" && typeof data.lng === "number") setDriverLocation({ lat: data.lat, lng: data.lng });
//       else if (data?.lat === null || data?.lng === null) setDriverLocation(null);
//     });
//     return () => socket.disconnect();
//   }, [orderId]);

//   return (
//     <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
//       <Paper
//         elevation={3}
//         sx={{
//           maxWidth: { xs: 360, sm: 600, md: 720 },
//           m: "16px auto",
//           borderRadius: 2,
//           overflow: 'hidden'
//         }}
//       >

       
//         <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
//           <img
//             src={Logo}
//             alt="Company Logo"
//             style={{ width: 90, height: "90", display: "flex" , marginLeft: "auto", marginRight: "auto", marginBottom: 8}}
//           />
//           <Typography variant="h6" textAlign={'center'} fontWeight="bold" sx={{fontSize: { xs: "1rem", sm: "1.25rem" } }} >🚚 Delivery Tracking
//           </Typography>

          
//           <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>Order #{orderId}</Typography>
//           <Box mt={1}>
//             <Typography variant="caption" fontWeight="bold" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>{status}</Typography>
//             {!driverLocation && <LinearProgress sx={{ mt: 1, height: 5, borderRadius: 1 }} />}
//           </Box>
//         </Box>

//         <Box sx={{ height: { xs: 300, sm: 400, md: 450 }, width: "100%", position: "relative" }}>
//           {!driverLocation && customerLocation && (
//             <Box sx={{
//               position: 'absolute', zIndex: 999, top: '50%', left: '50%',
//               transform: 'translate(-50%, -50%)', bgcolor: 'rgba(255,255,255,0.9)',
//               p: 1.5, borderRadius: 1.5, boxShadow: 2, fontSize: { xs: "0.7rem", sm: "0.85rem" }
//             }}>
//               Waiting for driver to start moving...
//             </Box>
//           )}

//           <MapContainer center={customerLocation || [33.888, 35.495]} zoom={13} style={{ height: "100%", width: "100%" }}>
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
//             {customerLocation && <Marker position={[customerLocation.lat, customerLocation.lng]} icon={homeIcon}><Popup><b>My Location</b><br/>Delivery Destination</Popup></Marker>}
//             {driverLocation && <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}><Popup><b>Driver is here!</b></Popup></Marker>}
//             {driverLocation && customerLocation && <Polyline positions={[[driverLocation.lat, driverLocation.lng], [customerLocation.lat, customerLocation.lng]]} color="blue" dashArray="10,10" opacity={0.6} />}
//             <MapController driverLoc={driverLocation} customerLoc={customerLocation} />
//           </MapContainer>
//         </Box>
//       </Paper>
//     </motion.div>
//   );
// }



