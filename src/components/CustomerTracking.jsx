// src/components/tracking/CustomerTracking.jsx

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Box, Paper, Typography, LinearProgress } from "@mui/material";
import { useLocation } from "react-router-dom";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "./api"; // تأكد من مسار ملف الـ api

// --- إعداد الأيقونات ---
// 1. أيقونة السائق (سيارة)
const driverIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png", // سيارة حمراء
    iconSize: [40, 40],
    iconAnchor: [20, 20], 
    popupAnchor: [0, -20]
});

// 2. أيقونة العميل (منزل/وجهة)
const homeIcon = new L.Icon({
    iconUrl: "https://cdn-icons-png.flaticon.com/512/619/619153.png", // دبوس منزل أزرق
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40]
});

// --- مكون للتحكم في حركة الخريطة والزوم التلقائي ---
function MapController({ driverLoc, customerLoc }) {
    const map = useMap();

    useEffect(() => {
        if (!driverLoc || !customerLoc) return;

        // إنشاء حدود تشمل النقطتين (السائق والعميل)
        const bounds = L.latLngBounds([
            [driverLoc.lat, driverLoc.lng],
            [customerLoc.lat, customerLoc.lng]
        ]);

        // تحريك الكاميرا لتشمل النقطتين مع هامش (padding)
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16, animate: true });

    }, [driverLoc, customerLoc, map]);

    return null;
}

// --- متغير البيئة للاتصال ---
const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function CustomerTracking() {
    const location = useLocation();
    const [orderId, setOrderId] = useState("");
    
    // حالة لتخزين موقع السائق (المتغير)
    const [driverLocation, setDriverLocation] = useState(null);
    
    // حالة لتخزين موقع العميل (الثابت)
    const [customerLocation, setCustomerLocation] = useState(null);
    
    const [status, setStatus] = useState("Connecting...");
    const socketRef = useRef(null);

    // 1. قراءة رقم الطلب
    useEffect(() => {
        if (location.state?.orderNumber) {
            setOrderId(location.state.orderNumber);
        }
    }, [location.state]);

    // 2. جلب بيانات الطلب الأولية (لمعرفة مكان العميل)
    useEffect(() => {
        if (!orderId) return;
        const fetchInitialData = async () => {
            try {
                const res = await api.get(`/public/order/track/${orderId}`);
                const data = res.data;
                
                // تحديد موقع العميل (الوجهة)
                if (data.customer && data.customer.lat) {
                    setCustomerLocation({ lat: data.customer.lat, lng: data.customer.lng });
                }

                // إذا كان هناك موقع مسجل للسائق مسبقاً
                if (data.tracked_location && data.tracked_location.lat) {
                    setDriverLocation(data.tracked_location);
                }
                setStatus(`Order Status: ${data.status}`);
            } catch (err) {
                console.error("Error fetching order:", err);
            }
        };
        fetchInitialData();
    }, [orderId]);

    // 3. الاتصال بالسوكيت (Socket.IO) للتحديث اللحظي
    useEffect(() => {
        if (!orderId) return;

        const socket = io(SOCKET_URL);
        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("🟢 Connected to tracking server");
            socket.emit("join-order", orderId);
        });

        // 🔥 هذا هو الجزء السحري: استقبال الموقع الجديد
        socket.on("location-updated", (data) => {
            console.log("📍 New Driver Location:", data);
            // تحديث الـ State سيجبر الخريطة على إعادة الرسم
            setDriverLocation({ lat: data.lat, lng: data.lng });
        });

        return () => socket.disconnect();
    }, [orderId]);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
            <Paper elevation={4} sx={{ maxWidth: 800, margin: "20px auto", borderRadius: 3, overflow: 'hidden' }}>
                
                {/* Header Info */}
                <Box sx={{ p: 3, bgcolor: "#f5f5f5", borderBottom: "1px solid #ddd" }}>
                    <Typography variant="h5" fontWeight="bold">🚚 Delivery Tracking</Typography>
                    <Typography variant="body2" color="text.secondary">Order #{orderId}</Typography>
                    <Box mt={2}>
                        <Typography variant="caption" fontWeight="bold">{status}</Typography>
                        {!driverLocation && <LinearProgress sx={{ mt: 1 }} />}
                    </Box>
                </Box>

                {/* Map Area */}
                <Box sx={{ height: "500px", width: "100%", position: "relative" }}>
                    {/* عرض رسالة انتظار إذا لم ينضم السائق بعد */}
                    {!driverLocation && customerLocation && (
                        <Box sx={{ 
                            position: 'absolute', zIndex: 999, top: '50%', left: '50%', 
                            transform: 'translate(-50%, -50%)', bgcolor: 'rgba(255,255,255,0.9)', 
                            p: 2, borderRadius: 2, boxShadow: 3 
                        }}>
                            <Typography>Waiting for driver to start moving...</Typography>
                        </Box>
                    )}

                    <MapContainer 
                        center={customerLocation || [33.888, 35.495]} 
                        zoom={13} 
                        style={{ height: "100%", width: "100%" }}
                    >
                        <TileLayer 
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
                            attribution="&copy; OpenStreetMap contributors"
                        />

                        {/* 🏠 1. ماركر العميل (ثابت) */}
                        {customerLocation && (
                            <Marker position={[customerLocation.lat, customerLocation.lng]} icon={homeIcon}>
                                <Popup><b>My Location</b><br/>Delivery Destination</Popup>
                            </Marker>
                        )}

                        {/* 🚗 2. ماركر السائق (متحرك) */}
                        {driverLocation && (
                            <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon}>
                                <Popup><b>Driver is here!</b></Popup>
                            </Marker>
                        )}

                        {/* 〰️ 3. خط يربط بينهما (المسار المباشر) */}
                        {driverLocation && customerLocation && (
                            <Polyline 
                                positions={[
                                    [driverLocation.lat, driverLocation.lng],
                                    [customerLocation.lat, customerLocation.lng]
                                ]}
                                color="blue"
                                dashArray="10, 10" // خط متقطع
                                opacity={0.6}
                            />
                        )}

                        {/* 🎮 متحكم الكاميرا */}
                        <MapController driverLoc={driverLocation} customerLoc={customerLocation} />

                    </MapContainer>
                </Box>
            </Paper>
        </motion.div>
    );
}