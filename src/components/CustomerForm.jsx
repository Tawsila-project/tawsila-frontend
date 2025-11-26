import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Box, TextField, MenuItem, Button, Paper, Typography, Modal } from "@mui/material";
import { MapContainer, TileLayer, Marker, useMap, Popup, LayerGroup } from "react-leaflet";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import L from "leaflet";
import api from "./api";
import Logo from "../assets/Logo.png";

// Fix default Leaflet marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// Search control component
function SearchControl({ setPosition, setForm }) {
    const map = useMap();

    useEffect(() => {
        const provider = new OpenStreetMapProvider({
            params: {
                countrycodes: "LB",
                limit: 5,
                addressdetails: 1,
            },
        });

        const searchControl = new GeoSearchControl({
            provider,
            style: "bar",
            showMarker: false,
            retainZoomLevel: false,
            animateZoom: true,
            autoClose: true,
            searchLabel: "Enter street or area in Tripoli...",
            keepResult: true,
        });

        map.addControl(searchControl);

        map.on("geosearch/showlocation", (result) => {
            const { x, y, label } = result.location;
            setPosition({ lat: y, lng: x });
            setForm((prev) => ({ ...prev, customer_address: label }));
        });

        return () => map.removeControl(searchControl);
    }, [map, setPosition, setForm]);

    return null;
}

// Draggable marker component
function LocationSelector({ position, setPosition }) {
    const map = useMap();

    useEffect(() => {
        if (!position) return;

        const marker = L.marker(position, { draggable: true }).addTo(map);
        marker.bindPopup("Drag to exact location").openPopup();

        marker.on("dragend", (e) => {
            const newPos = e.target.getLatLng();
            setPosition(newPos);
        });

        return () => {
            marker.remove();
        };
    }, [map, position, setPosition]);

    return null;
}

// Optional: Layer for POIs (buildings, landmarks)
function POILayer() {
    const map = useMap();
    useEffect(() => {
        const poiLayer = L.tileLayer(
            "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
            { attribution: '&copy; OpenStreetMap contributors' }
        );
        poiLayer.addTo(map);
        return () => map.removeLayer(poiLayer);
    }, [map]);
    return null;
}

export default function CustomerForm() {
    const navigate = useNavigate();
    const [form, setForm] = useState({
        customer_name: "",
        customer_phone: "",
        customer_address: "",
        type_of_item: "",
    });
    const [position, setPosition] = useState(null);
    const [orderNumber, setOrderNumber] = useState("");
    const [open, setOpen] = useState(false);

    const itemOptions = ["Electronics", "Clothes", "Food Delivery", "Documents", "Furniture", "Other"];

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });


    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!position) {
            alert("Please select your delivery location on the map!");
            return;
        }

        try {
            const res = await api.post("public/order/submit", {
                customer: {
                    name: form.customer_name,
                    phone: form.customer_phone,
                    address: form.customer_address,
                    coords: {
                        lat: position.lat,
                        lng: position.lng,
                    },
                },
                type_of_item: form.type_of_item,
            });

            const id = res.data.order.order_number;
            setOrderNumber(id);
            setOpen(true);

        } catch (err) {
            console.error("❌ Customer Form Submission Error:", err.response?.data?.error || err.message, err);
            alert(err.response?.data?.error || "Failed to submit order. Check Server Console.");
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <Paper elevation={6} sx={{ padding: 3, maxWidth: 600, margin: "20px auto", borderRadius: 3 }}>

                <img
                src={Logo}
                alt="Company Logo"
                style={{ width: 90, height: "90", display: "flex" , marginLeft: "auto", marginRight: "auto", marginBottom: 8}}
            />
                <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>Customer Delivery Request</Typography>

                <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
                    <TextField label="Full Name" name="customer_name" variant="outlined" fullWidth required value={form.customer_name} onChange={handleChange} />
                    <TextField label="Phone Number" name="customer_phone" type="tel" variant="outlined" fullWidth required value={form.customer_phone} onChange={handleChange} />
                    <TextField label="Address" name="customer_address" variant="outlined" fullWidth multiline rows={2} required value={form.customer_address} onChange={handleChange} />
                    <TextField select label="Type of Item" name="type_of_item" variant="outlined" fullWidth required value={form.type_of_item} onChange={handleChange}>
                        {itemOptions.map((item, idx) => <MenuItem key={idx} value={item}>{item}</MenuItem>)}
                    </TextField>

                    <Typography fontWeight={600} mt={2}>Select Delivery Location</Typography>
                    <MapContainer
                        center={[33.888, 35.495]} zoom={10}
                        style={{ height: "350px", marginBottom: "16px", borderRadius: "12px" }}
                    >
                        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
                        <POILayer />
                        <SearchControl setPosition={setPosition} setForm={setForm} />
                        <LocationSelector position={position} setPosition={setPosition} />
                    </MapContainer>

                    <Button variant="contained"  color="primary" type="submit" sx={{ paddingY: 1.4, borderRadius: 2, fontSize: "1rem" }}>
                        Submit
                    </Button>
                </Box>
            </Paper>



            <Modal open={open} onClose={() => setOpen(false)}>
                <Paper
                    sx={{
                        position: "absolute",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                        padding: 4,
                        maxWidth: 400,
                        textAlign: "center",
                        borderRadius: 2,
                    }}
                >
                    <Typography variant="h6" mb={2}>
                        Order Submitted!
                    </Typography>
                    <Typography variant="body1" mb={2}>
                        Your order number is:
                    </Typography>
                    <Typography
                        variant="h5"
                        mb={3}
                        sx={{ fontWeight: "bold", wordBreak: "break-word" }}
                    >
                        {orderNumber}
                    </Typography>

                    {/* Button to go to tracking */}
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() =>
                            navigate("/TrackingForm", { state: { orderNumber } })
                        }
                        sx={{ mr: 1 }}
                    >
                        Track My Order
                    </Button>

                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => setOpen(false)}
                    >
                        Close
                    </Button>
                </Paper>
            </Modal>

        </motion.div>
    );
}
// import { useState, useEffect } from "react";
// import { motion } from "framer-motion";
// import { useNavigate } from "react-router-dom";
// import { Box, TextField, MenuItem, Button, Paper, Typography, Modal } from "@mui/material";
// import { MapContainer, TileLayer, Marker, useMap, Popup, LayerGroup } from "react-leaflet";
// import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
// import L from "leaflet";
// import api from "./api";

// // Fix default Leaflet marker icons
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

// // Search control component
// function SearchControl({ setPosition, setForm }) {
//   const map = useMap();

//   useEffect(() => {
//     const provider = new OpenStreetMapProvider({
//       params: {
//         countrycodes: "LB",
//         limit: 5,
//         addressdetails: 1,
//       },
//     });

//     const searchControl = new GeoSearchControl({
//       provider,
//       style: "bar",
//       showMarker: false,
//       retainZoomLevel: false,
//       animateZoom: true,
//       autoClose: true,
//       searchLabel: "Enter street or area in Tripoli...",
//       keepResult: true,
//     });

//     map.addControl(searchControl);

//     map.on("geosearch/showlocation", (result) => {
//       const { x, y, label } = result.location;
//       setPosition({ lat: y, lng: x });
//       setForm((prev) => ({ ...prev, customer_address: label }));
//     });

//     return () => map.removeControl(searchControl);
//   }, [map, setPosition, setForm]);

//   return null;
// }

// // Draggable marker component
// function LocationSelector({ position, setPosition }) {
//   const map = useMap();

//   useEffect(() => {
//     if (!position) return;

//     const marker = L.marker(position, { draggable: true }).addTo(map);
//     marker.bindPopup("Drag to exact location").openPopup();

//     marker.on("dragend", (e) => {
//       const newPos = e.target.getLatLng();
//       setPosition(newPos);
//     });

//     return () => {
//       marker.remove();
//     };
//   }, [map, position, setPosition]);

//   return null;
// }

// // Optional: Layer for POIs (buildings, landmarks)
// function POILayer() {
//   const map = useMap();
//   useEffect(() => {
//     const poiLayer = L.tileLayer(
//       "https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png",
//       { attribution: '&copy; OpenStreetMap contributors' }
//     );
//     poiLayer.addTo(map);
//     return () => map.removeLayer(poiLayer);
//   }, [map]);
//   return null;
// }

// export default function CustomerForm() {
//   const navigate = useNavigate();
//   const [form, setForm] = useState({
//     customer_name: "",
//     customer_phone: "",
//     customer_address: "",
//     type_of_item: "",
//   });
//   const [position, setPosition] = useState(null);
//   const [orderNumber, setOrderNumber] = useState("");
//   const [open, setOpen] = useState(false);

//   const itemOptions = ["Electronics", "Clothes", "Food Delivery", "Documents", "Furniture", "Other"];

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });


// const handleSubmit = async (e) => {
// e.preventDefault();
// if (!position) {
// alert("Please select your delivery location on the map!");
// return;
// }

// try {
// const res = await api.post("public/order/submit", {
// customer: {
// name: form.customer_name,
// phone: form.customer_phone,
// address: form.customer_address,
// coords: {
// lat: position.lat,
// lng: position.lng,
// },
// },
// type_of_item: form.type_of_item,
// // tracked_location: { lat: position.lat, lng: position.lng },
// });

// const id = res.data.order.order_number;
// setOrderNumber(id);
// setOpen(true);

// } catch (err) {
// console.error("❌ Customer Form Submission Error:", err.response?.data?.error || err.message, err);
// alert(err.response?.data?.error || "Failed to submit order. Check Server Console.");
// }
// };

 
  
//   // const handleSubmit = async (e) => {
//   //   e.preventDefault();
//   //   if (!position) {
//   //     alert("Please select your delivery location on the map!");
//   //     return;
//   //   }

//   //   try {
//   //     const res = await api.post("public/order/submit", {
//   //       ...form,
//   //       tracked_location: { lat: position.lat, lng: position.lng },
//   //     });

//   //     const id = res.data.order.order_number;
//   //     setOrderNumber(id);
//   //     setOpen(true);

//   //     setForm({ customer_name: "", customer_phone: "", customer_address: "", type_of_item: "" });
//   //     setPosition(null);
//   //   } catch (err) {
//   //     console.error(err);
//   //     alert(err.response?.data?.error || "Failed to submit order");
//   //   }
//   // };

//   return (
//     <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
//       <Paper elevation={6} sx={{ padding: 3, maxWidth: 600, margin: "20px auto", borderRadius: 3 }}>
//         <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>Customer Delivery Request</Typography>

//         <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2.5 }}>
//           <TextField label="Full Name" name="customer_name" variant="outlined" fullWidth required value={form.customer_name} onChange={handleChange} />
//           <TextField label="Phone Number" name="customer_phone" type="tel" variant="outlined" fullWidth required value={form.customer_phone} onChange={handleChange} />
//           <TextField label="Address" name="customer_address" variant="outlined" fullWidth multiline rows={2} required value={form.customer_address} onChange={handleChange} />
//           <TextField select label="Type of Item" name="type_of_item" variant="outlined" fullWidth required value={form.type_of_item} onChange={handleChange}>
//             {itemOptions.map((item, idx) => <MenuItem key={idx} value={item}>{item}</MenuItem>)}
//           </TextField>

//           <Typography fontWeight={600} mt={2}>Select Delivery Location</Typography>
//           <MapContainer
//             center={[33.888, 35.495]} zoom={10}
//             style={{ height: "350px", marginBottom: "16px", borderRadius: "12px" }}
//           >
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
//             <POILayer />
//             <SearchControl setPosition={setPosition} setForm={setForm} />
//             <LocationSelector position={position} setPosition={setPosition} />
//           </MapContainer>

//           <Button variant="contained" color="primary" type="submit" sx={{ paddingY: 1.4, borderRadius: 2, fontSize: "1rem" }}>
//             Submit
//           </Button>
//         </Box>
//       </Paper>



//       <Modal open={open} onClose={() => setOpen(false)}>
//   <Paper
//     sx={{
//       position: "absolute",
//       top: "50%",
//       left: "50%",
//       transform: "translate(-50%, -50%)",
//       padding: 4,
//       maxWidth: 400,
//       textAlign: "center",
//       borderRadius: 2,
//     }}
//   >
//     <Typography variant="h6" mb={2}>
//       Order Submitted!
//     </Typography>
//     <Typography variant="body1" mb={2}>
//       Your order number is:
//     </Typography>
//     <Typography
//       variant="h5"
//       mb={3}
//       sx={{ fontWeight: "bold", wordBreak: "break-word" }}
//     >
//       {orderNumber}
//     </Typography>

//     {/* Button to go to tracking */}
//     <Button
//       variant="contained"
//       color="primary"
//       onClick={() =>
//         navigate("/TrackingForm", { state: { orderNumber } })
//       }
//       sx={{ mr: 1 }}
//     >
//       Track My Order
//     </Button>

//     <Button
//       variant="outlined"
//       color="secondary"
//       onClick={() => setOpen(false)}
//     >
//       Close
//     </Button>
//   </Paper>
// </Modal>

//     </motion.div>
//   );
// }

