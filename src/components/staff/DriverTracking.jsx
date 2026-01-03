// import { useEffect, useState, useRef, useCallback } from "react";
// import {
//   Box, Button, Typography, Paper, CircularProgress, Divider,
//   Card, CardContent, Alert, Dialog, DialogTitle,
//   DialogContent, DialogActions
// } from "@mui/material";
// import { io } from "socket.io-client";
// import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import api from "../api";
// import DirectionsCar from '@mui/icons-material/DirectionsCar';
// import LocationOn from '@mui/icons-material/LocationOn';
// import GpsFixed from '@mui/icons-material/GpsFixed';
// import Wifi from '@mui/icons-material/Wifi';
// import ReactDOMServer from 'react-dom/server';

// // ===================== ICONS SETUP =====================
// const createIconMarkup = (IconComponent, color) =>
//   ReactDOMServer.renderToString(
//     <IconComponent sx={{ fontSize: 36, color: color, transform: 'translateY(15%)' }} />
//   );

// const driverIcon = new L.divIcon({
//   html: createIconMarkup(DirectionsCar, '#0ABE51'),
//   className: '',
//   iconSize: [36, 36],
//   iconAnchor: [18, 36],
//   popupAnchor: [0, -36],
// });

// const homeIcon = new L.divIcon({
//   html: createIconMarkup(LocationOn, '#f44336'),
//   className: '',
//   iconSize: [36, 36],
//   iconAnchor: [18, 36],
//   popupAnchor: [0, -36],
// });

// // ===================== SOCKET & USER =====================
// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "https://tawsila-backend-0shs.onrender.com";
// const userRole = 'driver';
// const driverZIndex = userRole === 'driver' ? 1000 : 10;
// const customerZIndex = userRole === 'customer' ? 1000 : 10;

// // ===================== COMPONENT =====================
// export default function DriverTracking({ initialOrderNumber, driverId }) {

//   // ===================== STATE =====================
//   const getPersistentOrderId = () => {
//     if (initialOrderNumber) return initialOrderNumber;
//     if (driverId) return localStorage.getItem("acceptedOrderId_" + driverId) || null;
//     return null;
//   };

//   const initialAcceptedOrderId = getPersistentOrderId();

//   const [availableOrders, setAvailableOrders] = useState([]);
//   const [isTracking, setIsTracking] = useState(false);
//   const [currentPos, setCurrentPos] = useState(null);
//   const [currentAddress, setCurrentAddress] = useState(null);
//   const [customerPos, setCustomerPos] = useState(null);
//   const [customerAddress, setCustomerAddress] = useState(null);
//   const [accuracy, setAccuracy] = useState(null);
//   const [statusMsg, setStatusMsg] = useState("Ready…");
//   const [socketConnected, setSocketConnected] = useState(false);
//   const [error, setError] = useState(null);
//   const [newOrder, setNewOrder] = useState(null);
//   const [currentOrderId, setCurrentOrderId] = useState(initialAcceptedOrderId);
//   const [isOrderAccepted, setIsOrderAccepted] = useState(!!initialAcceptedOrderId);
//   const [isConfirmingStop, setIsConfirmingStop] = useState(false);
//   const [isConfirmingDelivered, setIsConfirmingDelivered] = useState(false);

//   // ===================== REFS =====================
//   const watchIdRef = useRef(null);
//   const socketRef = useRef(null);

//   // ===================== HELPER: REVERSE GEOCODING =====================
//   const fetchDetailedAddress = async (lat, lng) => {
//     try {
//       const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`);
//       const data = await res.json();
//       const { road, house_number, suburb, city, postcode } = data.address || {};
//       let detailedAddress = '';
//       if (house_number) detailedAddress += house_number + ' ';
//       if (road) detailedAddress += road + ', ';
//       if (suburb) detailedAddress += suburb + ', ';
//       if (city) detailedAddress += city + ', ';
//       if (postcode) detailedAddress += postcode;
//       return detailedAddress || data.display_name || "Unknown location";
//     } catch (err) {
//       console.error("Reverse geocoding error:", err);
//       return "Unknown location";
//     }
//   };

//   // ===================== FETCH CUSTOMER LOCATION =====================
//   const fetchCustomerLocation = useCallback(async (orderId) => {
//     try {
//       const response = await api.get(`/public/order/track/${orderId}`);
//       const customerCoords = response.data.customer.coords;
//       if (customerCoords && customerCoords.lat && customerCoords.lng) {
//         setCustomerPos(customerCoords);
//         const address = await fetchDetailedAddress(customerCoords.lat, customerCoords.lng);
//         if (address) setCustomerAddress(address);
//       }
//     } catch (err) {
//       console.error("Error fetching customer location:", err);
//     }
//   }, []);

//   // ===================== SOCKET.IO SETUP =====================
//   useEffect(() => {
//     if (!driverId) return;
//     const socket = io(SOCKET_URL, { transports: ["websocket", "polling"], withCredentials: true });
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       setSocketConnected(true);
//       setStatusMsg("Connected ✔ Ready to receive orders");
//       socket.emit("driver-join", driverId);
//     });

//     const handleNewOrder = (orderData) => {
//       if (!isOrderAccepted && orderData.order_number !== currentOrderId) {
//         setAvailableOrders(prev => [orderData, ...prev]);
//         setNewOrder(orderData);
//       }
//     };

//     socket.on("new-order", handleNewOrder);

//     socket.on("order-accepted", (data) => {
//       setAvailableOrders(prev => prev.filter(o => o.order_number !== data.order_number));
//       if (newOrder && newOrder.order_number === data.order_number) setNewOrder(null);
//     });

//     socket.on("disconnect", () => {
//       setSocketConnected(false);
//       setStatusMsg("Disconnected… Reconnecting");
//     });

//     return () => {
//       socket.off("new-order", handleNewOrder);
//       socket.disconnect();
//     };
//   }, [driverId, isOrderAccepted, newOrder, currentOrderId]);

//   // ===================== FETCH AVAILABLE ORDERS =====================
//   const fetchAvailableOrders = async () => {
//     if (!driverId) return;
//     try {
//       const res = await api.get(`/orders/orders/available`);
//       if (res.data?.orders) {
//         const filteredOrders = res.data.orders.filter(o => o.order_number !== currentOrderId);
//         setAvailableOrders(filteredOrders);
//       }
//     } catch (err) {
//       console.error(err);
//       setStatusMsg(`Error fetching orders: ${err.message}`);
//     }
//   };

//   useEffect(() => {
//     if (!isOrderAccepted) fetchAvailableOrders();
//   }, [driverId, isOrderAccepted, currentOrderId]);

//   // ===================== HANDLE ACCEPT ORDER =====================
//   const handleAcceptOrder = async (orderToAccept) => {
//     const orderNumber = orderToAccept.order_number;
//     try {
//       setStatusMsg(`Accepting order #${orderNumber}...`);
//       const res = await api.post("/orders/accept", { order_number: orderNumber, driver_id: driverId });
//       if (res.status === 200 || res.status === 201) {
//         localStorage.setItem("acceptedOrderId_" + driverId, orderNumber);
//         setCurrentOrderId(orderNumber);
//         setIsOrderAccepted(true);
//         setNewOrder(null);
//         if (orderToAccept.customer?.coords) {
//           setCustomerPos(orderToAccept.customer.coords);
//           const addr = await fetchDetailedAddress(orderToAccept.customer.coords.lat, orderToAccept.customer.coords.lng);
//           if (addr) setCustomerAddress(addr);
//         } else {
//           await fetchCustomerLocation(orderNumber);
//         }
//         setAvailableOrders(prev => prev.filter(o => o.order_number !== orderNumber));
//         setStatusMsg(`Order #${orderNumber} accepted! Ready to start delivery.`);
//       }
//     } catch (err) {
//       console.error(err);
//       const errMsg = err.response?.data?.error || "Acceptance failed!";
//       setStatusMsg(`Failed to accept order: ${errMsg}`);
//       alert(errMsg);
//     }
//   };

//   // ===================== MAP CENTERING =====================
//   function MapCentering({ driverPos, customerPos }) {
//     const map = useMap();
//     useEffect(() => {
//       if (driverPos && customerPos) {
//         map.fitBounds([driverPos, [customerPos.lat, customerPos.lng]], { padding: [50, 50], maxZoom: 16 });
//       } else if (driverPos) {
//         map.setView(driverPos, map.getZoom() < 14 ? 14 : map.getZoom());
//       } else if (customerPos) {
//         map.setView([customerPos.lat, customerPos.lng], 14);
//       }
//     }, [driverPos, customerPos, map]);
//     return null;
//   }

//   // ===================== START TRACKING =====================
//   const startTracking = () => {
//     if (!isOrderAccepted || !currentOrderId) return;

//     const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

//     if (watchIdRef.current) {
//       navigator.geolocation.clearWatch(watchIdRef.current);
//     }

//     setIsTracking(true);
//     setStatusMsg("📡 Starting location tracking...");

//     if (isMobile && navigator.geolocation) {
//       watchIdRef.current = navigator.geolocation.watchPosition(
//         async (pos) => {
//           const { latitude, longitude, accuracy } = pos.coords;
//           setCurrentPos({ lat: latitude, lng: longitude });
//           setAccuracy(accuracy);
//           setStatusMsg(`📡 GPS accuracy: ${Math.round(accuracy)}m`);
//           if (socketRef.current?.connected) {
//             socketRef.current.emit("update-location", {
//               orderId: currentOrderId,
//               driverId,
//               lat: latitude,
//               lng: longitude,
//               accuracy,
//               timestamp: Date.now(),
//             });
//           }
//         },
//         (err) => setStatusMsg("❌ GPS Error: " + err.message),
//         { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 }
//       );
//       return;
//     }

//     // Desktop mock
//     let lat = 34.4386, lng = 35.8495;
//     watchIdRef.current = setInterval(() => {
//       lat += (Math.random() - 0.5) * 0.0005;
//       lng += (Math.random() - 0.5) * 0.0005;
//       setCurrentPos({ lat, lng });
//       if (socketRef.current?.connected) {
//         socketRef.current.emit("update-location", {
//           orderId: currentOrderId,
//           driverId,
//           lat,
//           lng,
//           accuracy: 20,
//           timestamp: Date.now(),
//         });
//       }
//     }, 3000);
//   };

//   // ===================== STOP TRACKING =====================
//   const stopTracking = () => setIsConfirmingStop(true);

//   const handleConfirmStop = async () => {
//     setIsConfirmingStop(false);
//     navigator.geolocation.clearWatch(watchIdRef.current);
//     watchIdRef.current = null;
//     setIsTracking(false);
//     setStatusMsg("Delivery stopped. You can resume or mark as delivered.");
//   };

//   // ===================== MARK AS DELIVERED =====================
//   const handleMarkDelivered = async () => {
//     setIsConfirmingDelivered(false);
//     navigator.geolocation.clearWatch(watchIdRef.current);
//     watchIdRef.current = null;
//     setIsTracking(false);
//     setStatusMsg("Delivery completed! Awaiting new order.");

//     if (socketRef.current?.connected && currentOrderId && currentPos) {
//       socketRef.current.emit("update-location", { orderId: currentOrderId, driverId, lat: currentPos.lat, lng: currentPos.lng });
//       socketRef.current.emit("order-delivered", { orderId: currentOrderId, driverId });
//     }

//     localStorage.removeItem("acceptedOrderId_" + driverId);
//     setCurrentOrderId(null);
//     setIsOrderAccepted(false);
//     await fetchAvailableOrders();
//   };

//   // ===================== RENDER =====================
//   if (!isOrderAccepted) {
//     return (
//       <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 3, px: 2 }}>
//         <Paper elevation={8} sx={{ width: "100%", maxWidth: 600, p: 3, borderRadius: 4 }}>
//           <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>📦 Available Orders ({availableOrders.length})</Typography>
//           <Divider sx={{ mb: 3 }} />
//           {availableOrders.length === 0 ? (
//             <Alert severity="info" sx={{ textAlign: 'center' }}>Waiting for new delivery requests...</Alert>
//           ) : (
//             <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//               {availableOrders.map((order) => (
//                 <Card key={order.order_number} variant="outlined" sx={{ p: 1.5 }}>
//                   <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
//                     <Typography variant="h6" color="primary">Order #{order.order_number}</Typography>
//                     <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                       <LocationOn fontSize="small" /> <strong>Address:</strong> {order.customer?.address || 'N/A'}
//                     </Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       <strong>Item:</strong> {order.type_of_item || 'General'} | <strong>Received:</strong> {new Date(order.createdAt).toLocaleTimeString()}
//                     </Typography>
//                     <Button variant="contained" color="success" size="small" onClick={() => handleAcceptOrder(order)} sx={{ mt: 1, float: 'right' }}>Accept</Button>
//                   </CardContent>
//                 </Card>
//               ))}
//             </Box>
//           )}
//         </Paper>
//       </Box>
//     );
//   }

//   // ACCEPTED ORDER MAP
//   return (
//     <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 3, px: 2 }}>
//       <Paper elevation={8} sx={{ width: "100%", maxWidth: 600, p: 3, borderRadius: 4 }}>
//         <Typography fontWeight={700} variant="h5" textAlign="center" mb={2} sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
//           <DirectionsCar sx={{ fontSize: 36, color: "#0ABE51" }} /> Live Driver Tracking
//         </Typography>

//         <Paper elevation={0} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, mb: 2, borderRadius: 3,
//           background: socketConnected ? "#e6f4ea" : "#ffeaea", border: socketConnected ? "1px solid #4caf50" : "1px solid #f44336" }}>
//           <Typography variant="body2" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//             <Wifi fontSize="small" color={socketConnected ? "success" : "error"} />{socketConnected ? "Connected" : "Offline"}
//           </Typography>
//           <Typography variant="body2">{statusMsg}</Typography>
//         </Paper>

//         <Box sx={{ p: 1.5, mb: 2, borderRadius: 3, background: "#f7f9fc", border: "1px solid #e0e6ed", fontSize: 0.95 }}>
//           <Typography><strong>Order ID:</strong> {currentOrderId}</Typography>
//           <Typography><strong>Driver ID:</strong> {driverId}</Typography>
//           <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}><GpsFixed fontSize="small" color="primary" /> <strong>Status:</strong> {statusMsg}</Typography>
//         </Box>

//         <Box sx={{ height: 300, width: "100%", borderRadius: 3, overflow: "hidden", mb: 2 }}>
//           {currentPos ? (
//             <MapContainer center={currentPos} zoom={16} style={{ height: "100%", width: "100%" }}>
//               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//               <MapCentering driverPos={currentPos} customerPos={customerPos} />

//               <Marker position={currentPos} icon={driverIcon} zIndexOffset={driverZIndex}>
//                 <Popup>{currentAddress || "Your Location"}</Popup>
//               </Marker>

//               {customerPos && (
//                 <Marker position={[customerPos.lat, customerPos.lng]} icon={homeIcon} zIndexOffset={customerZIndex}>
//                   <Popup>{customerAddress || "Customer Location"}</Popup>
//                 </Marker>
//               )}

//               {currentPos && customerPos && (
//                 <Polyline positions={[currentPos, [customerPos.lat, customerPos.lng]]} color="blue" dashArray="10,10" opacity={0.6} />
//               )}
//             </MapContainer>
//           ) : (
//             <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
//               <CircularProgress size={24} />
//               <Typography color="textSecondary" fontSize={0.85}>Waiting for GPS…</Typography>
//             </Box>
//           )}
//         </Box>

//         <Box display="flex" flexDirection="column" gap={1.5}>
//           {!isTracking ? (
//             <Button variant="contained" fullWidth color="success" onClick={startTracking} disabled={!isOrderAccepted}>Start Tracking</Button>
//           ) : (
//             <>
//               <Button variant="contained" fullWidth color="error" onClick={stopTracking}>Stop Tracking</Button>
//               <Button variant="contained" fullWidth color="primary" onClick={() => setIsConfirmingDelivered(true)}>Mark as Delivered</Button>
//             </>
//           )}
//         </Box>

//         {/* STOP TRACKING CONFIRMATION */}
//         <Dialog open={isConfirmingStop} onClose={() => setIsConfirmingStop(false)} maxWidth="xs" fullWidth>
//           <DialogTitle sx={{ color: "error.main", fontWeight: 700 }}>Confirm Stop Tracking</DialogTitle>
//           <Divider />
//           <DialogContent>
//             <Typography variant="body1">Are you sure you want to stop tracking without marking the delivery as completed?</Typography>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setIsConfirmingStop(false)}>Cancel</Button>
//             <Button onClick={handleConfirmStop} color="error" variant="contained">Stop Tracking</Button>
//           </DialogActions>
//         </Dialog>

//         {/* MARK DELIVERED CONFIRMATION */}
//         <Dialog open={isConfirmingDelivered} onClose={() => setIsConfirmingDelivered(false)} maxWidth="xs" fullWidth>
//           <DialogTitle sx={{ color: "success.main", fontWeight: 700 }}>Confirm Delivery</DialogTitle>
//           <Divider />
//           <DialogContent>
//             <Typography variant="body1">Are you sure you want to mark Order #{currentOrderId} as delivered?</Typography>
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={() => setIsConfirmingDelivered(false)}>Cancel</Button>
//             <Button onClick={handleMarkDelivered} color="success" variant="contained">Mark as Delivered</Button>
//           </DialogActions>
//         </Dialog>
//       </Paper>
//     </Box>
//   );
// }



import { useEffect, useState, useRef, useCallback } from "react";
import {
  Box, Button, Typography, Paper, CircularProgress, Divider,
  Card, CardContent, Alert, Dialog, DialogTitle,
  DialogContent, DialogActions
} from "@mui/material";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api";
import DirectionsCar from '@mui/icons-material/DirectionsCar';
import LocationOn from '@mui/icons-material/LocationOn';
import GpsFixed from '@mui/icons-material/GpsFixed';
import Wifi from '@mui/icons-material/Wifi';
import ReactDOMServer from 'react-dom/server';

// ===================== ICONS SETUP =====================
const createIconMarkup = (IconComponent, color) =>
  ReactDOMServer.renderToString(
    <IconComponent sx={{ fontSize: 36, color: color, transform: 'translateY(15%)' }} />
  );

const driverIcon = new L.divIcon({
  html: createIconMarkup(DirectionsCar, '#0ABE51'),
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

const homeIcon = new L.divIcon({
  html: createIconMarkup(LocationOn, '#f44336'),
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 36],
  popupAnchor: [0, -36],
});

// ===================== SOCKET & USER =====================
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "https://tawsila-backend-0shs.onrender.com";
const userRole = 'driver';
const driverZIndex = userRole === 'driver' ? 1000 : 10;
const customerZIndex = userRole === 'customer' ? 1000 : 10;

// ===================== COMPONENT =====================
export default function DriverTracking({ initialOrderNumber, driverId }) {

  // ===================== STATE =====================
  const getPersistentOrderId = () => {
    if (initialOrderNumber) return initialOrderNumber;
    if (driverId) return localStorage.getItem("acceptedOrderId_" + driverId) || null;
    return null;
  };

  const initialAcceptedOrderId = getPersistentOrderId();

  const [availableOrders, setAvailableOrders] = useState([]);
  const [isTracking, setIsTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [currentAddress, setCurrentAddress] = useState(null);
  const [customerPos, setCustomerPos] = useState(null);
  const [customerAddress, setCustomerAddress] = useState(null);
  const [accuracy, setAccuracy] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Ready…");
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState(null);
  const [newOrder, setNewOrder] = useState(null);
  const [currentOrderId, setCurrentOrderId] = useState(initialAcceptedOrderId);
  const [isOrderAccepted, setIsOrderAccepted] = useState(!!initialAcceptedOrderId);
  const [isConfirmingStop, setIsConfirmingStop] = useState(false);
  const [isConfirmingDelivered, setIsConfirmingDelivered] = useState(false);
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);

  // ===================== REFS =====================
  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  // ===================== HELPER: REVERSE GEOCODING =====================
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
      return detailedAddress || data.display_name || "Unknown location";
    } catch (err) {
      console.error("Reverse geocoding error:", err);
      return "Unknown location";
    }
  };

  // ===================== FETCH CUSTOMER LOCATION =====================
  const fetchCustomerLocation = useCallback(async (orderId) => {
    try {
      const response = await api.get(`/public/order/track/${orderId}`);
      const customerCoords = response.data.customer.coords;
      if (customerCoords && customerCoords.lat && customerCoords.lng) {
        setCustomerPos(customerCoords);
        const address = await fetchDetailedAddress(customerCoords.lat, customerCoords.lng);
        if (address) setCustomerAddress(address);
      }
    } catch (err) {
      console.error("Error fetching customer location:", err);
    }
  }, []);

  // ===================== SOCKET.IO SETUP =====================
  useEffect(() => {
    if (!driverId) return;
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"], withCredentials: true });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setStatusMsg("Connected ✔ Ready to receive orders");
      socket.emit("driver-join", driverId);
    });

    const handleNewOrder = (orderData) => {
      if (!isOrderAccepted && orderData.order_number !== currentOrderId) {
        setAvailableOrders(prev => [orderData, ...prev]);
        setNewOrder(orderData);
      }
    };

    socket.on("new-order", handleNewOrder);

    socket.on("order-accepted", (data) => {
      setAvailableOrders(prev => prev.filter(o => o.order_number !== data.order_number));
      if (newOrder && newOrder.order_number === data.order_number) setNewOrder(null);
    });

    socket.on("order-cancelled", (data) => {
      if (data.orderId === currentOrderId) {
        alert(`Order #${currentOrderId} has been cancelled!`);
        // stopTrackingImmediately();
      }
      setAvailableOrders(prev => prev.filter(o => o.order_number !== data.orderId));
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      setStatusMsg("Disconnected… Reconnecting");
    });

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.disconnect();
    };
  }, [driverId, isOrderAccepted, newOrder, currentOrderId]);

  // ===================== FETCH AVAILABLE ORDERS =====================
  const fetchAvailableOrders = async () => {
    if (!driverId) return;
    try {
      const res = await api.get(`/orders/orders/available`);
      if (res.data?.orders) {
        const filteredOrders = res.data.orders.filter(o => o.order_number !== currentOrderId);
        setAvailableOrders(filteredOrders);
      }
    } catch (err) {
      console.error(err);
      setStatusMsg(`Error fetching orders: ${err.message}`);
    }
  };

  useEffect(() => {
    if (!isOrderAccepted) fetchAvailableOrders();
  }, [driverId, isOrderAccepted, currentOrderId]);

  // ===================== HANDLE ACCEPT ORDER =====================
  const handleAcceptOrder = async (orderToAccept) => {
    const orderNumber = orderToAccept.order_number;
    try {
      setStatusMsg(`Accepting order #${orderNumber}...`);
      const res = await api.post("/orders/accept", { order_number: orderNumber, driver_id: driverId });
      if (res.status === 200 || res.status === 201) {
        localStorage.setItem("acceptedOrderId_" + driverId, orderNumber);
        setCurrentOrderId(orderNumber);
        setIsOrderAccepted(true);
        setNewOrder(null);
        if (orderToAccept.customer?.coords) {
          setCustomerPos(orderToAccept.customer.coords);
          const addr = await fetchDetailedAddress(orderToAccept.customer.coords.lat, orderToAccept.customer.coords.lng);
          if (addr) setCustomerAddress(addr);
        } else {
          await fetchCustomerLocation(orderNumber);
        }
        setAvailableOrders(prev => prev.filter(o => o.order_number !== orderNumber));
        setStatusMsg(`Order #${orderNumber} accepted! Ready to start delivery.`);
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error || "Acceptance failed!";
      setStatusMsg(`Failed to accept order: ${errMsg}`);
      alert(errMsg);
    }
  };

  // ===================== MAP CENTERING =====================
  function MapCentering({ driverPos, customerPos }) {
    const map = useMap();
    useEffect(() => {
      if (driverPos && customerPos) {
        map.fitBounds([driverPos, [customerPos.lat, customerPos.lng]], { padding: [50, 50], maxZoom: 16 });
      } else if (driverPos) {
        map.setView(driverPos, map.getZoom() < 14 ? 14 : map.getZoom());
      } else if (customerPos) {
        map.setView([customerPos.lat, customerPos.lng], 14);
      }
    }, [driverPos, customerPos, map]);
    return null;
  }

  // ===================== START TRACKING =====================


  const startSimulation = (sendLocation) => {
  let lat = 34.4386;
  let lng = 35.8495;

  setStatusMsg("🧪 Simulation mode (GPS unavailable)");

  watchIdRef.current = setInterval(() => {
    lat += (Math.random() - 0.5) * 0.0003;
    lng += (Math.random() - 0.5) * 0.0003;
    sendLocation(lat, lng, 20);
  }, 3000);
};

 
const startTracking = () => {
  if (!isOrderAccepted || !currentOrderId) return;

  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  // تنظيف أي tracking سابق
  if (watchIdRef.current) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    clearInterval(watchIdRef.current);
  }

  setIsTracking(true);
  setStatusMsg("📡 Searching for GPS...");

  const sendLocation = (lat, lng, accuracy = 20) => {
    setCurrentPos({ lat, lng });
    setAccuracy(accuracy);

    if (socketRef.current?.connected) {
      socketRef.current.emit("update-location", {
        orderId: currentOrderId,
        driverId,
        lat,
        lng,
        accuracy,
        timestamp: Date.now(),
      });
    }
  };

  // ======================
  // 📱 Mobile with GPS
  if (isMobile && navigator.geolocation) {
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;

        // ❌ دقة سيئة جدًا
        if (accuracy > 1000) {
          setStatusMsg("⚠️ GPS accuracy too low, switching to simulation...");
          navigator.geolocation.clearWatch(watchIdRef.current);
          startSimulation(sendLocation);
          return;
        }

        setStatusMsg(`📡 GPS accuracy: ${Math.round(accuracy)}m`);
        sendLocation(latitude, longitude, accuracy);
      },
      (err) => {
        console.warn("GPS error:", err.message);
        setStatusMsg("⚠️ GPS failed, switching to simulation...");
        startSimulation(sendLocation);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 5000,
      }
    );
    return;
  }

  // ======================
  // 💻 Desktop / fallback
  startSimulation(sendLocation);
};



 
const stopTrackingImmediately = () => {
  // تنظيف أي tracking موجود
  if (watchIdRef.current) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    clearInterval(watchIdRef.current);
    watchIdRef.current = null;
  }

  // إعادة تعيين state
  setIsTracking(false);
  setCurrentOrderId(null);
  setIsOrderAccepted(false);
  setStatusMsg("Delivery stopped.");

  // إزالة من localStorage
  if (driverId) {
    localStorage.removeItem("acceptedOrderId_" + driverId);
  }

  // إعادة جلب الطلبات المتاحة
  fetchAvailableOrders();

  // مسح الـ customer info
  setCustomerPos(null);
  setCustomerAddress(null);
};


  // ===================== MARK AS DELIVERED =====================
const handleMarkDelivered = async () => {
  if (!currentOrderId) return;
  setIsConfirmingDelivered(false);

  // إرسال الموقع الأخير و إشعار التسليم
  if (socketRef.current?.connected && currentPos) {
    socketRef.current.emit("update-location", { orderId: currentOrderId, driverId, lat: currentPos.lat, lng: currentPos.lng });
    socketRef.current.emit("order-delivered", { orderId: currentOrderId, driverId });
  }

  // إزالة من localStorage و إعادة تعيين state
  stopTrackingImmediately();
};


  // ===================== CANCEL ORDER =====================
  const handleCancelOrder = async () => {
    setIsConfirmingCancel(false);
    try {
      const res = await api.post(`/orders/cancel/${currentOrderId}`);
      if (res.status === 200) {
        alert(`Order #${currentOrderId} cancelled successfully.`);
        stopTrackingImmediately();
      }
    } catch (err) {
      console.error("Cancel error:", err);
      alert("Failed to cancel order: " + (err.response?.data?.error || err.message));
    }
  };

  // ===================== RENDER =====================
  if (!isOrderAccepted) {
    return (
      <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 3, px: 2 }}>
        <Paper elevation={8} sx={{ width: "100%", maxWidth: 600, p: 3, borderRadius: 4 }}>
          <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>📦 Available Orders ({availableOrders.length})</Typography>
          <Divider sx={{ mb: 3 }} />
          {availableOrders.length === 0 ? (
            <Alert severity="info" sx={{ textAlign: 'center' }}>Waiting for new delivery requests...</Alert>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {availableOrders.map((order) => (
                <Card key={order.order_number} variant="outlined" sx={{ p: 1.5 }}>
                  <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                    <Typography variant="h6" color="primary">Order #{order.order_number}</Typography>
                    <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationOn fontSize="small" /> <strong>Address:</strong> {order.customer?.address || 'N/A'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      <strong>Item:</strong> {order.type_of_item || 'General'} | <strong>Received:</strong> {new Date(order.createdAt).toLocaleTimeString()}
                    </Typography>
                    <Button variant="contained" color="success" size="small" onClick={() => handleAcceptOrder(order)} sx={{ mt: 1, float: 'right' }}>Accept</Button>
                  </CardContent>
                </Card>
              ))}
            </Box>
          )}
        </Paper>
      </Box>
    );
  }

  // ===================== ACCEPTED ORDER MAP =====================
  return (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 3, px: 2 }}>
      <Paper elevation={8} sx={{ width: "100%", maxWidth: 600, p: 3, borderRadius: 4 }}>
        <Typography fontWeight={700} variant="h5" textAlign="center" mb={2} sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
          <DirectionsCar sx={{ fontSize: 36, color: "#0ABE51" }} /> Live Driver Tracking
        </Typography>

        <Paper elevation={0} sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, mb: 2, borderRadius: 3,
          background: socketConnected ? "#e6f4ea" : "#ffeaea", border: socketConnected ? "1px solid #4caf50" : "1px solid #f44336" }}>
          <Typography variant="body2" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Wifi fontSize="small" color={socketConnected ? "success" : "error"} />{socketConnected ? "Connected" : "Offline"}
          </Typography>
          <Typography variant="body2">{statusMsg}</Typography>
        </Paper>

        <Box sx={{ p: 1.5, mb: 2, borderRadius: 3, background: "#f7f9fc", border: "1px solid #e0e6ed", fontSize: 0.95 }}>
          <Typography><strong>Order ID:</strong> {currentOrderId}</Typography>
          <Typography><strong>Driver ID:</strong> {driverId}</Typography>
          <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}><GpsFixed fontSize="small" color="primary" /> <strong>Status:</strong> {statusMsg}</Typography>
        </Box>

        <Box sx={{ height: 300, width: "100%", borderRadius: 3, overflow: "hidden", mb: 2 }}>
          {currentPos ? (
            <MapContainer center={currentPos} zoom={16} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <MapCentering driverPos={currentPos} customerPos={customerPos} />

              <Marker position={currentPos} icon={driverIcon} zIndexOffset={driverZIndex}>
                <Popup>{currentAddress || "Your Location"}</Popup>
              </Marker>

              {customerPos && (
                <Marker position={[customerPos.lat, customerPos.lng]} icon={homeIcon} zIndexOffset={customerZIndex}>
                  <Popup>{customerAddress || "Customer Location"}</Popup>
                </Marker>
              )}

              {currentPos && customerPos && (
                <Polyline positions={[currentPos, [customerPos.lat, customerPos.lng]]} color="blue" dashArray="10,10" opacity={0.6} />
              )}
            </MapContainer>
          ) : (
            <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 1 }}>
              <CircularProgress size={24} />
              <Typography color="textSecondary" fontSize={0.85}>Waiting for GPS…</Typography>
            </Box>
          )}
        </Box>

        <Box display="flex" flexDirection="column" gap={1.5}>
          {!isTracking ? (
            <Button variant="contained" fullWidth color="success" onClick={startTracking} disabled={!isOrderAccepted}>Start Tracking</Button>
          ) : (
            <>
              {/* <Button variant="contained" fullWidth color="error" onClick={stopTracking}>Stop Tracking</Button> */}
              <Button variant="contained" fullWidth color="primary" onClick={() => setIsConfirmingDelivered(true)}>Mark as Delivered</Button>
              <Button variant="contained" fullWidth color="warning" onClick={() => setIsConfirmingCancel(true)}>Cancel Order</Button>
            </>
          )}
        </Box>

        {/* STOP TRACKING CONFIRMATION */}
        <Dialog open={isConfirmingStop} onClose={() => setIsConfirmingStop(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: "error.main", fontWeight: 700 }}>Confirm Stop Tracking</DialogTitle>
          <Divider />
          <DialogContent>
            <Typography variant="body1">Are you sure you want to stop tracking without marking the delivery as completed?</Typography>
          </DialogContent>
          <DialogActions>
            {/* <Button onClick={() => setIsConfirmingStop(false)}>Cancel</Button> */}
            {/* <Button onClick={handleConfirmStop} color="error" variant="contained">Stop Tracking</Button> */}
          </DialogActions>
        </Dialog>

        {/* MARK DELIVERED CONFIRMATION */}
        <Dialog open={isConfirmingDelivered} onClose={() => setIsConfirmingDelivered(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: "success.main", fontWeight: 700 }}>Confirm Delivery</DialogTitle>
          <Divider />
          <DialogContent>
            <Typography variant="body1">Are you sure you want to mark Order #{currentOrderId} as delivered?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsConfirmingDelivered(false)}>Cancel</Button>
            <Button onClick={handleMarkDelivered} color="success" variant="contained">Mark as Delivered</Button>
          </DialogActions>
        </Dialog>

        {/* CANCEL ORDER CONFIRMATION */}
        <Dialog open={isConfirmingCancel} onClose={() => setIsConfirmingCancel(false)} maxWidth="xs" fullWidth>
          <DialogTitle sx={{ color: "warning.main", fontWeight: 700 }}>Cancel Order</DialogTitle>
          <Divider />
          <DialogContent>
            <Typography variant="body1">Are you sure you want to cancel Order #{currentOrderId}?</Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setIsConfirmingCancel(false)}>No</Button>
            <Button onClick={handleCancelOrder} color="warning" variant="contained">Yes, Cancel</Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Box>
  );
}
