import React, { useEffect, useState, useRef, useCallback } from "react";
import {
 Box,
 Button,
 Typography,
 Paper,
 CircularProgress,
 Divider,
 Modal,
 Switch, // 💡 NEW: إضافة Switch لتبديل التوفر
 FormControlLabel,
} from "@mui/material";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WifiIcon from "@mui/icons-material/Wifi";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import { DirectionsCar, RotateRight } from "@mui/icons-material";

// ----------------------------------------------------
// 1️⃣ مكون فرعي: لإعادة تمركز الخريطة
// ----------------------------------------------------
const MapRecenter = ({ position }) => {
 const map = useMap();
 useEffect(() => {
  if (position) {
   map.setView(position, map.getZoom());
  }
 }, [position, map]);
 return null;
};

// ----------------------------------------------------
// 2️⃣ إعدادات الأيقونات والثوابت
// ----------------------------------------------------
const driverIcon = new L.Icon({
 iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
 iconSize: [50, 50],
 iconAnchor: [25, 25],
 popupAnchor: [0, -20],
});

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// ----------------------------------------------------
// 3️⃣ المكون الرئيسي
// ----------------------------------------------------
export default function DriverTracking({ orderNumber, driverId }) {
 // 💡 حالة الطلب والتسليم
 const [currentOrderId, setCurrentOrderId] = useState(orderNumber);
 const [isOrderAccepted, setIsOrderAccepted] = useState(!!orderNumber);
 const [isTracking, setIsTracking] = useState(false);
 const [isDeliveryStarted, setIsDeliveryStarted] = useState(!!orderNumber); 

 // 💡 حالة السائق والاتصال
 const [isAvailable, setIsAvailable] = useState(true); // 🆕 حالة التوفر الجديدة
 const [currentPos, setCurrentPos] = useState(null);
 const [statusMsg, setStatusMsg] = useState("Ready...");
 const [socketConnected, setSocketConnected] = useState(false);
 const [newOrder, setNewOrder] = useState(null);
 const [isCheckingOrders, setIsCheckingOrders] = useState(false);

 const watchIdRef = useRef(null);
 const socketRef = useRef(null);
 
 // ----------------------------------------------------
 // 4️⃣ الدوال المساعدة (Helper Functions)
 // ----------------------------------------------------

 // 🆕 دالة إرسال حالة التوفر إلى الخادم
 const emitAvailabilityToggle = useCallback((available) => {
  if (socketRef.current?.connected && driverId) {
   socketRef.current.emit("toggle-availability", {
    driverId,
    isAvailable: available,
   });
   console.log(`[Socket] Emitting availability: ${available}`);
  }
 }, [driverId]);

 // 9️⃣ دالة إيقاف التتبع
 const stopTracking = useCallback(() => {
  if (watchIdRef.current) {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
  }
  setIsTracking(false);
  setStatusMsg("Tracking stopped. Ready for completion or restart.");

  if (socketRef.current?.connected && currentOrderId) {
   // إرسال موقع فارغ (أو آخر موقع معروف)
   socketRef.current.emit("update-location", {
    orderId: currentOrderId,
    driverId,
    lat: currentPos ? currentPos[0] : null,
    lng: currentPos ? currentPos[1] : null,
   });
  }
 }, [currentOrderId, driverId, currentPos]);

 // 🆕 دالة إكمال التسليم
 const handleCompleteDelivery = async () => {
  if (isTracking) {
   stopTracking();
  }
  if (!currentOrderId) {
   alert("No active order to complete.");
   return;
  }

  setStatusMsg(`Completing order #${currentOrderId}...`);

  try {
   await api.post("/orders/complete", {
    order_number: currentOrderId,
    driver_id: driverId,
   });

   // ✅ إعادة تعيين الحالات للواجهة الأمامية
   setCurrentOrderId(null);
   setIsOrderAccepted(false);
   setIsDeliveryStarted(false);
   setNewOrder(null);
   
   // 🛑 التعديل الأهم: جعل السائق متاحاً مجدداً على الخادم
   setIsAvailable(true); 
   emitAvailabilityToggle(true); 
   
   setStatusMsg("Delivery successfully completed! Ready for a new order.");
   
  } catch (error) {
   console.error("Error completing delivery:", error);
   setStatusMsg("Failed to complete delivery. Check console.");
   alert(error.response?.data?.error || "Completion failed!");
  }
 };

 // 4️⃣ دالة جلب الطلبات الفائتة/المعلقة
 // 💡 تم إزالة isOrderAccepted من الاعتماديات هنا للحفاظ على منطقها كـ 'فحص عند التحميل'
 const checkPendingOrders = useCallback(async () => {
  // الآن نستخدم isAvailable بدلاً من isOrderAccepted كشرط أساسي لاستقبال الطلبات
  if (!driverId || isOrderAccepted || !isAvailable || isCheckingOrders) return; 

  try {
   setIsCheckingOrders(true);
   setStatusMsg("Checking for pending orders...");
   const res = await api.get(`/orders/pending/${driverId}`);

   if (res.data && res.data.length > 0) {
    setNewOrder(res.data[0]);
    setStatusMsg(`New order #${res.data[0].order_number} found!`);
   } else {
    setStatusMsg("No new orders. Waiting...");
   }
  } catch (error) {
   console.error("Error fetching pending orders:", error);
   setStatusMsg("Error checking orders. Check console.");
  } finally {
   setIsCheckingOrders(false);
  }
 }, [driverId, isOrderAccepted, isAvailable, isCheckingOrders]);

 // 5️⃣ Effect: جلب الطلبات المعلقة عند التحميل
 useEffect(() => {
  checkPendingOrders();
 }, [checkPendingOrders]);


 // 6️⃣ Effect: إعداد اتصال Socket.IO (الآن يعتمد فقط على driverId)
 useEffect(() => {
  if (!driverId) {
   setStatusMsg("Error: Driver ID is missing.");
   return;
  }

  // 💡 أفضل ممارسة: لا يجب أن يعاد إنشاء الـ Socket إلا إذا تغير الـ driverId
  const socket = io(SOCKET_URL);
  socketRef.current = socket;

  const handleConnect = () => {
   setSocketConnected(true);
   setStatusMsg("Connected ✔ Ready to receive orders");
   // 🛑 إرسال الـ driver-join مرة واحدة عند الاتصال الأولي
   socket.emit("driver-join", driverId);
   // 🆕 إرسال الحالة الحالية للتوفر (للحالات التي يعاد فيها الاتصال)
   socket.emit("toggle-availability", { driverId, isAvailable: isAvailable }); 
  };

  const handleNewOrder = (orderData) => {
   // فقط إذا كان السائق متاحاً
   if (!isOrderAccepted && isAvailable) {
    setNewOrder(orderData);
    setStatusMsg(`NEW ORDER: #${orderData.order_number}`);
   }
  };

  const handleDisconnect = () => {
   setSocketConnected(false);
   setStatusMsg("Disconnected... Reconnecting");
  };

  socket.on("connect", handleConnect);
  socket.on("new-order", handleNewOrder);
  socket.on("disconnect", handleDisconnect);

  return () => {
   socket.off("connect", handleConnect);
   socket.off("new-order", handleNewOrder);
   socket.off("disconnect", handleDisconnect);
   socket.disconnect();
  };
 }, [driverId]); // 🛑 التبعية الوحيدة هنا يجب أن تكون driverId

 // 7️⃣ دالة قبول الطلب
 const handleAcceptOrder = async () => {
  if (!newOrder) return;

  try {
   setStatusMsg(`Accepting order #${newOrder.order_number}...`);
   
   await api.post("/orders/accept", {
    order_number: newOrder.order_number,
    driver_id: driverId,
   });

   // ✅ تحديث حالة الواجهة الأمامية
   setCurrentOrderId(newOrder.order_number);
   setIsOrderAccepted(true);
   setIsDeliveryStarted(true); 
   setNewOrder(null);
   
   // 🛑 التعديل الأهم: جعل السائق غير متاح لاستقبال طلبات جديدة
   setIsAvailable(false);
   emitAvailabilityToggle(false); 
   
   setStatusMsg(`Order #${newOrder.order_number} accepted! Start tracking.`);
  } catch (error) {
   console.error("Error accepting order:", error);
   setStatusMsg("Failed to accept order. Check console.");
   alert(error.response?.data?.error || "Acceptance failed!");
  }
 };
 
 // 🆕 دالة تبديل التوفر اليدوي
 const handleAvailabilityToggle = (event) => {
  const newAvailability = event.target.checked;
  setIsAvailable(newAvailability);
  emitAvailabilityToggle(newAvailability);
  
  if (!newAvailability) {
   setStatusMsg("Manually set to BUSY. Will not receive new orders.");
  } else if (!isOrderAccepted) {
   setStatusMsg("Available and waiting for orders.");
  }
  
  // 💡 إعادة فحص الطلبات المعلقة إذا أصبح متاحًا
  if (newAvailability && !isOrderAccepted) {
   checkPendingOrders();
  }
 };

  // 8️⃣ دالة بدء التتبع (بدون تغيير كبير في المنطق الداخلي)
  const startTracking = () => {
    // ... (Keep the existing geolocation logic) ...
    if (!navigator.geolocation) {
      alert("Your device does not support GPS.");
      return;
    }
    if (!isOrderAccepted || !currentOrderId) {
      alert("Please accept an order first.");
      return;
    }

    setIsTracking(true);
    setIsDeliveryStarted(true); 
    setStatusMsg("Sending live location...");

  watchIdRef.current = navigator.geolocation.watchPosition(
(pos) => {
    const { latitude, longitude } = pos.coords;
    const newPosition = [latitude, longitude];
    setCurrentPos(newPosition);

    if (socketRef.current?.connected) {
     socketRef.current.emit("update-location", {
      orderId: currentOrderId,
      driverId,
      lat: latitude,
      lng: longitude,
     });
    }
   },
   (err) => setStatusMsg("GPS Error: " + err.message),
   { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
  );
 };

 // ----------------------------------------------------
 // 🔟 العرض المرئي (مع تعديلات طفيفة)
 // ----------------------------------------------------

 if (!driverId) {
  return (
   <Box sx={{ p: 3, textAlign: "center" }}>
    <CircularProgress size={28} />
    <Typography mt={2} fontWeight={500} color="textSecondary">
     Loading driver profile...
    </Typography>
   </Box>
  );
 }

 const initialCenter = currentPos || [33.89, 35.50];

 return (
  <Box
   sx={{
    width: "100%",
    display: "flex",
    justifyContent: "center",
    mt: { xs: 2, sm: 3 },
    px: { xs: 1, sm: 2 },
   }}
  >
   <Paper
    elevation={8}
    sx={{
     width: "100%",
     maxWidth: 600,
     p: { xs: 2, sm: 3 },
     borderRadius: 4,
     background: "#ffffff",
     boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
    }}
   >
    <Typography
     fontWeight={700}
     variant="h5"
     textAlign="center"
     mb={2}
     sx={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 1,
      fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
     }}
    >
     <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: "#0ABE51" }} />
     Live Driver Tracking
    </Typography>

    {/* Status & Availability Toggle */}
    <Paper
     elevation={0}
     sx={{
      display: "flex",
      flexDirection: { xs: "column", sm: "row" },
      alignItems: { xs: "flex-start", sm: "center" },
      justifyContent: "space-between",
      p: 1.5,
      mb: 2,
      borderRadius: 3,
      background: socketConnected ? "#e6f4ea" : "#ffeaea",
      border: socketConnected ? "1px solid #4caf50" : "1px solid #f44336",
     }}
    >
     <Typography
      variant="body2"
      fontWeight={600}
      sx={{ display: "flex", alignItems: "center", gap: 1, mb: { xs: 1, sm: 0 } }}
     >
      <WifiIcon fontSize="small" color={socketConnected ? "success" : "error"} />
      {socketConnected ? "Connected" : "Offline"}
     </Typography>
     <Typography variant="body2">{statusMsg}</Typography>
    </Paper>

    {/* Availability Control */}
    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} p={1.5} sx={{ bgcolor: isAvailable && !isOrderAccepted ? '#e8f5e9' : '#fff3e0', borderRadius: 3, border: '1px solid #ddd' }}>
     <Typography variant="body1" fontWeight={600} color={isAvailable ? 'success.main' : 'error.main'}>
      {isOrderAccepted ? "BUSY (Order in Progress)" : isAvailable ? "ONLINE (Ready for orders)" : "OFFLINE (Manual Stop)"}
     </Typography>
     <FormControlLabel
      control={
       <Switch 
        checked={isAvailable && !isOrderAccepted} // 💡 يتحكم في التوفر اليدوي فقط إذا لم يكن الطلب قيد التنفيذ
        onChange={handleAvailabilityToggle}
        disabled={isOrderAccepted}
        color="success" 
       />
      }
      label=""
     />
    </Box>

    {/* Info */}
    <Box
     sx={{
      p: 1.5,
      mb: 2,
      borderRadius: 3,
      background: "#f7f9fc",
      border: "1px solid #e0e6ed",
      fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.95rem" },
     }}
    >
     <Typography>
      <strong>Order ID:</strong> {currentOrderId || "Awaiting New..."}
     </Typography>
     <Typography>
      <strong>Driver ID:</strong> {driverId}
     </Typography>
     <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
      <GpsFixedIcon fontSize="small" color="primary" />{" "}
      <strong>Tracking Status:</strong> {isTracking ? "Active" : "Inactive"}
     </Typography>
    </Box>

    <Divider sx={{ my: 2 }} />

    {/* Map */}
    <Box
     sx={{
      height: { xs: 300, sm: 350, md: 400 },
      width: "100%",
      borderRadius: 3,
      overflow: "hidden",
      mb: 2,
      border: "1px solid #ddd",
      mx: "auto",
     }}
    >
     {currentPos ? (
      <MapContainer center={initialCenter} zoom={16} style={{ height: "100%", width: "100%" }} scrollWheelZoom={true}>
       <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
       <MapRecenter position={currentPos} />
       <Marker position={currentPos} icon={driverIcon}>
        <Popup>Your Current Location</Popup>
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
        flexDirection: "column",
        gap: 1,
       }}
      >
       <CircularProgress size={24} />
       <Typography color="textSecondary" fontSize="0.85rem">
        Waiting for GPS Location...
       </Typography>
      </Box>
     )}
    </Box>

    {/* 🚀 الأزرار */}
    <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={1.5}>
     {isTracking ? (
      // الحالة 1: التتبع نشط -> زر إيقاف التتبع
      <Button
       variant="contained"
       fullWidth
       color="error"
       onClick={stopTracking}
       size="large"
       sx={{ py: 1.6, fontSize: { xs: "0.9rem", sm: "1rem" }, borderRadius: 3, fontWeight: 600 }}
      >
       Stop Tracking (Arrived)
      </Button>
     ) : isOrderAccepted && isDeliveryStarted ? (
      // الحالة 2: الطلب مقبول والتتبع متوقف -> زر إكمال التسليم
      <Button
       variant="contained"
       fullWidth
       color="success"
       onClick={handleCompleteDelivery}
       size="large"
       sx={{ py: 1.6, fontSize: { xs: "0.9rem", sm: "1rem" }, borderRadius: 3, fontWeight: 600 }}
      >
       ✅ Complete Delivery
      </Button>
     ) : (
      // الحالة 3: الطلب مقبول (ولم يبدأ بعد) -> زر بدء التسليم
      <Button
       variant="contained"
       fullWidth
       color="primary"
       onClick={startTracking}
       size="large"
       disabled={!isOrderAccepted || isCheckingOrders || !isAvailable} // 💡 تعطل إذا كان غير متاح أو جاري التحقق
       sx={{ py: 1.6, fontSize: { xs: "0.9rem", sm: "1rem" }, borderRadius: 3, fontWeight: 600 }}
      >
       Start Delivery
      </Button>
     )}
    </Box>
   </Paper>

   {/* Modal (بدون تغيير) */}
   <Modal open={!!newOrder} onClose={() => setNewOrder(null)}>
    {/* ... (Modal Content Remains Here) ... */}
    <Paper
     sx={{
      position: "absolute",
      top: "50%",
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: { xs: "85%", sm: 400 },
      p: { xs: 2, sm: 3 },
      textAlign: "center",
      borderRadius: 3,
      outline: 'none',
     }}
    >
     <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
      <CheckCircleIcon sx={{ mr: 1, color: '#FFC107' }} /> New Delivery Request
     </Typography>

     {newOrder && (
      <Box
       textAlign="left"
       mb={2}
       sx={{ bgcolor: "#fff3e0", p: 2, borderRadius: 2, border: '1px solid #ffb300' }}
      >
       <Typography variant="body2"><strong>Order ID:</strong> {newOrder.order_number}</Typography>
       <Typography variant="body2"><strong>Item Type:</strong> {newOrder.type_of_item}</Typography>
       <Typography variant="body2" sx={{ wordWrap: "break-word" }}>
        <strong>Address:</strong> {newOrder.customer_address || newOrder.customer?.address}
       </Typography>
      </Box>
     )}

     <Button
      variant="contained"
      color="success"
      fullWidth
      onClick={handleAcceptOrder}
      sx={{ py: 1.5, fontSize: "0.95rem", fontWeight: 600, mb: 1 }}
     >
      Accept Order
     </Button>

     <Button
      variant="outlined"
      color="error"
      fullWidth
      onClick={() => setNewOrder(null)}
      sx={{ py: 1.5, fontWeight: 600 }}
     >
      Decline
     </Button>
    </Paper>
   </Modal>
  </Box>
 );
}


// import { useEffect, useState, useRef } from "react";
// import {
//   Box,
//   Button,
//   Typography,
//   Paper,
//   CircularProgress,
//   Divider,
//   Modal,
// } from "@mui/material";
// import { io } from "socket.io-client";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import api from "../api";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import WifiIcon from "@mui/icons-material/Wifi";
// import GpsFixedIcon from "@mui/icons-material/GpsFixed";
// import { DirectionsCar } from "@mui/icons-material";

// const driverIcon = new L.Icon({
//   iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
//   iconSize: [50, 50],
//   iconAnchor: [25, 25],
//   popupAnchor: [0, -20],
// });

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// export default function DriverTracking({ orderNumber, driverId }) {
//   const [isTracking, setIsTracking] = useState(false);
//   const [currentPos, setCurrentPos] = useState(null);
//   const [statusMsg, setStatusMsg] = useState("Ready…");
//   const [socketConnected, setSocketConnected] = useState(false);
//   const [newOrder, setNewOrder] = useState(null);
//   const [isOrderAccepted, setIsOrderAccepted] = useState(false);
//   const [currentOrderId, setCurrentOrderId] = useState(orderNumber);

//   const watchIdRef = useRef(null);
//   const socketRef = useRef(null);

//   // 1️⃣ هذا هو الجزء الجديد: دالة لجلب الطلبات الفائتة من قاعدة البيانات
//   const checkPendingOrders = async () => {
//     if (!driverId || isOrderAccepted) return;

//     try {
//       // نستدعي الـ API الذي أنشأناه في الباك اند
//       const res = await api.get(`/orders/pending/${driverId}`);
      
//       // إذا وجدنا طلبات معلقة، نأخذ أول واحد ونعرضه للسائق
//       if (res.data && res.data.length > 0) {
//         console.log("Found pending orders:", res.data);
//         // نعتبر أول طلب هو الطلب الجديد لكي يظهر الـ Modal
//         setNewOrder(res.data[0]); 
//       }
//     } catch (error) {
//       console.error("Error fetching pending orders:", error);
//     }
//   };

//   // 2️⃣ نقوم باستدعاء الدالة عند تحميل الصفحة (mount)
//   useEffect(() => {
//     checkPendingOrders();
//   }, [driverId]);


//   if (!driverId) {
//     return (
//       <Box sx={{ p: 3, textAlign: "center" }}>
//         <CircularProgress size={28} />
//         <Typography mt={2} fontWeight={500} color="textSecondary">
//           Loading driver profile...
//         </Typography>
//         <Typography mt={1} color="error" fontWeight={600}>
//           (Driver ID is missing)
//         </Typography>
//       </Box>
//     );
//   }

//   useEffect(() => {
//     if (!driverId) {
//       setStatusMsg("Error: Driver ID is missing.");
//       return;
//     }

//     const socket = io(SOCKET_URL);
//     socketRef.current = socket;

//     socket.on("connect", () => {
//       setSocketConnected(true);
//       setStatusMsg("Connected ✔ Ready to receive orders");
//       socket.emit("driver-join", driverId);
//     });

//     const handleNewOrder = (orderData) => {
//       // Socket للتنبيه اللحظي
//       if (!isOrderAccepted) setNewOrder(orderData);
//     };

//     socket.on("new-order", handleNewOrder);

//     socket.on("disconnect", () => {
//       setSocketConnected(false);
//       setStatusMsg("Disconnected… Reconnecting");
//     });

//     return () => {
//       socket.off("new-order", handleNewOrder);
//       socket.disconnect();
//     };
//   }, [driverId, isOrderAccepted]);

//   const handleAcceptOrder = async () => {
//     if (!newOrder) return;

//     try {
//       setStatusMsg(`Accepting order #${newOrder.order_number}...`);
//       await api.post("/orders/accept", {
//         order_number: newOrder.order_number,
//         driver_id: driverId,
//       });

//       setCurrentOrderId(newOrder.order_number);
//       setIsOrderAccepted(true);
//       setNewOrder(null);
//       setStatusMsg(`Order #${newOrder.order_number} accepted! Start tracking.`);
//     } catch (error) {
//       console.error("Error accepting order:", error);
//       setStatusMsg("Failed to accept order. Try again.");
//       alert(error.response?.data?.error || "Acceptance failed!");
//     }
//   };

//   // ... (باقي الكود كما هو دون تغيير: startTracking, stopTracking, return ...)
//   const startTracking = () => {
//     if (!navigator.geolocation) {
//       alert("Your device does not support GPS.");
//       return;
//     }
//     if (!isOrderAccepted && !orderNumber) {
//       alert("Please accept an order first or ensure an order ID is provided.");
//       return;
//     }

//     setIsTracking(true);
//     setStatusMsg("Sending live location…");

//     watchIdRef.current = navigator.geolocation.watchPosition(
//       (pos) => {
//         const { latitude, longitude } = pos.coords;
//         setCurrentPos([latitude, longitude]);

//         if (socketRef.current?.connected && currentOrderId) {
//           socketRef.current.emit("update-location", {
//             orderId: currentOrderId,
//             driverId,
//             lat: latitude,
//             lng: longitude,
//           });
//         }
//       },
//       (err) => setStatusMsg("GPS Error: " + err.message),
//       { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
//     );
//   };

//   const stopTracking = () => {
//     navigator.geolocation.clearWatch(watchIdRef.current);
//     watchIdRef.current = null;
//     setIsTracking(false);
//     setStatusMsg("Tracking stopped.");

//     if (socketRef.current?.connected && currentOrderId) {
//       socketRef.current.emit("update-location", {
//         orderId: currentOrderId,
//         driverId,
//         lat: null,
//         lng: null,
//       });
//     }
//   };

//   return (
//     <Box
//       sx={{
//         width: "100%",
//         display: "flex",
//         justifyContent: "center",
//         mt: { xs: 2, sm: 3 },
//         px: { xs: 1, sm: 2 },
//       }}
//     >
//       <Paper
//         elevation={8}
//         sx={{
//           width: "100%",
//           maxWidth: 600, // smaller container
//           p: { xs: 2, sm: 3 },
//           borderRadius: 4,
//           background: "#ffffff",
//           boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
//         }}
//       >
//         {/* Header */}
//         <Typography
//           fontWeight={700}
//           variant="h5"
//           textAlign="center"
//           mb={2}
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "center",
//             gap: 1,
//             fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
//           }}
//         >
//           <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: "#0ABE51" }} />
//           Live Driver Tracking
//         </Typography>

//         {/* Status */}
//         <Paper
//           elevation={0}
//           sx={{
//             display: "flex",
//             alignItems: "center",
//             justifyContent: "space-between",
//             p: 1.5,
//             mb: 2,
//             borderRadius: 3,
//             background: socketConnected ? "#e6f4ea" : "#ffeaea",
//             border: socketConnected ? "1px solid #4caf50" : "1px solid #f44336",
//           }}
//         >
//           <Typography
//             variant="body2"
//             fontWeight={600}
//             sx={{ display: "flex", alignItems: "center", gap: 1 }}
//           >
//             <WifiIcon fontSize="small" color={socketConnected ? "success" : "error"} />
//             {socketConnected ? "Connected" : "Offline"}
//           </Typography>
//           <Typography variant="body2">{statusMsg}</Typography>
//         </Paper>

//         {/* Info */}
//         <Box
//           sx={{
//             p: 1.5,
//             mb: 2,
//             borderRadius: 3,
//             background: "#f7f9fc",
//             border: "1px solid #e0e6ed",
//             fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.95rem" },
//           }}
//         >
//           <Typography><strong>Order ID:</strong> {currentOrderId || "Awaiting New..."}</Typography>
//           <Typography><strong>Driver ID:</strong> {driverId}</Typography>
//           <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//             <GpsFixedIcon fontSize="small" color="primary" /> <strong>Status:</strong> {statusMsg}
//           </Typography>
//         </Box>

//         <Divider sx={{ my: 2 }} />

//         {/* Map */}
//         <Box
//           sx={{
//             height: { xs: 150, sm: 180, md: 200 }, // smaller map
//             width: "100%",
//             borderRadius: 3,
//             overflow: "hidden",
//             mb: 2,
//             border: "1px solid #ddd",
//             mx: "auto",
//           }}
//         >
//           {currentPos ? (
//             <MapContainer center={currentPos} zoom={16} style={{ height: "100%", width: "100%" }}>
//               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//               <Marker position={currentPos} icon={driverIcon}>
//                 <Popup>Your Location</Popup>
//               </Marker>
//             </MapContainer>
//           ) : (
//             <Box
//               sx={{
//                 height: "100%",
//                 display: "flex",
//                 alignItems: "center",
//                 justifyContent: "center",
//                 color: "#555",
//                 flexDirection: "column",
//                 gap: 1,
//               }}
//             >
//               <CircularProgress size={24} />
//               <Typography color="textSecondary" fontSize="0.85rem">
//                 Waiting for GPS…
//               </Typography>
//             </Box>
//           )}
//         </Box>

//         {/* Buttons */}
//         <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={1.5}>
//           {!isTracking ? (
//             <Button
//               variant="contained"
//               fullWidth
//               color="success"
//               onClick={startTracking}
//               size="large"
//               disabled={!isOrderAccepted && !orderNumber}
//               sx={{
//                 py: 1.6,
//                 fontSize: { xs: "0.9rem", sm: "1rem" },
//                 borderRadius: 3,
//                 fontWeight: 600,
//               }}
//             >
//               Start Delivery
//             </Button>
//           ) : (
//             <Button
//               variant="contained"
//               fullWidth
//               color="error"
//               onClick={stopTracking}
//               size="large"
//               sx={{
//                 py: 1.6,
//                 fontSize: { xs: "0.9rem", sm: "1rem" },
//                 borderRadius: 3,
//                 fontWeight: 600,
//               }}
//             >
//               Stop Delivery
//             </Button>
//           )}
//         </Box>
//       </Paper>

//       {/* New Order Modal */}
//       <Modal open={!!newOrder} onClose={() => setNewOrder(null)}>
//         <Paper
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             width: { xs: "85%", sm: 400 },
//             p: { xs: 2, sm: 3 },
//             textAlign: "center",
//             borderRadius: 3,
//           }}
//         >
//           <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
//             <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} /> New Delivery Request
//           </Typography>

//           {newOrder && (
//             <Box
//               textAlign="left"
//               mb={2}
//               sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2 }}
//             >
//               <Typography variant="body2"><strong>Order ID:</strong> {newOrder.order_number}</Typography>
//               <Typography variant="body2"><strong>Item Type:</strong> {newOrder.type_of_item}</Typography>
//               <Typography variant="body2" sx={{ wordWrap: "break-word" }}>
//                 <strong>Address:</strong> {newOrder.customer_address || newOrder.customer?.address}
//               </Typography>
//             </Box>
//           )}

//           <Button
//             variant="contained"
//             color="success"
//             fullWidth
//             onClick={handleAcceptOrder}
//             sx={{ py: 1.5, fontSize: "0.95rem", fontWeight: 600, mb: 1 }}
//           >
//             Accept Order
//           </Button>

//           <Button
//             variant="outlined"
//             color="error"
//             fullWidth
//             onClick={() => setNewOrder(null)}
//             sx={{ py: 1.5, fontWeight: 600 }}
//           >
//             Decline
//           </Button>
//         </Paper>
//       </Modal>
//     </Box>
//   );
// }





