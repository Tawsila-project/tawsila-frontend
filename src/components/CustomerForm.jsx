import { useState, useEffect, useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Box, TextField, MenuItem, Button, Paper, Typography, Modal } from "@mui/material";
import { MapContainer, TileLayer, Marker, useMap, Popup, useMapEvents } from "react-leaflet"; 
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch"; 
import L from "leaflet";
import api from "./api"; 
import Logo from "../assets/Logo.png"; 
import Welcome from "../components/WelcomeCustomer";

// --- إصلاح أيقونات Leaflet ---
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// --- Helper: Reverse Geocoding تفصيلي ---
async function getAddress(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
        const data = await res.json();
        const addr = data.address;
        return [
            addr.road,
            addr.neighbourhood,
            addr.suburb,
            addr.city || addr.town || addr.village,
            addr.state,
            addr.country
        ].filter(Boolean).join(", ") || data.display_name || "Unknown location";
    } catch {
        return "Unknown location";
    }
}

// --- Map click handler مع جلب العنوان التفصيلي ---
function MapClickHandler({ setPosition, setForm }) {
    const map = useMap();

    useMapEvents({
        click: async (e) => {
            const coords = e.latlng.wrap();
            setPosition(coords);
            const address = await getAddress(coords.lat, coords.lng);
            setForm(prev => ({ ...prev, customer_address: address }));
            map.flyTo(coords, 17);
        }
    });

    return null;
}

// --- Search Control ---
function SearchControl({ setPosition, setForm }) {
    const map = useMap();

    useEffect(() => {
        const provider = new OpenStreetMapProvider();
        const searchControl = new GeoSearchControl({
            provider, 
            style: "bar", 
            showMarker: false, 
            retainZoomLevel: false,
            animateZoom: true, 
            autoClose: true, 
            searchLabel: "Enter full street or neighborhood name...", 
            keepResult: true,
        });

        map.addControl(searchControl);

        map.on("geosearch/showlocation", async (result) => {
            const { x, y, label } = result.location;
            const coords = { lat: y, lng: x };
            setPosition(coords);
            const address = await getAddress(coords.lat, coords.lng);
            setForm(prev => ({ ...prev, customer_address: address }));
            map.flyTo(coords, 17);
        });

        return () => map.removeControl(searchControl);
    }, [map, setPosition, setForm]);

    return null;
}

// --- Marker مع سحب لتحديث العنوان ---
function LocationSelector({ position, setPosition, setForm }) {
    const markerRef = useRef(null);

    const eventHandlers = useMemo(() => ({
        dragend: async () => {
            const marker = markerRef.current;
            if (!marker) return;
            const coords = marker.getLatLng();
            setPosition(coords);
            const address = await getAddress(coords.lat, coords.lng);
            setForm(prev => ({ ...prev, customer_address: address }));
        }
    }), [setPosition, setForm]);

    if (!position) return null;

    return (
        <Marker draggable eventHandlers={eventHandlers} position={position} ref={markerRef}>
            <Popup>Drag to adjust delivery location</Popup>
        </Marker>
    );
}

// --- Fly to position ---
function FlyToPosition({ position }) {
    const map = useMap();
    useEffect(() => {
        if (position) map.flyTo(position, 17);
    }, [position, map]);
    return null;
}

// --- المكون الرئيسي ---
export default function CustomerForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        customer_name: "", customer_phone: "", customer_address: "", type_of_item: "",
    });
    const [position, setPosition] = useState(null);
    const [orderNumber, setOrderNumber] = useState("");
    const [open, setOpen] = useState(false);
    const [showWelcome, setShowWelcome] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const itemOptions = ["Electronics", "Clothes", "Food Delivery", "Documents", "Furniture", "Other"];
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    // --- Submit Order ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return;
        setIsSubmitting(true);

        if (!position) {
            alert("❌ Please select location");
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await api.post("/public/order/submit", {
                customer: {
                    name: form.customer_name,
                    phone: form.customer_phone,
                    address: form.customer_address,
                    coords: position,
                },
                type_of_item: form.type_of_item,
            });
            setOrderNumber(res.data.order.order_number);
            setOpen(true);
        } catch (err) {
            alert("Failed to submit order");
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        const timer = setTimeout(() => setShowWelcome(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
        {showWelcome ? <Welcome /> :
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Paper elevation={6} sx={{ padding: 3, maxWidth: 600, margin: "20px auto", borderRadius: 3 }}>
                <img src={Logo} alt="Logo" style={{ width: 90, height: 90, display: "block", margin: "0 auto 8px auto" }} />
                <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>Customer Delivery Request</Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField label="Full Name" name="customer_name" variant="outlined" fullWidth required value={form.customer_name} onChange={handleChange} />
                    <TextField label="Phone Number" name="customer_phone" type="tel" variant="outlined" fullWidth required value={form.customer_phone} onChange={handleChange} />
                    <TextField label="Address" name="customer_address" variant="outlined" fullWidth multiline rows={2} required value={form.customer_address} onChange={handleChange} />
                    <TextField select label="Type of Item" name="type_of_item" variant="outlined" fullWidth required value={form.type_of_item} onChange={handleChange}>
                        {itemOptions.map((item, idx) => <MenuItem key={idx} value={item}>{item}</MenuItem>)}
                    </TextField>

                    <Typography fontWeight={600} mt={2}>Select Delivery Location</Typography>
                    <Box sx={{ height: "350px", width: "100%", borderRadius: "12px", overflow: "hidden", border: position ? "2px solid green" : "1px solid #ccc" }}>
                        <MapContainer center={[34.435, 35.836]} zoom={13} style={{ height: "100%", width: "100%" }}>
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                            <MapClickHandler setPosition={setPosition} setForm={setForm} />
                            <SearchControl setPosition={setPosition} setForm={setForm} />
                            <LocationSelector position={position} setPosition={setPosition} setForm={setForm} />
                            {position && <FlyToPosition position={position} />}
                        </MapContainer>
                    </Box>

                    {position && form.customer_address &&
                        <Typography variant="subtitle1" textAlign="center" fontWeight={600} color="primary" mt={1}>
                            Selected Address: {form.customer_address}
                        </Typography>
                    }

                    <Button
                        variant="outlined"
                        onClick={async () => {
                            if (!navigator.geolocation) return alert("Geolocation not supported");
                            navigator.geolocation.getCurrentPosition(async (pos) => {
                                const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                                setPosition(coords);
                                const address = await getAddress(coords.lat, coords.lng);
                                setForm(prev => ({ ...prev, customer_address: address }));

                                if (pos.coords.accuracy > 200) alert(`⚠️ GPS accuracy very low (±${Math.round(pos.coords.accuracy)}m). Move outside for better accuracy.`);
                                else if (pos.coords.accuracy > 50) alert(`⚠️ GPS accuracy low (±${Math.round(pos.coords.accuracy)}m). You can adjust marker manually.`);
                            }, () => alert("GPS permission denied"), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
                        }}
                    >
                        📍 Use My Current Location
                    </Button>

                    <Button variant="contained" color="primary" type="submit" sx={{ paddingY: 1.4, borderRadius: 2, fontSize: "1rem" }}>
                        {isSubmitting ? "Submitting..." : "Submit"}
                    </Button>
                </Box>
            </Paper>

            <Modal open={open} onClose={() => setOpen(false)}>
                <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", padding: 4, maxWidth: 400, textAlign: "center", borderRadius: 2 }}>
                    <Typography variant="h6" mb={2}>Order Submitted!</Typography>
                    <Typography variant="h5" mb={3} sx={{ fontWeight: "bold" }}>{orderNumber}</Typography>
                    <Button variant="contained" onClick={() => navigate("/TrackingForm", { state: { orderNumber } })}>Track Order</Button>
                    <Button variant="outlined" color="secondary" sx={{ ml: 1 }} onClick={() => setOpen(false)}>Close</Button>
                </Paper>
            </Modal>
        </motion.div>
        }
        </>
    );
}


// import { useState, useEffect, useMemo, useRef } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Box, TextField, MenuItem, Button, Paper, Typography, Modal } from "@mui/material";
// import { MapContainer, TileLayer, Marker, useMap, Popup, useMapEvents } from "react-leaflet"; 
// import { OpenStreetMapProvider, GeoSearchControl, EsriProvider } from "leaflet-geosearch"; // تأكد من استيراد EsriProvider
// import L from "leaflet";
// import api from "./api"; 
// import Logo from "../assets/Logo.png"; 
// import Welcome from "../components/WelcomeCustomer"

// // --- إصلاح أيقونات Leaflet ---
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//     iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//     shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });


// // 1. مكون للتعامل مع النقرات على الخريطة (تم فرض تصحيح الإحداثيات)
// function MapClickHandler({ setPosition, setForm }) {
//     const map = useMap(); 

    
//     useMapEvents({
//         click(e) {
//             const corrected = e.latlng.wrap();
//             setPosition({ lat: corrected.lat, lng: corrected.lng });

//             setForm(prev => ({
//             ...prev,
//             customer_address: "Location selected manually on map"
//             }));

//             map.flyTo(corrected, map.getZoom());
//         }
//         });
//     return null;
// }

// // 2. مكون البحث (استمرار استخدام Esri مع التبديل التلقائي لضمان الثبات)

// // 2. مكون البحث (استخدام OpenStreetMap Provider لتحسين دقة الأحياء)
// function SearchControl({ setPosition, setForm }) {
//     const map = useMap();

//     useEffect(() => {
//         // 💡 التغيير: العودة لـ OpenStreetMap Provider لأنه أفضل في العناوين المحلية
//         const provider = new OpenStreetMapProvider({
//             params: {
//                 // إزالة countrycodes: "LB" لتوسيع البحث ليشمل الأحياء والشوارع
//                 // إضافة language: 'ar' قد تساعد في بعض الحالات
//             },
//         });

//         const searchControl = new GeoSearchControl({
//             provider, 
//             style: "bar", 
//             showMarker: false, 
//             retainZoomLevel: false,
//             animateZoom: true, 
//             autoClose: true, 
//             // تعديل النص ليشمل العنوان التفصيلي
//             searchLabel: "Enter full street or neighborhood name...", 
//             keepResult: true,
//         });

//         map.addControl(searchControl);

//         map.on("geosearch/showlocation", (result) => {
//             const { x, y, label } = result.location;
            
//             // استخدام القاعدة التجريبية التي عملت: القيمة الأصغر هي Latitude (34.xx)
//             let latValue, lngValue;
            
//             // if (parseFloat(x) < parseFloat(y)) {
//             //     latValue = parseFloat(x);
//             //     lngValue = parseFloat(y);
//             // } else {
//             //     latValue = parseFloat(y);
//             //     lngValue = parseFloat(x);
//             // }

//             map.on("geosearch/showlocation", (result) => {
//                 const { x, y, label } = result.location;

//                 const newPos = {
//                     lat: y, // Leaflet-Geosearch returns y = lat
//                     lng: x, // x = lng
//                 };

//                 setPosition(newPos);
//                 setForm(prev => ({ ...prev, customer_address: label }));
//                 map.flyTo(newPos, 17);
//                 });


//             const newPos = { lat: latValue, lng: lngValue };
            
//             setPosition(newPos);
//             setForm((prev) => ({ ...prev, customer_address: label }));
//             map.flyTo(newPos, 17); // زيادة Zoom إلى 17 للاقتراب من الشارع
//         });

//         return () => map.removeControl(searchControl);
//     }, [map, setPosition, setForm]);

//     return null;
// }


// function LocationSelector({ position, setPosition }) {
//     const markerRef = useRef(null); 
    
//     const eventHandlers = useMemo(
//         () => ({
//             dragend() {
//                 const marker = markerRef.current;
//                 if (marker != null) {
//                     setPosition(marker.getLatLng());
//                 }
//             },
//         }),
//         [setPosition]
//     );

//     if (position === null) return null;

//     return (
//         <Marker
//             draggable={true}
//             eventHandlers={eventHandlers}
//             position={position}
//             ref={markerRef} 
//         >
//             <Popup>Delivery Location</Popup>
//         </Marker>
//     );
// }

// // 4. المكون الرئيسي (بدون تغيير)
// export default function CustomerForm() {
//     const navigate = useNavigate();
//     const [form, setForm] = useState({
//         customer_name: "", customer_phone: "", customer_address: "", type_of_item: "",
//     });
    
//     const [position, setPosition] = useState(null);
//     const [orderNumber, setOrderNumber] = useState("");
//     const [open, setOpen] = useState(false);
//     const [showWelcome, setShowWelcome] = useState(true);
//     const [isSubmitting, setIsSubmitting] = useState(false);


//     const itemOptions = ["Electronics", "Clothes", "Food Delivery", "Documents", "Furniture", "Other"];

//     const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });



//     const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (isSubmitting) return; // 🛑 حماية
//     setIsSubmitting(true);

//     if (!position) {
//         alert("❌ Please select location");
//         setIsSubmitting(false);
//         return;
//     }

//     try {
//         const res = await api.post("/public/order/submit", {
//         customer: {
//             name: form.customer_name,
//             phone: form.customer_phone,
//             address: form.customer_address,
//             coords: position,
//         },
//         type_of_item: form.type_of_item,
//         });

//         const id = res.data.order.order_number;
//         setOrderNumber(id);
//         setOpen(true);

//     } catch (err) {
//         alert("Failed to submit order", err);
//     } finally {
//         setIsSubmitting(false); 
//     }
//     };

//     useEffect(() => {
//     const timer = setTimeout(() => {
//         setShowWelcome(false);
//     }, 3000);

//     return () => clearTimeout(timer);
// }, []);


//     return (

//         <>
//         {showWelcome ? (
//             <Welcome />
//         ) : (

//  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
//             <Paper elevation={6} sx={{ padding: 3, maxWidth: 600, margin: "20px auto", borderRadius: 3 }}>
                
//                 <img src={Logo} alt="Logo" style={{ width: 90, height: 90, display: "block", margin: "0 auto 8px auto" }} />
                
//                 <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>Customer Delivery Request</Typography>

//                 <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
//                     <TextField label="Full Name" name="customer_name" variant="outlined" fullWidth required value={form.customer_name} onChange={handleChange} />
//                     <TextField label="Phone Number" name="customer_phone" type="tel" variant="outlined" fullWidth required value={form.customer_phone} onChange={handleChange} />
//                     <TextField label="Address" name="customer_address" variant="outlined" fullWidth multiline rows={2} required value={form.customer_address} onChange={handleChange} />
                    
//                     <TextField select label="Type of Item" name="type_of_item" variant="outlined" fullWidth required value={form.type_of_item} onChange={handleChange}>
//                         {itemOptions.map((item, idx) => <MenuItem key={idx} value={item}>{item}</MenuItem>)}
//                     </TextField>

//                     <Typography fontWeight={600} mt={2}>Select Delivery Location</Typography>
                    
//                     <Box sx={{ height: "350px", width: "100%", borderRadius: "12px", overflow: "hidden", border: position ? "2px solid green" : "1px solid #ccc" }}>
//                         <MapContainer
//                             center={[34.435, 35.836]} // طرابلس
//                             zoom={13}
//                             style={{ height: "100%", width: "100%" }}
//                         >
//                             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                            
//                             <MapClickHandler setPosition={setPosition} setForm={setForm} />
                            
//                             <SearchControl setPosition={setPosition} setForm={setForm} />
//                             <LocationSelector position={position} setPosition={setPosition} />
//                         </MapContainer>
//                     </Box>

//                     <Button
//                         variant="outlined"
//                         onClick={async () => {
//                             navigator.geolocation.getCurrentPosition(
//                             async (pos) => {
//                                 const lat = pos.coords.latitude;
//                                 const lng = pos.coords.longitude;

//                                 setPosition({ lat, lng });

//                                 // 🟢 Reverse Geocoding
//                                 const res = await fetch(
//                                 `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
//                                 );
//                                 const data = await res.json();

//                                 setForm(prev => ({
//                                 ...prev,
//                                 customer_address: data.display_name || "Current location"
//                                 }));
//                             },
//                             () => alert("GPS permission denied")
//                             );
//                         }}
//                         >
//                         📍 Use My Current Location
//                     </Button>
                  


//                     <Typography variant="caption" align="center" color={position ? "success.main" : "error"}>
//                         {position 
//                             ? `Location Selected: ${position.lat.toFixed(4)}, ${position.lng.toFixed(4)}` 
//                             : "❌ No location selected. Please click on the map."}
//                     </Typography>

//                     <Button variant="contained" color="primary" type="submit" sx={{ paddingY: 1.4, borderRadius: 2, fontSize: "1rem" }}>
//                          {isSubmitting ? "Submitting..." : "Submit"}
//                     </Button>
//                 </Box>
//             </Paper>

//             <Modal open={open} onClose={() => setOpen(false)}>
//                 <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", padding: 4, maxWidth: 400, textAlign: "center", borderRadius: 2 }}>
//                     <Typography variant="h6" mb={2}>Order Submitted!</Typography>
//                     <Typography variant="h5" mb={3} sx={{ fontWeight: "bold" }}>{orderNumber}</Typography>
//                     <Button variant="contained" onClick={() => navigate("/TrackingForm", { state: { orderNumber } })}>Track Order</Button>
//                     <Button variant="outlined" color="secondary" sx={{ ml: 1 }} onClick={() => setOpen(false)}>Close</Button>
//                 </Paper>
//             </Modal>
//           </motion.div>

//         )}
        
       
//         </>
//     );
// }



