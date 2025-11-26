import { useEffect, useState, useRef } from "react";
import {
    Box,
    Button,
    Typography,
    Paper,
    CircularProgress,
    Divider,
    Modal,
    Card,
    CardContent,
    Alert,
} from "@mui/material";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WifiIcon from "@mui/icons-material/Wifi";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import { DirectionsCar, LocationOn } from "@mui/icons-material";

const driverIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
    iconSize: [50, 50],
    iconAnchor: [25, 25],
    popupAnchor: [0, -20],
});

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function DriverTracking({ initialOrderNumber, driverId }) {
    // 🆕 حالة جديدة لحفظ قائمة الطلبات المتاحة التي تم جلبها من DB
    const [availableOrders, setAvailableOrders] = useState([]);    
    
    const [isTracking, setIsTracking] = useState(false);
    const [currentPos, setCurrentPos] = useState(null);
    const [statusMsg, setStatusMsg] = useState("Ready…");
    const [socketConnected, setSocketConnected] = useState(false);
    
    // حالة للطلب اللحظي (Modal notification)
    const [newOrder, setNewOrder] = useState(null);    
    
    // حالة لقبول الطلب
    const [isOrderAccepted, setIsOrderAccepted] = useState(!!initialOrderNumber);    
    const [currentOrderId, setCurrentOrderId] = useState(initialOrderNumber);

    const watchIdRef = useRef(null);
    const socketRef = useRef(null);
    
    // =======================================
    // 1. FETCHING DATA (Initial Load)
    // =======================================

    // 🆕 دالة لجلب الطلبات المتاحة من قاعدة البيانات عند التحميل
    const fetchAvailableOrders = async () => {
        if (!driverId) return;

        try {
            // 🚨 نستخدم المسار الصحيح المتفق عليه سابقاً
            const res = await api.get(`/orders/orders/available`);    
            
            if (res.data && res.data.orders) {
                console.log("Found available orders:", res.data.orders);
                setAvailableOrders(res.data.orders); // ⬅️ يتم تخزين القائمة في الحالة الجديدة
            }
        } catch (error) {
            console.error("Error fetching available orders:", error);
            // قد يكون خطأ CORS أو خطأ خادم. نعرض تنبيهًا
            setStatusMsg(`Error: Failed to fetch orders. ${error.message}`);
        }
    };
    
    // 2️⃣ يتم استدعاء دالة الجلب عند تحميل المكون
    useEffect(() => {
        // إذا كان هناك طلب مقبول مسبقاً، لا داعي لجلب القائمة
        if (!isOrderAccepted) {
            fetchAvailableOrders();
        }
    }, [driverId, isOrderAccepted]);

    // =======================================
    // 2. SOCKET.IO SETUP (Real-Time)
    // =======================================

    useEffect(() => {
        if (!driverId) {
            setStatusMsg("Error: Driver ID is missing.");
            return;
        }

        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on("connect", () => {
            setSocketConnected(true);
            setStatusMsg("Connected ✔ Ready to receive orders");
            socket.emit("driver-join", driverId);    
        });

        const handleNewOrder = (orderData) => {
            console.log("🔥 RECEIVED NEW ORDER VIA SOCKET:", orderData);
            // 🚨 يتم تحديث قائمة الطلبات المتاحة بطلب جديد (لاستمرارية البيانات)
            setAvailableOrders(prevOrders => [orderData, ...prevOrders]);
            
            // وعرض الـ Modal كإشعار لحظي
            if (!isOrderAccepted) setNewOrder(orderData);    
        };

        socket.on("new-order", handleNewOrder); // 🚨 اسم الحدث يجب أن يتطابق مع الخلفية
        
        socket.on("order-accepted", (data) => {
            // إزالة الطلب من قائمة الطلبات المتاحة إذا قبله سائق آخر
            setAvailableOrders(prevOrders =>    
                prevOrders.filter(order => order.order_number !== data.order_number)
            );
            
            if (newOrder && newOrder.order_number === data.order_number) {
                setNewOrder(null);    
                alert(`Order #${data.order_number} was accepted by another driver.`);
            }
        });

        socket.on("disconnect", () => {
            setSocketConnected(false);
            setStatusMsg("Disconnected… Reconnecting");
        });

        return () => {
            socket.off("new-order-available", handleNewOrder);
            socket.off("order-accepted");
            socket.disconnect();
        };
    }, [driverId, isOrderAccepted, newOrder]);
    
    // =======================================
    // 3. ACTION HANDLERS
    // =======================================

    const handleAcceptOrder = async (orderToAccept) => {
        const orderNumber = orderToAccept.order_number;
        
        try {
            setStatusMsg(`Accepting order #${orderNumber}...`);
            const res = await api.post("/orders/accept", {
                order_number: orderNumber,
                driver_id: driverId,
            });

            if (res.status === 200 || res.status === 201) {
                setCurrentOrderId(orderNumber);
                setIsOrderAccepted(true);
                setNewOrder(null);
                
                // 🆕 إزالة الطلب المقبول من قائمة الطلبات المتاحة
                setAvailableOrders(prevOrders =>    
                    prevOrders.filter(order => order.order_number !== orderNumber)
                );
                
                setStatusMsg(`Order #${orderNumber} accepted! Start tracking.`);
            }
        } catch (error) {
            console.error("Error accepting order:", error);
            const errMsg = error.response?.data?.error || "Acceptance failed!";
            setStatusMsg(`Failed to accept order: ${errMsg}`);
            alert(errMsg);
        }
    };

    const startTracking = () => {
        // ... (وظيفة التتبع تبقى كما هي)
        if (!navigator.geolocation) {
            alert("Your device does not support GPS.");
            return;
        }
        if (!isOrderAccepted && !initialOrderNumber) {
            alert("Please accept an order first or ensure an order ID is provided.");
            return;
        }

        setIsTracking(true);
        setStatusMsg("Sending live location…");

        const orderToTrack = currentOrderId || initialOrderNumber;

        watchIdRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                setCurrentPos([latitude, longitude]);

                if (socketRef.current?.connected && orderToTrack) {
                    socketRef.current.emit("update-location", {
                        orderId: orderToTrack,
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

    // 🚀 التعديل الرئيسي: إرسال إشعار التسليم وإعادة تعيين الحالة
    const stopTracking = async () => {
        // 1. إيقاف تتبع الموقع
        navigator.geolocation.clearWatch(watchIdRef.current);
        watchIdRef.current = null;
        setIsTracking(false);
        setStatusMsg("Delivery completed! Awaiting new order.");

        const orderToTrack = currentOrderId || initialOrderNumber;
        
        if (socketRef.current?.connected && orderToTrack) {
            // إرسال آخر موقع مؤكد للتسليم
            if (currentPos) {
                socketRef.current.emit("update-location", {
                    orderId: orderToTrack,
                    driverId,
                    lat: currentPos[0],
                    lng: currentPos[1],
                });
            }

            // 🚨 إرسال الحدث الجديد للتسليم
            socketRef.current.emit("order-delivered", {
                orderId: orderToTrack,
                driverId,
            });
            
            // إعادة تعيين الحالة للبدء من جديد
            setCurrentOrderId(null);
            setIsOrderAccepted(false);

            // إعادة جلب الطلبات المتاحة (للتأكد من ظهورها في القائمة)
            // نستخدم await للتأكد من اكتمال الجلب قبل إظهار الواجهة
            await fetchAvailableOrders(); 
        }
    };
    
    // =======================================
    // 4. RENDERING LOGIC (فصل عرض الطلبات عن التتبع)
    // =======================================

    // ... (باقي كود renderAvailableOrdersList و Return يبقى كما هو)
    
    // 🆕 وظيفة مساعدة لعرض الطلبات المتاحة
    const renderAvailableOrdersList = () => (
        <Paper 
            elevation={8} 
            sx={{ width: "100%", maxWidth: 600, p: 3, borderRadius: 4 }}
        >
            <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
                📦 Available Orders ({availableOrders.length})
            </Typography>
            <Divider sx={{ mb: 3 }} />

            {availableOrders.length === 0 ? (
                <Alert severity="info" sx={{ textAlign: 'center' }}>
                    Waiting for new delivery requests...
                </Alert>
            ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {availableOrders.map((order) => (
                        <Card key={order.order_number} variant="outlined" sx={{ p: 1.5 }}>
                            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="h6" color="primary">Order #{order.order_number}</Typography>
                                <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <LocationOn fontSize="small" />    
                                    **Address:** {order.customer?.address || 'N/A'}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                    **Item:** {order.type_of_item || 'General'} | **Received:** {new Date(order.createdAt).toLocaleTimeString()}
                                </Typography>
                                <Button    
                                    variant="contained"    
                                    color="success"    
                                    size="small"    
                                    onClick={() => handleAcceptOrder(order)}
                                    sx={{ mt: 1, float: 'right' }}
                                >
                                    Accept
                                </Button>
                            </CardContent>
                        </Card>
                    ))}
                </Box>
            )}
        </Paper>
    );

    // 🆕 الوظيفة الرئيسية: إما عرض قائمة الطلبات أو واجهة التتبع
    if (!isOrderAccepted) {
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
                {renderAvailableOrdersList()}

                {/* New Order Modal (يبقى كما هو للإشعارات اللحظية) */}
                <Modal open={!!newOrder} onClose={() => setNewOrder(null)}>
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
                        }}
                    >
                        <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
                            <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} /> New Delivery Request
                        </Typography>

                        {newOrder && (
                            <Box textAlign="left" mb={2} sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2 }}>
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
                            onClick={() => handleAcceptOrder(newOrder)} // 🚨 تمرير الطلب نفسه
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
    
    // ↩️ العرض في حالة قبول الطلب (باقي الكود الأصلي)
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
                {/* Header, Status, Info Sections (Keep these as they are) */}
                
                <Typography
                    fontWeight={700}
                    variant="h5"
                    textAlign="center"
                    mb={2}
                    sx={{
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
                        fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
                    }}
                >
                    <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: "#0ABE51" }} />
                    Live Driver Tracking
                </Typography>

                <Paper
                    elevation={0}
                    sx={{
                        display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, mb: 2, borderRadius: 3,
                        background: socketConnected ? "#e6f4ea" : "#ffeaea",
                        border: socketConnected ? "1px solid #4caf50" : "1px solid #f44336",
                    }}
                >
                    <Typography
                        variant="body2" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}
                    >
                        <WifiIcon fontSize="small" color={socketConnected ? "success" : "error"} />
                        {socketConnected ? "Connected" : "Offline"}
                    </Typography>
                    <Typography variant="body2">{statusMsg}</Typography>
                </Paper>

                <Box
                    sx={{
                        p: 1.5, mb: 2, borderRadius: 3, background: "#f7f9fc", border: "1px solid #e0e6ed",
                        fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.95rem" },
                    }}
                >
                    <Typography><strong>Order ID:</strong> {currentOrderId || initialOrderNumber}</Typography>
                    <Typography><strong>Driver ID:</strong> {driverId}</Typography>
                    <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <GpsFixedIcon fontSize="small" color="primary" /> <strong>Status:</strong> {statusMsg}
                    </Typography>
                </Box>

                <Divider sx={{ my: 2 }} />

                {/* Map Section (Keep this as it is) */}
                <Box
                    sx={{
                        height: { xs: 150, sm: 180, md: 200 }, width: "100%", borderRadius: 3, overflow: "hidden", mb: 2, border: "1px solid #ddd", mx: "auto",
                    }}
                >
                    {currentPos ? (
                        <MapContainer center={currentPos} zoom={16} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                            <Marker position={currentPos} icon={driverIcon}>
                                <Popup>Your Location</Popup>
                            </Marker>
                        </MapContainer>
                    ) : (
                        <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", flexDirection: "column", gap: 1, }}>
                            <CircularProgress size={24} />
                            <Typography color="textSecondary" fontSize="0.85rem">
                                Waiting for GPS…
                            </Typography>
                        </Box>
                    )}
                </Box>

                {/* Buttons (Keep these as they are) */}
                <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={1.5}>
                    {!isTracking ? (
                        <Button
                            variant="contained" fullWidth color="success" onClick={startTracking} size="large"
                            disabled={!isOrderAccepted && !initialOrderNumber} // 🚨 استخدام initialOrderNumber
                            sx={{ py: 1.6, fontSize: { xs: "0.9rem", sm: "1rem" }, borderRadius: 3, fontWeight: 600, }}
                        >
                            Start Delivery
                        </Button>
                    ) : (
                        <Button
                            variant="contained" fullWidth color="error" onClick={stopTracking} size="large"
                            sx={{ py: 1.6, fontSize: { xs: "0.9rem", sm: "1rem" }, borderRadius: 3, fontWeight: 600, }}
                        >
                            Stop Delivery
                        </Button>
                    )}
                </Box>
            </Paper>
        </Box>
    );
}


// import { useEffect, useState, useRef } from "react";
// import {
//     Box,
//     Button,
//     Typography,
//     Paper,
//     CircularProgress,
//     Divider,
//     Modal,
//     Card,
//     CardContent,
//     Alert,
// } from "@mui/material";
// import { io } from "socket.io-client";
// import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import api from "../api";
// import CheckCircleIcon from "@mui/icons-material/CheckCircle";
// import WifiIcon from "@mui/icons-material/Wifi";
// import GpsFixedIcon from "@mui/icons-material/GpsFixed";
// import { DirectionsCar, LocationOn } from "@mui/icons-material";

// const driverIcon = new L.Icon({
//     iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
//     iconSize: [50, 50],
//     iconAnchor: [25, 25],
//     popupAnchor: [0, -20],
// });

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// export default function DriverTracking({ initialOrderNumber, driverId }) {
//     // 🆕 حالة جديدة لحفظ قائمة الطلبات المتاحة التي تم جلبها من DB
//     const [availableOrders, setAvailableOrders] = useState([]); 
    
//     const [isTracking, setIsTracking] = useState(false);
//     const [currentPos, setCurrentPos] = useState(null);
//     const [statusMsg, setStatusMsg] = useState("Ready…");
//     const [socketConnected, setSocketConnected] = useState(false);
    
//     // حالة للطلب اللحظي (Modal notification)
//     const [newOrder, setNewOrder] = useState(null); 
    
//     // حالة لقبول الطلب
//     const [isOrderAccepted, setIsOrderAccepted] = useState(!!initialOrderNumber); 
//     const [currentOrderId, setCurrentOrderId] = useState(initialOrderNumber);

//     const watchIdRef = useRef(null);
//     const socketRef = useRef(null);
    
//     // =======================================
//     // 1. FETCHING DATA (Initial Load)
//     // =======================================

//     // 🆕 دالة لجلب الطلبات المتاحة من قاعدة البيانات عند التحميل
//     const fetchAvailableOrders = async () => {
//         if (!driverId) return;

//         try {
//             // 🚨 نستخدم المسار الصحيح المتفق عليه سابقاً
//             const res = await api.get(`/orders/orders/available`); 
            
//             if (res.data && res.data.orders) {
//                 console.log("Found available orders:", res.data.orders);
//                 setAvailableOrders(res.data.orders); // ⬅️ يتم تخزين القائمة في الحالة الجديدة
//             }
//         } catch (error) {
//             console.error("Error fetching available orders:", error);
//             // قد يكون خطأ CORS أو خطأ خادم. نعرض تنبيهًا
//             setStatusMsg(`Error: Failed to fetch orders. ${error.message}`);
//         }
//     };
    
//     // 2️⃣ يتم استدعاء دالة الجلب عند تحميل المكون
//     useEffect(() => {
//         // إذا كان هناك طلب مقبول مسبقاً، لا داعي لجلب القائمة
//         if (!isOrderAccepted) {
//             fetchAvailableOrders();
//         }
//     }, [driverId, isOrderAccepted]);

//     // =======================================
//     // 2. SOCKET.IO SETUP (Real-Time)
//     // =======================================

//     useEffect(() => {
//         if (!driverId) {
//             setStatusMsg("Error: Driver ID is missing.");
//             return;
//         }

//         const socket = io(SOCKET_URL);
//         socketRef.current = socket;

//         socket.on("connect", () => {
//             setSocketConnected(true);
//             setStatusMsg("Connected ✔ Ready to receive orders");
//             socket.emit("driver-join", driverId); 
//         });

//         const handleNewOrder = (orderData) => {
//             console.log("🔥 RECEIVED NEW ORDER VIA SOCKET:", orderData);
//             // 🚨 يتم تحديث قائمة الطلبات المتاحة بطلب جديد (لاستمرارية البيانات)
//             setAvailableOrders(prevOrders => [orderData, ...prevOrders]);
            
//             // وعرض الـ Modal كإشعار لحظي
//             if (!isOrderAccepted) setNewOrder(orderData); 
//         };

//         socket.on("new-order", handleNewOrder); // 🚨 اسم الحدث يجب أن يتطابق مع الخلفية
        
//         socket.on("order-accepted", (data) => {
//             // إزالة الطلب من قائمة الطلبات المتاحة إذا قبله سائق آخر
//             setAvailableOrders(prevOrders => 
//                 prevOrders.filter(order => order.order_number !== data.order_number)
//             );
            
//             if (newOrder && newOrder.order_number === data.order_number) {
//                 setNewOrder(null); 
//                 alert(`Order #${data.order_number} was accepted by another driver.`);
//             }
//         });

//         socket.on("disconnect", () => {
//             setSocketConnected(false);
//             setStatusMsg("Disconnected… Reconnecting");
//         });

//         return () => {
//             socket.off("new-order-available", handleNewOrder);
//             socket.off("order-accepted");
//             socket.disconnect();
//         };
//     }, [driverId, isOrderAccepted, newOrder]);
    
//     // =======================================
//     // 3. ACTION HANDLERS
//     // =======================================

//     const handleAcceptOrder = async (orderToAccept) => {
//         const orderNumber = orderToAccept.order_number;
        
//         try {
//             setStatusMsg(`Accepting order #${orderNumber}...`);
//             const res = await api.post("/orders/accept", {
//                 order_number: orderNumber,
//                 driver_id: driverId,
//             });

//             if (res.status === 200 || res.status === 201) {
//                 setCurrentOrderId(orderNumber);
//                 setIsOrderAccepted(true);
//                 setNewOrder(null);
                
//                 // 🆕 إزالة الطلب المقبول من قائمة الطلبات المتاحة
//                 setAvailableOrders(prevOrders => 
//                     prevOrders.filter(order => order.order_number !== orderNumber)
//                 );
                
//                 setStatusMsg(`Order #${orderNumber} accepted! Start tracking.`);
//             }
//         } catch (error) {
//             console.error("Error accepting order:", error);
//             const errMsg = error.response?.data?.error || "Acceptance failed!";
//             setStatusMsg(`Failed to accept order: ${errMsg}`);
//             alert(errMsg);
//         }
//     };

//     const startTracking = () => {
//         // ... (وظيفة التتبع تبقى كما هي)
//         if (!navigator.geolocation) {
//             alert("Your device does not support GPS.");
//             return;
//         }
//         if (!isOrderAccepted && !initialOrderNumber) {
//             alert("Please accept an order first or ensure an order ID is provided.");
//             return;
//         }

//         setIsTracking(true);
//         setStatusMsg("Sending live location…");

//         const orderToTrack = currentOrderId || initialOrderNumber;

//         watchIdRef.current = navigator.geolocation.watchPosition(
//             (pos) => {
//                 const { latitude, longitude } = pos.coords;
//                 setCurrentPos([latitude, longitude]);

//                 if (socketRef.current?.connected && orderToTrack) {
//                     socketRef.current.emit("update-location", {
//                         orderId: orderToTrack,
//                         driverId,
//                         lat: latitude,
//                         lng: longitude,
//                     });
//                 }
//             },
//             (err) => setStatusMsg("GPS Error: " + err.message),
//             { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
//         );
//     };

//     const stopTracking = () => {
//         // ... (وظيفة إيقاف التتبع تبقى كما هي)
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//         setIsTracking(false);
//         setStatusMsg("Tracking stopped.");

//         const orderToTrack = currentOrderId || initialOrderNumber;
        
//         if (socketRef.current?.connected && orderToTrack && currentPos) {
//             socketRef.current.emit("update-location", {
//                 orderId: orderToTrack,
//                 driverId,
//                 lat: currentPos[0],
//                 lng: currentPos[1],
//             });
//         }
//     };
    
//     // =======================================
//     // 4. RENDERING LOGIC (فصل عرض الطلبات عن التتبع)
//     // =======================================

//     // 🆕 وظيفة مساعدة لعرض الطلبات المتاحة
//     const renderAvailableOrdersList = () => (
//         <Paper 
//             elevation={8} 
//             sx={{ width: "100%", maxWidth: 600, p: 3, borderRadius: 4 }}
//         >
//             <Typography variant="h5" fontWeight={700} textAlign="center" mb={3}>
//                 📦 Available Orders ({availableOrders.length})
//             </Typography>
//             <Divider sx={{ mb: 3 }} />

//             {availableOrders.length === 0 ? (
//                 <Alert severity="info" sx={{ textAlign: 'center' }}>
//                     Waiting for new delivery requests...
//                 </Alert>
//             ) : (
//                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
//                     {availableOrders.map((order) => (
//                         <Card key={order.order_number} variant="outlined" sx={{ p: 1.5 }}>
//                             <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
//                                 <Typography variant="h6" color="primary">Order #{order.order_number}</Typography>
//                                 <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
//                                     <LocationOn fontSize="small" /> 
//                                     **Address:** {order.customer?.address || 'N/A'}
//                                 </Typography>
//                                 <Typography variant="body2" color="text.secondary">
//                                     **Item:** {order.type_of_item || 'General'} | **Received:** {new Date(order.createdAt).toLocaleTimeString()}
//                                 </Typography>
//                                 <Button 
//                                     variant="contained" 
//                                     color="success" 
//                                     size="small" 
//                                     onClick={() => handleAcceptOrder(order)}
//                                     sx={{ mt: 1, float: 'right' }}
//                                 >
//                                     Accept
//                                 </Button>
//                             </CardContent>
//                         </Card>
//                     ))}
//                 </Box>
//             )}
//         </Paper>
//     );

//     // 🆕 الوظيفة الرئيسية: إما عرض قائمة الطلبات أو واجهة التتبع
//     if (!isOrderAccepted) {
//         return (
//             <Box
//                 sx={{
//                     width: "100%",
//                     display: "flex",
//                     justifyContent: "center",
//                     mt: { xs: 2, sm: 3 },
//                     px: { xs: 1, sm: 2 },
//                 }}
//             >
//                 {renderAvailableOrdersList()}

//                 {/* New Order Modal (يبقى كما هو للإشعارات اللحظية) */}
//                 <Modal open={!!newOrder} onClose={() => setNewOrder(null)}>
//                     <Paper 
//                         sx={{
//                             position: "absolute",
//                             top: "50%",
//                             left: "50%",
//                             transform: "translate(-50%, -50%)",
//                             width: { xs: "85%", sm: 400 },
//                             p: { xs: 2, sm: 3 },
//                             textAlign: "center",
//                             borderRadius: 3,
//                         }}
//                     >
//                         <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
//                             <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} /> New Delivery Request
//                         </Typography>

//                         {newOrder && (
//                             <Box textAlign="left" mb={2} sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2 }}>
//                                 <Typography variant="body2"><strong>Order ID:</strong> {newOrder.order_number}</Typography>
//                                 <Typography variant="body2"><strong>Item Type:</strong> {newOrder.type_of_item}</Typography>
//                                 <Typography variant="body2" sx={{ wordWrap: "break-word" }}>
//                                     <strong>Address:</strong> {newOrder.customer_address || newOrder.customer?.address}
//                                 </Typography>
//                             </Box>
//                         )}

//                         <Button 
//                             variant="contained" 
//                             color="success" 
//                             fullWidth 
//                             onClick={() => handleAcceptOrder(newOrder)} // 🚨 تمرير الطلب نفسه
//                             sx={{ py: 1.5, fontSize: "0.95rem", fontWeight: 600, mb: 1 }}
//                         >
//                             Accept Order
//                         </Button>
//                         <Button
//                             variant="outlined"
//                             color="error"
//                             fullWidth
//                             onClick={() => setNewOrder(null)}
//                             sx={{ py: 1.5, fontWeight: 600 }}
//                         >
//                             Decline
//                         </Button>
//                     </Paper>
//                 </Modal>
//             </Box>
//         );
//     }
    
//     // ↩️ العرض في حالة قبول الطلب (باقي الكود الأصلي)
//     return (
//         <Box
//             sx={{
//                 width: "100%",
//                 display: "flex",
//                 justifyContent: "center",
//                 mt: { xs: 2, sm: 3 },
//                 px: { xs: 1, sm: 2 },
//             }}
//         >
//             <Paper
//                 elevation={8}
//                 sx={{
//                     width: "100%",
//                     maxWidth: 600, 
//                     p: { xs: 2, sm: 3 },
//                     borderRadius: 4,
//                     background: "#ffffff",
//                     boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
//                 }}
//             >
//                 {/* Header, Status, Info Sections (Keep these as they are) */}
                
//                 <Typography
//                     fontWeight={700}
//                     variant="h5"
//                     textAlign="center"
//                     mb={2}
//                     sx={{
//                         display: "flex", alignItems: "center", justifyContent: "center", gap: 1,
//                         fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
//                     }}
//                 >
//                     <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: "#0ABE51" }} />
//                     Live Driver Tracking
//                 </Typography>

//                 <Paper
//                     elevation={0}
//                     sx={{
//                         display: "flex", alignItems: "center", justifyContent: "space-between", p: 1.5, mb: 2, borderRadius: 3,
//                         background: socketConnected ? "#e6f4ea" : "#ffeaea",
//                         border: socketConnected ? "1px solid #4caf50" : "1px solid #f44336",
//                     }}
//                 >
//                     <Typography
//                         variant="body2" fontWeight={600} sx={{ display: "flex", alignItems: "center", gap: 1 }}
//                     >
//                         <WifiIcon fontSize="small" color={socketConnected ? "success" : "error"} />
//                         {socketConnected ? "Connected" : "Offline"}
//                     </Typography>
//                     <Typography variant="body2">{statusMsg}</Typography>
//                 </Paper>

//                 <Box
//                     sx={{
//                         p: 1.5, mb: 2, borderRadius: 3, background: "#f7f9fc", border: "1px solid #e0e6ed",
//                         fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.95rem" },
//                     }}
//                 >
//                     <Typography><strong>Order ID:</strong> {currentOrderId || initialOrderNumber}</Typography>
//                     <Typography><strong>Driver ID:</strong> {driverId}</Typography>
//                     <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                         <GpsFixedIcon fontSize="small" color="primary" /> <strong>Status:</strong> {statusMsg}
//                     </Typography>
//                 </Box>

//                 <Divider sx={{ my: 2 }} />

//                 {/* Map Section (Keep this as it is) */}
//                 <Box
//                     sx={{
//                         height: { xs: 150, sm: 180, md: 200 }, width: "100%", borderRadius: 3, overflow: "hidden", mb: 2, border: "1px solid #ddd", mx: "auto",
//                     }}
//                 >
//                     {currentPos ? (
//                         <MapContainer center={currentPos} zoom={16} style={{ height: "100%", width: "100%" }}>
//                             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                             <Marker position={currentPos} icon={driverIcon}>
//                                 <Popup>Your Location</Popup>
//                             </Marker>
//                         </MapContainer>
//                     ) : (
//                         <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#555", flexDirection: "column", gap: 1, }}>
//                             <CircularProgress size={24} />
//                             <Typography color="textSecondary" fontSize="0.85rem">
//                                 Waiting for GPS…
//                             </Typography>
//                         </Box>
//                     )}
//                 </Box>

//                 {/* Buttons (Keep these as they are) */}
//                 <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={1.5}>
//                     {!isTracking ? (
//                         <Button
//                             variant="contained" fullWidth color="success" onClick={startTracking} size="large"
//                             disabled={!isOrderAccepted && !initialOrderNumber} // 🚨 استخدام initialOrderNumber
//                             sx={{ py: 1.6, fontSize: { xs: "0.9rem", sm: "1rem" }, borderRadius: 3, fontWeight: 600, }}
//                         >
//                             Start Delivery
//                         </Button>
//                     ) : (
//                         <Button
//                             variant="contained" fullWidth color="error" onClick={stopTracking} size="large"
//                             sx={{ py: 1.6, fontSize: { xs: "0.9rem", sm: "1rem" }, borderRadius: 3, fontWeight: 600, }}
//                         >
//                             Stop Delivery
//                         </Button>
//                     )}
//                 </Box>
//             </Paper>
//         </Box>
//     );
// }

// import { useEffect, useState, useRef } from "react";
// import {
//     Box,
//     Button,
//     Typography,
//     Paper,
//     CircularProgress,
//     Divider,
//     Modal,
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
//     iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
//     iconSize: [50, 50],
//     iconAnchor: [25, 25],
//     popupAnchor: [0, -20],
// });

// const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

// export default function DriverTracking({ orderNumber, driverId }) {
//     const [isTracking, setIsTracking] = useState(false);
//     const [currentPos, setCurrentPos] = useState(null);
//     const [statusMsg, setStatusMsg] = useState("Ready…");
//     const [socketConnected, setSocketConnected] = useState(false);
//     const [newOrder, setNewOrder] = useState(null);
//     const [isOrderAccepted, setIsOrderAccepted] = useState(false);
//     const [currentOrderId, setCurrentOrderId] = useState(orderNumber);

//     const watchIdRef = useRef(null);
//     const socketRef = useRef(null);

//     // 1️⃣ دالة لجلب الطلبات الفائتة من قاعدة البيانات
//     const checkPendingOrders = async () => {
//         if (!driverId || isOrderAccepted) return;

//         try {
//             // ملاحظة: endpoint `/orders/pending/:driverId` غير موجود في المسارات المرسلة
//             // سنفترض أنه موجود ويقوم بإرجاع طلبات بحالة 'received'
//             const res = await api.get(`/orders/pending/${driverId}`);
            
//             if (res.data && res.data.length > 0) {
//                 console.log("Found pending orders:", res.data);
//                 // نعتبر أول طلب هو الطلب الجديد لكي يظهر الـ Modal
//                 setNewOrder(res.data[0]); 
//             }
//         } catch (error) {
//             // تجاهل خطأ 404 إذا لم يتم العثور على طلبات معلقة
//             if (error.response && error.response.status !== 404) {
//                  console.error("Error fetching pending orders:", error);
//             }
//         }
//     };

//     // 2️⃣ نقوم باستدعاء الدالة عند تحميل الصفحة (mount)
//     useEffect(() => {
//         checkPendingOrders();
//     }, [driverId]);


//     if (!driverId) {
//         return (
//             <Box sx={{ p: 3, textAlign: "center" }}>
//                 <CircularProgress size={28} />
//                 <Typography mt={2} fontWeight={500} color="textSecondary">
//                     Loading driver profile...
//                 </Typography>
//                 <Typography mt={1} color="error" fontWeight={600}>
//                     (Driver ID is missing)
//                 </Typography>
//             </Box>
//         );
//     }

//     useEffect(() => {
//         if (!driverId) {
//             setStatusMsg("Error: Driver ID is missing.");
//             return;
//         }

//         const socket = io(SOCKET_URL);
//         socketRef.current = socket;

//         socket.on("connect", () => {
//             setSocketConnected(true);
//             setStatusMsg("Connected ✔ Ready to receive orders");
//             // 🚨 هنا يتم الانضمام إلى غرفة السائقين النشطين
//             socket.emit("driver-join", driverId); 
//         });

//         const handleNewOrder = (orderData) => {
//             // Socket للتنبيه اللحظي - يظهر فقط إذا لم يقبل السائق طلبًا آخر بعد
//             if (!isOrderAccepted) setNewOrder(orderData);
//         };

//         socket.on("new-order", handleNewOrder);
        
//         // يمكن إضافة معالج لـ 'order-accepted' لمنع قبول الطلبات المقبولة
//         socket.on("order-accepted", (data) => {
//             if (newOrder && newOrder.order_number === data.order_number) {
//                 setNewOrder(null); // إزالة الـ Modal إذا قبله سائق آخر
//                 alert(`Order #${data.order_number} was accepted by another driver.`);
//             }
//         });

//         socket.on("disconnect", () => {
//             setSocketConnected(false);
//             setStatusMsg("Disconnected… Reconnecting");
//         });

//         return () => {
//             socket.off("new-order", handleNewOrder);
//             socket.off("order-accepted");
//             socket.disconnect();
//         };
//     }, [driverId, isOrderAccepted, newOrder]);

//     const handleAcceptOrder = async () => {
//         if (!newOrder) return;

//         try {
//             setStatusMsg(`Accepting order #${newOrder.order_number}...`);
//             const res = await api.post("/orders/accept", {
//                 order_number: newOrder.order_number,
//                 driver_id: driverId,
//             });

//             // تأكيد من الخادم
//             if (res.status === 200 || res.status === 201) {
//                  setCurrentOrderId(newOrder.order_number);
//                  setIsOrderAccepted(true);
//                  setNewOrder(null);
//                  setStatusMsg(`Order #${newOrder.order_number} accepted! Start tracking.`);
//             }
//         } catch (error) {
//             console.error("Error accepting order:", error);
//             const errMsg = error.response?.data?.error || "Acceptance failed!";
//             setStatusMsg(`Failed to accept order: ${errMsg}`);
//             alert(errMsg);
//         }
//     };

//     const startTracking = () => {
//         if (!navigator.geolocation) {
//             alert("Your device does not support GPS.");
//             return;
//         }
//         if (!isOrderAccepted && !orderNumber) {
//             alert("Please accept an order first or ensure an order ID is provided.");
//             return;
//         }

//         setIsTracking(true);
//         setStatusMsg("Sending live location…");

//         const orderToTrack = currentOrderId || orderNumber;

//         watchIdRef.current = navigator.geolocation.watchPosition(
//             (pos) => {
//                 const { latitude, longitude } = pos.coords;
//                 setCurrentPos([latitude, longitude]);

//                 if (socketRef.current?.connected && orderToTrack) {
//                     socketRef.current.emit("update-location", {
//                         orderId: orderToTrack,
//                         driverId,
//                         lat: latitude,
//                         lng: longitude,
//                     });
//                 }
//             },
//             (err) => setStatusMsg("GPS Error: " + err.message),
//             { enableHighAccuracy: true, maximumAge: 0, timeout: 8000 }
//         );
//     };

//     const stopTracking = () => {
//         navigator.geolocation.clearWatch(watchIdRef.current);
//         watchIdRef.current = null;
//         setIsTracking(false);
//         setStatusMsg("Tracking stopped.");

//         const orderToTrack = currentOrderId || orderNumber;
        
//         // إرسال تحديث أخير (اختياري)
//         if (socketRef.current?.connected && orderToTrack && currentPos) {
//             socketRef.current.emit("update-location", {
//                 orderId: orderToTrack,
//                 driverId,
//                 lat: currentPos[0],
//                 lng: currentPos[1],
//             });
//         }
//     };

//     return (
//         <Box
//             sx={{
//                 width: "100%",
//                 display: "flex",
//                 justifyContent: "center",
//                 mt: { xs: 2, sm: 3 },
//                 px: { xs: 1, sm: 2 },
//             }}
//         >
//             <Paper
//                 elevation={8}
//                 sx={{
//                     width: "100%",
//                     maxWidth: 600, // smaller container
//                     p: { xs: 2, sm: 3 },
//                     borderRadius: 4,
//                     background: "#ffffff",
//                     boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
//                 }}
//             >
//                 {/* Header */}
//                 <Typography
//                     fontWeight={700}
//                     variant="h5"
//                     textAlign="center"
//                     mb={2}
//                     sx={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "center",
//                         gap: 1,
//                         fontSize: { xs: "1.2rem", sm: "1.5rem", md: "1.8rem" },
//                     }}
//                 >
//                     <DirectionsCar sx={{ fontSize: { xs: 28, sm: 32, md: 36 }, color: "#0ABE51" }} />
//                     Live Driver Tracking
//                 </Typography>

//                 {/* Status */}
//                 <Paper
//                     elevation={0}
//                     sx={{
//                         display: "flex",
//                         alignItems: "center",
//                         justifyContent: "space-between",
//                         p: 1.5,
//                         mb: 2,
//                         borderRadius: 3,
//                         background: socketConnected ? "#e6f4ea" : "#ffeaea",
//                         border: socketConnected ? "1px solid #4caf50" : "1px solid #f44336",
//                     }}
//                 >
//                     <Typography
//                         variant="body2"
//                         fontWeight={600}
//                         sx={{ display: "flex", alignItems: "center", gap: 1 }}
//                     >
//                         <WifiIcon fontSize="small" color={socketConnected ? "success" : "error"} />
//                         {socketConnected ? "Connected" : "Offline"}
//                     </Typography>
//                     <Typography variant="body2">{statusMsg}</Typography>
//                 </Paper>

//                 {/* Info */}
//                 <Box
//                     sx={{
//                         p: 1.5,
//                         mb: 2,
//                         borderRadius: 3,
//                         background: "#f7f9fc",
//                         border: "1px solid #e0e6ed",
//                         fontSize: { xs: "0.8rem", sm: "0.9rem", md: "0.95rem" },
//                     }}
//                 >
//                     <Typography><strong>Order ID:</strong> {currentOrderId || "Awaiting New..."}</Typography>
//                     <Typography><strong>Driver ID:</strong> {driverId}</Typography>
//                     <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
//                         <GpsFixedIcon fontSize="small" color="primary" /> <strong>Status:</strong> {statusMsg}
//                     </Typography>
//                 </Box>

//                 <Divider sx={{ my: 2 }} />

//                 {/* Map */}
//                 <Box
//                     sx={{
//                         height: { xs: 150, sm: 180, md: 200 }, // smaller map
//                         width: "100%",
//                         borderRadius: 3,
//                         overflow: "hidden",
//                         mb: 2,
//                         border: "1px solid #ddd",
//                         mx: "auto",
//                     }}
//                 >
//                     {currentPos ? (
//                         <MapContainer center={currentPos} zoom={16} style={{ height: "100%", width: "100%" }}>
//                             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//                             <Marker position={currentPos} icon={driverIcon}>
//                                 <Popup>Your Location</Popup>
//                             </Marker>
//                         </MapContainer>
//                     ) : (
//                         <Box
//                             sx={{
//                                 height: "100%",
//                                 display: "flex",
//                                 alignItems: "center",
//                                 justifyContent: "center",
//                                 color: "#555",
//                                 flexDirection: "column",
//                                 gap: 1,
//                             }}
//                         >
//                             <CircularProgress size={24} />
//                             <Typography color="textSecondary" fontSize="0.85rem">
//                                 Waiting for GPS…
//                             </Typography>
//                         </Box>
//                     )}
//                 </Box>

//                 {/* Buttons */}
//                 <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={1.5}>
//                     {!isTracking ? (
//                         <Button
//                             variant="contained"
//                             fullWidth
//                             color="success"
//                             onClick={startTracking}
//                             size="large"
//                             disabled={!isOrderAccepted && !orderNumber}
//                             sx={{
//                                 py: 1.6,
//                                 fontSize: { xs: "0.9rem", sm: "1rem" },
//                                 borderRadius: 3,
//                                 fontWeight: 600,
//                             }}
//                         >
//                             Start Delivery
//                         </Button>
//                     ) : (
//                         <Button
//                             variant="contained"
//                             fullWidth
//                             color="error"
//                             onClick={stopTracking}
//                             size="large"
//                             sx={{
//                                 py: 1.6,
//                                 fontSize: { xs: "0.9rem", sm: "1rem" },
//                                 borderRadius: 3,
//                                 fontWeight: 600,
//                             }}
//                         >
//                             Stop Delivery
//                         </Button>
//                     )}
//                 </Box>
//             </Paper>

//             {/* New Order Modal */}
//             <Modal open={!!newOrder} onClose={() => setNewOrder(null)}>
//                 <Paper
//                     sx={{
//                         position: "absolute",
//                         top: "50%",
//                         left: "50%",
//                         transform: "translate(-50%, -50%)",
//                         width: { xs: "85%", sm: 400 },
//                         p: { xs: 2, sm: 3 },
//                         textAlign: "center",
//                         borderRadius: 3,
//                     }}
//                 >
//                     <Typography variant="h6" fontWeight={700} color="primary" mb={2}>
//                         <CheckCircleIcon fontSize="small" sx={{ mr: 1 }} /> New Delivery Request
//                     </Typography>

//                     {newOrder && (
//                         <Box
//                             textAlign="left"
//                             mb={2}
//                             sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2 }}
//                         >
//                             <Typography variant="body2"><strong>Order ID:</strong> {newOrder.order_number}</Typography>
//                             <Typography variant="body2"><strong>Item Type:</strong> {newOrder.type_of_item}</Typography>
//                             <Typography variant="body2" sx={{ wordWrap: "break-word" }}>
//                                 <strong>Address:</strong> {newOrder.customer_address || newOrder.customer?.address}
//                             </Typography>
//                         </Box>
//                     )}

//                     <Button
//                         variant="contained"
//                         color="success"
//                         fullWidth
//                         onClick={handleAcceptOrder}
//                         sx={{ py: 1.5, fontSize: "0.95rem", fontWeight: 600, mb: 1 }}
//                     >
//                         Accept Order
//                     </Button>

//                     <Button
//                         variant="outlined"
//                         color="error"
//                         fullWidth
//                         onClick={() => setNewOrder(null)}
//                         sx={{ py: 1.5, fontWeight: 600 }}
//                     >
//                         Decline
//                     </Button>
//                 </Paper>
//             </Modal>
//         </Box>
//     );
// }







