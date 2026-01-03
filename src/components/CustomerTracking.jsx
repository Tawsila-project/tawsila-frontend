import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Box, Paper, Typography, LinearProgress, Modal, Button } from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { useNavigate, useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "./api";
import Logo from "../assets/Logo.png";

// 🔹 Icons
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

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "https://tawsila-backend-0shs.onrender.com";

// 🔹 MapController
function MapController({ driverLoc, customerLoc }) {
    const map = useMap();
    useEffect(() => {
        const points = [];
        if (driverLoc) points.push([driverLoc.lat, driverLoc.lng]);
        if (customerLoc) points.push([customerLoc.lat, customerLoc.lng]);

        if (points.length === 2) map.fitBounds(points, { padding: [40, 40], animate: true });
        else if (customerLoc) map.setView([customerLoc.lat, customerLoc.lng], 14, { animate: true });
    }, [driverLoc, customerLoc, map]);

    return null;
}

// 🔹 Reverse Geocoding
const fetchDetailedAddress = async (lat, lng) => {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
        const data = await res.json();
        const { road, house_number, suburb, city, postcode } = data.address || {};
        let detailedAddress = '';
        if (house_number) detailedAddress += house_number + ' ';
        if (road) detailedAddress += road + ', ';
        if (suburb) detailedAddress += suburb + ', ';
        if (city) detailedAddress += city + ', ';
        if (postcode) detailedAddress += postcode;
        return detailedAddress || data.display_name;
    } catch (err) {
        console.error("Reverse geocoding error:", err);
        return null;
    }
};

// 🔹 Main Component
export default function CustomerTracking() {
    const location = useLocation();
    const navigate = useNavigate();
    const [orderId, setOrderId] = useState(location.state?.orderNumber || "");
    const [driverLocation, setDriverLocation] = useState(null);
    const [customerLocation, setCustomerLocation] = useState(null);
    const [status, setStatus] = useState("Connecting...");
    const [eta, setEta] = useState(null);
    const [distance, setDistance] = useState(null);
    const socketRef = useRef(null);
    const [isDeliveryComplete, setIsDeliveryComplete] = useState(false);
    const [isCancelled, setIsCancelled] = useState(false);






    // 🔹 Fetch order data
    useEffect(() => {
        if (!orderId) return;
        const fetchData = async () => {
            try {
                const { data } = await api.get(`/public/order/track/${orderId}`);
                setStatus(`Order Status: ${data.status || "Unknown"}`);
                const custLoc = data.customer?.coords || { lat: 34.12, lng: 35.65 };
                setCustomerLocation(custLoc);

                if (data.status?.toLowerCase() === "in_transit" && data.tracked_location?.lat) {
                    setDriverLocation(data.tracked_location);
                }

                // إذا كانت الحالة delivered أو cancelled عند التحميل
                if (data.status?.toLowerCase() === "delivered") setIsDeliveryComplete(true);
                if (data.status?.toLowerCase() === "cancelled") setIsCancelled(true);
            } catch {
                setStatus("Error: Could not retrieve order data.");
            }
        };
        fetchData();
    }, [orderId]);


    // 🔹 Route info
    useEffect(() => {
        if (driverLocation && customerLocation) {
            const calculateRouteInfo = async () => {
                setEta("Calculating...");
                setDistance("Calculating...");
                try {
                    const response = await api.post('/orders/route-info', {
                        origin: driverLocation,
                        destination: customerLocation,
                    });
                    const routeData = response.data;
                      console.log("ROUTE INFO RESPONSE:", response.data);


                    // setDistance(routeData?.distance || "N/A");
                   setDistance(`${(routeData.distance / 1000).toFixed(2)} km`);
                   setEta(`${Math.round(routeData.duration / 60)} min`);




                } catch (err) {
                    console.error(err);
                    setDistance("N/A");
                    setEta("Error");
                }
            };
            calculateRouteInfo();
        } else {
            setDistance(null);
            setEta(null);
        }
    }, [driverLocation, customerLocation]);

    // 🔹 WebSocket
    useEffect(() => {
        if (!orderId) return;
        const socket = io(SOCKET_URL, {
            transports: ["websocket", "polling"],
            withCredentials: true,
            reconnection: true,
            reconnectionAttempts: 5,
            timeout: 20000,
        });
        socketRef.current = socket;
        socket.on("connect", () => socket.emit("join-order", orderId));

        socket.on("location-updated", (data) => {
            if (data && typeof data.lat === "number" && typeof data.lng === "number") setDriverLocation(data);
            else setDriverLocation(null);
        });

        socket.on("delivery-complete", () => {
            setStatus("Order Status: Delivered! 🎉");
            setDriverLocation(null);
            setIsDeliveryComplete(true);
        });

        socket.on("order-cancelled", () => {
            setStatus("Order Status: Cancelled ❌");
            setDriverLocation(null);
            setIsCancelled(true);
        });

        return () => socket.disconnect();
    }, [orderId]);




    // 🔹 Polling fallback every 30 ثانية للتأكد من تسليم أو إلغاء الطلب
    useEffect(() => {
        if (!orderId) return;
        const interval = setInterval(async () => {
            try {
                const { data } = await api.get(`/public/order/track/${orderId}`);
                const s = data.status?.toLowerCase();
                if (s === "delivered" && !isDeliveryComplete) setIsDeliveryComplete(true);
                if (s === "cancelled" && !isCancelled) setIsCancelled(true);
            } catch (err) {
                console.error("Polling order status error:", err);
            }
        }, 30000);

        return () => clearInterval(interval);
    }, [orderId, isDeliveryComplete, isCancelled]);

    // 🔹 Route info
    useEffect(() => {
        if (driverLocation && customerLocation) {
            const calculateRouteInfo = async () => {
                setEta("Calculating...");
                setDistance("Calculating...");
                try {
                    const response = await api.post('/orders/route-info', {
                        origin: driverLocation,
                        destination: customerLocation,
                    });
                    const routeData = response.data;
                    setDistance(`${(routeData.distance / 1000).toFixed(2)} km`);
                    setEta(`${Math.round(routeData.duration / 60)} min`);
                } catch (err) {
                    console.error(err);
                    setDistance("N/A");
                    setEta("Error");
                }
            };
            calculateRouteInfo();
        } else {
            setDistance(null);
            setEta(null);
        }
    }, [driverLocation, customerLocation]);

    // 🔹 Fetch addresses for markers
    useEffect(() => {
        if (customerLocation) {
            fetchDetailedAddress(customerLocation.lat, customerLocation.lng)
                .then(addr => setCustomerLocation(prev => ({ ...prev, address: addr })));
        }
    }, [customerLocation?.lat, customerLocation?.lng]);

    useEffect(() => {
        if (driverLocation) {
            fetchDetailedAddress(driverLocation.lat, driverLocation.lng)
                .then(addr => setDriverLocation(prev => ({ ...prev, address: addr })));
        }
    }, [driverLocation?.lat, driverLocation?.lng]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Paper sx={{ maxWidth: { xs: 360, sm: 600, md: 720 }, m: "16px auto", borderRadius: 2, overflow: 'hidden' }}>
                {/* Header */}
                <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
                    <img src={Logo} alt="Company Logo" style={{ width: 90, height: 90, display: "flex", margin: "0 auto 8px" }} />
                    <Typography variant="h6" textAlign='center' fontWeight="bold" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>🚚 Delivery Tracking</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>Order #{orderId}</Typography>
                    <Box mt={1}>
                        <Typography variant="caption" fontWeight="bold" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>{status}</Typography>
                        {!driverLocation && !isDeliveryComplete && !isCancelled && <LinearProgress sx={{ mt: 1, height: 5, borderRadius: 1 }} />}
                    </Box>
                </Box>

                {/* Map */}
                <Box sx={{ height: { xs: 300, sm: 400, md: 450 }, width: "100%", position: "relative" }}>
                    {!driverLocation && customerLocation && !isDeliveryComplete && !isCancelled && (
                        <Box sx={{
                            position: 'absolute', zIndex: 999, top: '50%', left: '50%',
                            transform: 'translate(-50%, -50%)', bgcolor: 'rgba(255,255,255,0.9)',
                            p: 1.5, borderRadius: 1.5, boxShadow: 2, fontSize: { xs: "0.7rem", sm: "0.85rem" }
                        }}>
                            Waiting for driver to start moving...
                        </Box>
                    )}

                        {(driverLocation && eta && distance) && (
                        <Box sx={{
                            mt: 2, mx: { xs: '1rem', sm: '3rem', md: '5rem' },
                            display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap'
                        }}>
                            <Typography variant="body1" fontWeight="600" color="primary.main" sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>Estimated Time ⏱️ : {eta}</Typography>
                            <Typography variant="body1" fontWeight="600" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>Remaining Distance 📏 : {distance}</Typography>
                           </Box>
                          )}

                    <MapContainer center={customerLocation ? [customerLocation.lat, customerLocation.lng] : [33.888, 35.495]} zoom={13} style={{ height: "100%", width: "100%" }}>
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                        {customerLocation && <Marker position={[customerLocation.lat, customerLocation.lng]} icon={homeIcon}><Popup>{customerLocation.address || "Delivery Destination"}</Popup></Marker>}
                        {driverLocation && <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}><Popup>{driverLocation.address || "Driver is here!"}</Popup></Marker>}
                        {driverLocation && customerLocation && <Polyline positions={[[driverLocation.lat, driverLocation.lng], [customerLocation.lat, customerLocation.lng]]} color="blue" dashArray="10,10" opacity={0.6} />}
                        <MapController driverLoc={driverLocation} customerLoc={customerLocation} />
                    </MapContainer>
                </Box>

                {/* Delivery Modal */}
                <Modal open={isDeliveryComplete} onClose={() => setIsDeliveryComplete(false)}>
                    <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        width: { xs: "85%", sm: 400 }, p: 4, textAlign: "center", borderRadius: 3,
                        boxShadow: 24, outline: 'none', }}>
                        <CheckCircleIcon sx={{ fontSize: 60, color: "#4CAF50", mb: 2 }} />
                        <Typography variant="h5" fontWeight={700} mb={1}>Delivery Complete! 🎉</Typography>
                        <Typography variant="body1" color="text.secondary" mb={3}>Your order **#{orderId}** has been successfully delivered.</Typography>
                        <Button variant="contained" color="primary" fullWidth sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600, mb: 1.5 }}
                            onClick={() => { setIsDeliveryComplete(false); navigate(`/RateDelivery?orderId=${orderId}`); }}>Rate Your Experience ⭐</Button>
                        <Button variant="outlined" color="inherit" fullWidth onClick={() => { setIsDeliveryComplete(false); navigate("/"); }}>Close</Button>
                    </Paper>
                </Modal>

                {/* Cancel Modal */}
                <Modal open={isCancelled} onClose={() => setIsCancelled(false)}>
                    <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
                        width: { xs: "85%", sm: 400 }, p: 4, textAlign: "center", borderRadius: 3,
                        boxShadow: 24, outline: 'none', }}>
                        <Typography variant="h5" fontWeight={700} mb={2}>Order Cancelled ❌</Typography>
                        <Typography variant="body1" color="text.secondary" mb={3}>Your order **#{orderId}** has been cancelled by the restaurant or driver.</Typography>
                        <Button variant="outlined" color="inherit" fullWidth onClick={() => { setIsCancelled(false); navigate("/"); }}>Close</Button>
                    </Paper>
                </Modal>
            </Paper>
        </motion.div>
    );
}








// import { useState, useEffect, useRef } from "react";
// import { motion } from "framer-motion";
// import { Box, Paper, Typography, LinearProgress, Modal, Button } from "@mui/material";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import { useNavigate, useLocation } from "react-router-dom";
// import { io } from "socket.io-client";
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import api from "./api";
// import Logo from "../assets/Logo.png";

// // 🔹 Icons
// const driverIcon = new L.Icon({
//     iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
//     iconSize: [36, 36],
//     iconAnchor: [18, 18],
//     popupAnchor: [0, -20]
// });

// const homeIcon = new L.Icon({
//     iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619153.png",
//     iconSize: [36, 36],
//     iconAnchor: [18, 36],
//     popupAnchor: [0, -36]
// });

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "https://tawsila-backend-0shs.onrender.com";

// // 🔹 MapController
// function MapController({ driverLoc, customerLoc }) {
//     const map = useMap();
//     useEffect(() => {
//         const points = [];
//         if (driverLoc) points.push([driverLoc.lat, driverLoc.lng]);
//         if (customerLoc) points.push([customerLoc.lat, customerLoc.lng]);

//         if (points.length === 2) map.fitBounds(points, { padding: [40, 40], animate: true });
//         else if (customerLoc) map.setView([customerLoc.lat, customerLoc.lng], 14, { animate: true });
//     }, [driverLoc, customerLoc, map]);

//     return null;
// }

// // 🔹 Reverse Geocoding
// const fetchDetailedAddress = async (lat, lng) => {
//     try {
//         const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
//         const data = await res.json();
//         const { road, house_number, suburb, city, postcode } = data.address || {};
//         let detailedAddress = '';
//         if (house_number) detailedAddress += house_number + ' ';
//         if (road) detailedAddress += road + ', ';
//         if (suburb) detailedAddress += suburb + ', ';
//         if (city) detailedAddress += city + ', ';
//         if (postcode) detailedAddress += postcode;
//         return detailedAddress || data.display_name;
//     } catch (err) {
//         console.error("Reverse geocoding error:", err);
//         return null;
//     }
// };

// // 🔹 Main Component
// export default function CustomerTracking() {
//     const location = useLocation();
//     const navigate = useNavigate();
//     const [orderId, setOrderId] = useState(location.state?.orderNumber || "");
//     const [driverLocation, setDriverLocation] = useState(null);
//     const [customerLocation, setCustomerLocation] = useState(null);
//     const [status, setStatus] = useState("Connecting...");
//     const [eta, setEta] = useState(null);
//     const [distance, setDistance] = useState(null);
//     const socketRef = useRef(null);
//     const [isDeliveryComplete, setIsDeliveryComplete] = useState(false);

//     // 🔹 Fetch order data
//     useEffect(() => {
//         if (!orderId) return;
//         const fetchData = async () => {
//             try {
//                 const { data } = await api.get(`/public/order/track/${orderId}`);
//                 setStatus(`Order Status: ${data.status || "Unknown"}`);
//                 const custLoc = data.customer?.coords || { lat: 34.12, lng: 35.65 };
//                 setCustomerLocation(custLoc);

//                 if (data.status?.toLowerCase() === "in_transit" && data.tracked_location?.lat) {
//                     setDriverLocation(data.tracked_location);
//                 }
//             } catch {
//                 setStatus("Error: Could not retrieve order data.");
//             }
//         };
//         fetchData();
//     }, [orderId]);

//     // 🔹 WebSocket
//     useEffect(() => {
//         if (!orderId) return;
//         const socket = io(SOCKET_URL, {
//             transports: ["websocket", "polling"],
//             withCredentials: true,
//             reconnection: true,
//             reconnectionAttempts: 5,
//             timeout: 20000,
//         });
//         socketRef.current = socket;
//         socket.on("connect", () => socket.emit("join-order", orderId));

//         socket.on("location-updated", (data) => {
//             if (data && typeof data.lat === "number" && typeof data.lng === "number") setDriverLocation(data);
//             else setDriverLocation(null);
//         });

//         socket.on("delivery-complete", () => {
//             setStatus("Order Status: Delivered! 🎉");
//             setDriverLocation(null);
//             setIsDeliveryComplete(true);
//         });

//         // 🔹 إضافة الاستماع لإلغاء الطلب
//         socket.on("order-cancelled", ({ cancelledAt }) => {
//             setStatus("Order Status: Cancelled ❌");
//             setDriverLocation(null);
//             alert(`Your order #${orderId} has been cancelled.`); // يمكنك استبدالها بمودال جميل
//         });

//         return () => socket.disconnect();
//     }, [orderId]);

//     // 🔹 Route info
//     useEffect(() => {
//         if (driverLocation && customerLocation) {
//             const calculateRouteInfo = async () => {
//                 setEta("Calculating...");
//                 setDistance("Calculating...");
//                 try {
//                     const response = await api.post('/orders/route-info', {
//                         origin: driverLocation,
//                         destination: customerLocation,
//                     });
//                     const routeData = response.data;
//                       console.log("ROUTE INFO RESPONSE:", response.data);


//                     // setDistance(routeData?.distance || "N/A");
//                    setDistance(`${(routeData.distance / 1000).toFixed(2)} km`);
// setEta(`${Math.round(routeData.duration / 60)} min`);




//                 } catch (err) {
//                     console.error(err);
//                     setDistance("N/A");
//                     setEta("Error");
//                 }
//             };
//             calculateRouteInfo();
//         } else {
//             setDistance(null);
//             setEta(null);
//         }
//     }, [driverLocation, customerLocation]);

//     // 🔹 Fetch addresses for markers
//     useEffect(() => {
//         if (customerLocation) {
//             fetchDetailedAddress(customerLocation.lat, customerLocation.lng)
//                 .then(addr => setCustomerLocation(prev => ({ ...prev, address: addr })));
//         }
//     }, [customerLocation?.lat, customerLocation?.lng]);

//     useEffect(() => {
//         if (driverLocation) {
//             fetchDetailedAddress(driverLocation.lat, driverLocation.lng)
//                 .then(addr => setDriverLocation(prev => ({ ...prev, address: addr })));
//         }
//     }, [driverLocation?.lat, driverLocation?.lng]);

//     return (
//         <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
//             <Paper sx={{ maxWidth: { xs: 360, sm: 600, md: 720 }, m: "16px auto", borderRadius: 2, overflow: 'hidden' }}>
//                 {/* Header */}
//                 <Box sx={{ p: { xs: 2, sm: 3 }, bgcolor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
//                     <img src={Logo} alt="Company Logo" style={{ width: 90, height: "90", display: "flex", margin: "0 auto 8px" }} />
//                     <Typography variant="h6" textAlign='center' fontWeight="bold" sx={{ fontSize: { xs: "1rem", sm: "1.25rem" } }}>🚚 Delivery Tracking</Typography>
//                     <Typography variant="body2" color="text.secondary" sx={{ fontSize: { xs: "0.75rem", sm: "0.85rem" } }}>Order #{orderId}</Typography>
//                     <Box mt={1}>
//                         <Typography variant="caption" fontWeight="bold" sx={{ fontSize: { xs: "0.65rem", sm: "0.75rem" } }}>{status}</Typography>
//                         {!driverLocation && <LinearProgress sx={{ mt: 1, height: 5, borderRadius: 1 }} />}
//                     </Box>
//                 </Box>

//                 {/* Map */}
//                 <Box sx={{ height: { xs: 300, sm: 400, md: 450 }, width: "100%", position: "relative" }}>
//                     {!driverLocation && customerLocation && (
//                         <Box sx={{
//                             position: 'absolute', zIndex: 999, top: '50%', left: '50%',
//                             transform: 'translate(-50%, -50%)', bgcolor: 'rgba(255,255,255,0.9)',
//                             p: 1.5, borderRadius: 1.5, boxShadow: 2, fontSize: { xs: "0.7rem", sm: "0.85rem" }
//                         }}>
//                             Waiting for driver to start moving...
//                         </Box>
//                     )}

//                     {(driverLocation && eta && distance) && (
//                         <Box sx={{
//                             mt: 2, mx: { xs: '1rem', sm: '3rem', md: '5rem' },
//                             display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap'
//                         }}>
//                             <Typography variant="body1" fontWeight="600" color="primary.main" sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>Estimated Time ⏱️ : {eta}</Typography>
//                             <Typography variant="body1" fontWeight="600" color="text.secondary" sx={{ fontSize: { xs: "0.8rem", sm: "1rem" } }}>Remaining Distance 📏 : {distance}</Typography>
//                         </Box>
//                     )}

//                     <MapContainer center={customerLocation ? [customerLocation.lat, customerLocation.lng] : [33.888, 35.495]} zoom={13} style={{ height: "100%", width: "100%" }}>
//                         <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
//                         {customerLocation && <Marker position={[customerLocation.lat, customerLocation.lng]} icon={homeIcon}><Popup>{customerLocation.address || "Delivery Destination"}</Popup></Marker>}
//                         {driverLocation && <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}><Popup>{driverLocation.address || "Driver is here!"}</Popup></Marker>}
//                         {driverLocation && customerLocation && <Polyline positions={[[driverLocation.lat, driverLocation.lng], [customerLocation.lat, customerLocation.lng]]} color="blue" dashArray="10,10" opacity={0.6} />}
//                         <MapController driverLoc={driverLocation} customerLoc={customerLocation} />
//                     </MapContainer>
//                 </Box>

//                 {/* Delivery Modal */}
//                 <Modal open={isDeliveryComplete} onClose={() => setIsDeliveryComplete(false)}>
//                     <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)",
//                         width: { xs: "85%", sm: 400 }, p: 4, textAlign: "center", borderRadius: 3,
//                         boxShadow: 24, outline: 'none', }}>
//                         <CheckCircleIcon sx={{ fontSize: 60, color: "#4CAF50", mb: 2 }} />
//                         <Typography variant="h5" fontWeight={700} mb={1}>Delivery Complete! 🎉</Typography>
//                         <Typography variant="body1" color="text.secondary" mb={3}>Your order **#{orderId}** has been successfully delivered.</Typography>
//                         <Button variant="contained" color="primary" fullWidth sx={{ py: 1.5, fontSize: "1rem", fontWeight: 600, mb: 1.5 }}
//                             onClick={() => { setIsDeliveryComplete(false); navigate(`/RateDelivery?orderId=${orderId}`); }}>Rate Your Experience ⭐</Button>
//                         <Button variant="outlined" color="inherit" fullWidth onClick={() => { setIsDeliveryComplete(false); navigate("/"); }}>Close</Button>
//                     </Paper>
//                 </Modal>
//             </Paper>
//         </motion.div>
//     );
// }



