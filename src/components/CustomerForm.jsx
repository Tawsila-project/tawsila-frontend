import { useState, useEffect, useMemo, useRef } from "react";
import { KalmanFilter } from "./KalmanFilter";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Box, TextField, MenuItem, Button, Paper, Typography, Modal } from "@mui/material";
import { MapContainer, TileLayer, Marker, useMap, Popup, useMapEvents } from "react-leaflet"; 
// import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch"; 
import { OpenStreetMapProvider } from "leaflet-geosearch";
import * as GeoSearch from "leaflet-geosearch";


import L from "leaflet";
import api from "./api"; 
import Logo from "../assets/Logo.png"; 
import Welcome from "../components/WelcomeCustomer";
import { Snackbar, Alert } from "@mui/material";
import  AIcustomerChatBot from "./AdminAIChatbot/aicustomerChatBot"



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





// --- Helper: Snap to nearest road/building using OSM Overpass API ---



const snapToNearestRoad = async (lat, lng) => {
        try {
            const query = `[out:json];(way(around:50,${lat},${lng})["highway"];);out center 1;`;
            const url = `https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`;
            const response = await fetch(url);
            
            if (!response.ok) throw new Error("Network response was not ok");
            
            const data = await response.json();
            
            // CRITICAL FIX: Ensure elements exist before accessing them
            if (data && data.elements && data.elements.length > 0 && data.elements[0].center) {
                return {
                    lat: data.elements[0].center.lat,
                    lng: data.elements[0].center.lon
                };
            }
            return { lat, lng }; // Fallback to original coords
        } catch (error) {
            console.error("Snap to road failed, using raw GPS:", error);
            return { lat, lng }; // Fallback to prevent crash
        }
    };


function MapClickHandler({ setPosition, setForm }) {
  const map = useMap();

  useMapEvents({
    click: async (e) => {
      const coords = e.latlng.wrap();

      // --- Snap to road ---
      const snapped = await snapToNearestRoad(coords.lat, coords.lng);

      setPosition(snapped);

      const address = await getAddress(snapped.lat, snapped.lng);
      setForm(prev => ({ ...prev, customer_address: address }));

      map.flyTo(snapped, 17);
    }
  });

  return null;
}


// --- Search Control ---

function SearchControl({ setPosition, setForm }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return; // ✅ prevents crash on first render

    const provider = new OpenStreetMapProvider();

    const searchControl = new GeoSearch.GeoSearchControl({
      provider,
      style: "bar",
      showMarker: false,
      autoClose: true,
      retainZoomLevel: false,
      animateZoom: true,
      searchLabel: "Enter full street or neighborhood name...",
      keepResult: true,
    });

    map.addControl(searchControl);

    const onShowLocation = async (result) => {
      if (!result || !result.location) return;

      const { x, y } = result.location;

      // ✅ HARD PROTECTION (prevents black screen forever)
      if (typeof x !== "number" || typeof y !== "number") return;

      const coords = { lat: y, lng: x };
      setPosition(coords);

      const address = await getAddress(coords.lat, coords.lng);
      setForm(prev => ({ ...prev, customer_address: address }));

      map.flyTo(coords, 17);
    };

    map.on("geosearch/showlocation", onShowLocation);

    return () => {
      map.off("geosearch/showlocation", onShowLocation);
      map.removeControl(searchControl);
    };
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

    // Snap to road عند سحب العلامة
    const snapped = await snapToNearestRoad(coords.lat, coords.lng);
    setPosition(snapped);

    const address = await getAddress(snapped.lat, snapped.lng);
    setForm(prev => ({ ...prev, customer_address: address }));
  }
}), [setPosition, setForm]);


    // if (!position) return null;
    if (
    !position ||
    typeof position.lat !== "number" ||
    typeof position.lng !== "number"
    ) {
    return null;
    }


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
    if (
        position &&
        typeof position.lat === "number" &&
        typeof position.lng === "number"
    ) {
        map.flyTo(position, 17);
    }
    }, [position, map]);

    return null;
}

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
    const [notification, setNotification] = useState({
    open: false,
    severity: "info", 
    message: ""
});

    const showNotification = (message, severity = "info") => {
    setNotification(prev => ({
        ...prev,
        open: false
    }));

    setTimeout(() => {
        setNotification({
            open: true,
            message,
            severity
        });
    }, 150);
};


    const itemOptions = ["Electronics", "Clothes", "Food Delivery", "Documents", "Furniture", "Other"];
    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const latFilter = new KalmanFilter(0.0001, 0.01);
    const lngFilter = new KalmanFilter(0.0001, 0.01);

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
            showNotification("✅ Order submitted successfully!", "success");

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
                                const filteredLat = latFilter.filter(pos.coords.latitude);
                                const filteredLng = lngFilter.filter(pos.coords.longitude);
                                const coords = { lat: filteredLat, lng: filteredLng };
                                setPosition(coords);
                                const address = await getAddress(coords.lat, coords.lng);
                                setForm(prev => ({ ...prev, customer_address: address }));

                                 // Check GPS accuracy
                                    if (pos.coords.accuracy > 200) {
                                    showNotification(
                                        `⚠️ Very low GPS accuracy (±${Math.round(pos.coords.accuracy)}m). Move outside.`,
                                        "warning"
                                    );
                                   } else if (pos.coords.accuracy > 50) {
                                    showNotification(
                                        `ℹ️ GPS accuracy is moderate (±${Math.round(pos.coords.accuracy)}m). You may adjust the marker.`,
                                        "info"
                                    );
                                }
                                else {
                                            showNotification("📍 Location detected accurately", "success");
                                        }
                                  }, () => showNotification("GPS permission denied"), { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 });
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

        <Snackbar
            open={notification.open}
            autoHideDuration={5000}
            onClose={() => setNotification(prev => ({ ...prev, open: false }))}
            anchorOrigin={{ vertical: "top", horizontal: "center" }}
        >
            <Alert
                severity={notification.severity}
                onClose={() => setNotification(prev => ({ ...prev, open: false }))}
                sx={{ width: "100%" }}
                variant="filled"
            >
                {notification.message}
            </Alert>
        </Snackbar>

        <AIcustomerChatBot /> 
        </>
    );
}


