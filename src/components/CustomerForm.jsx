import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Box, TextField, MenuItem, Button, Paper, Typography, Modal } from "@mui/material";
import { MapContainer, TileLayer, Marker, useMap, Popup, LayerGroup } from "react-leaflet";
import { OpenStreetMapProvider, GeoSearchControl } from "leaflet-geosearch";
import L from "leaflet";
import api from "./api";

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
        ...form,
        tracked_location: { lat: position.lat, lng: position.lng },
      });

      const id = res.data.order.order_number;
      setOrderNumber(id);
      setOpen(true);

      setForm({ customer_name: "", customer_phone: "", customer_address: "", type_of_item: "" });
      setPosition(null);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || "Failed to submit order");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <Paper elevation={6} sx={{ padding: 3, maxWidth: 600, margin: "20px auto", borderRadius: 3 }}>
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
            center={[34.4367, 35.8497]} zoom={15}
            style={{ height: "350px", marginBottom: "16px", borderRadius: "12px" }}
            maxBounds={[
              [34.42, 35.81], // SW
              [34.46, 35.88], // NE
            ]}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
            <POILayer />
            <SearchControl setPosition={setPosition} setForm={setForm} />
            <LocationSelector position={position} setPosition={setPosition} />
          </MapContainer>

          <Button variant="contained" color="primary" type="submit" sx={{ paddingY: 1.4, borderRadius: 2, fontSize: "1rem" }}>
            Submit
          </Button>
        </Box>
      </Paper>

      {/* <Modal open={open} onClose={() => setOpen(false)}>
        <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", padding: 4, maxWidth: 400, textAlign: "center" }}>
          <Typography variant="h6" mb={2}>Order Submitted!</Typography>
          <Typography variant="body1" mb={2}>Your order number is:</Typography>
          <Typography variant="h5" mb={3} sx={{ fontWeight: "bold" }}>{orderNumber}</Typography>
          <Button variant="contained" onClick={() => setOpen(false)}>Close</Button>
        </Paper>
      </Modal> */}

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



// import { useState } from "react";
// import { Paper, Box, Typography, TextField, Button, MenuItem, Modal } from "@mui/material";
// import { MapContainer, TileLayer, Marker } from "react-leaflet";
// import "leaflet/dist/leaflet.css";
// // React-Leaflet-Geosearch imports
// import { GeoSearchControl, OpenStreetMapProvider } from 'leaflet-geosearch';
// import { useMap } from 'react-leaflet';
// import { useEffect } from 'react';

// // Leaflet marker fix
// delete L.Icon.Default.prototype._getIconUrl;
// L.Icon.Default.mergeOptions({
//   iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//   iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//   shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });



// // Component to add search control to the map
// // function SearchControl({ setPosition }) {
// //   const map = useMap();

// //   useEffect(() => {
// //     const provider = new OpenStreetMapProvider();

// //     const searchControl = new GeoSearchControl({
// //       provider,
// //       style: 'bar',
// //       showMarker: true,
// //       retainZoomLevel: false,
// //       animateZoom: true,
// //       autoClose: true,
// //       searchLabel: 'Enter city or place...',
// //       keepResult: true
// //     });

// //     map.addControl(searchControl);

// //     // Listen for location selection
// //     map.on('geosearch/showlocation', (result) => {
// //       const { x, y } = result.location;
// //       setPosition({ lat: y, lng: x });
// //     });

// //     return () => map.removeControl(searchControl);
// //   }, [map, setPosition]);

// //   return null;
// // }

// function SearchControl({ setPosition }) {
//   const map = useMap();

//   useEffect(() => {
//     const provider = new OpenStreetMapProvider({
//       params: {
//         countrycodes: 'LB',    
//       }
//     });

//     const searchControl = new GeoSearchControl({
//       provider,
//       style: 'bar',
//       showMarker: true,
//       retainZoomLevel: false,
//       animateZoom: true,
//       autoClose: true,
//       searchLabel: 'Enter city or place...',
//       keepResult: true,
//     });

//     map.addControl(searchControl);

//     map.on('geosearch/showlocation', (result) => {
//       const { x, y } = result.location;
//       setPosition({ lat: y, lng: x });
//     });

//     return () => map.removeControl(searchControl);
//   }, [map, setPosition]);

//   return null;
// }

// export default function CustomerForm() {
//   const [form, setForm] = useState({
//     customer_name: "",
//     customer_phone: "",
//     customer_address: "",
//     type_of_item: "",
//   });
//   const [position, setPosition] = useState(null);
//   const [mapOpen, setMapOpen] = useState(false);

//   const itemOptions = ["Electronics", "Clothes", "Food Delivery", "Documents", "Furniture", "Other"];

//   const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     if (!position) return alert("Please select your delivery location!");
//     console.log({ ...form, tracked_location: position });
//     alert("Order submitted! Check console for coordinates.");
//   };

//   return (
//     <Paper sx={{ maxWidth: 450, margin: "20px auto", padding: 3, borderRadius: 3 }}>
//       <Typography variant="h5" textAlign="center" fontWeight={600} mb={3}>
//         Customer Delivery Request
//       </Typography>

//       <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
//         <TextField label="Full Name" name="customer_name" variant="outlined" fullWidth required value={form.customer_name} onChange={handleChange} />
//         <TextField label="Phone Number" name="customer_phone" variant="outlined" fullWidth required value={form.customer_phone} onChange={handleChange} />
//         <TextField label="Address" name="customer_address" variant="outlined" fullWidth multiline rows={2} required value={form.customer_address} onChange={handleChange} />
//         <TextField select label="Type of Item" name="type_of_item" variant="outlined" fullWidth required value={form.type_of_item} onChange={handleChange}>
//           {itemOptions.map((item, idx) => <MenuItem key={idx} value={item}>{item}</MenuItem>)}
//         </TextField>

//         <Button variant="outlined" onClick={() => setMapOpen(true)}>
//           {position ? "Change Delivery Location" : "Select Delivery Location"}
//         </Button>

//         {position && (
//           <Typography variant="body2" mt={1}>
//             Selected Location: Lat {position.lat.toFixed(5)}, Lng {position.lng.toFixed(5)}
//           </Typography>
//         )}

//         <Button variant="contained" type="submit">Submit Order</Button>
//       </Box>

//       {/* Modal for map + search */}
//       <Modal open={mapOpen} onClose={() => setMapOpen(false)}>
//         <Paper sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", width: 450, height: 450, padding: 2 }}>
//           <Typography variant="h6" textAlign="center" mb={1}>Search for your delivery location</Typography>
//           <MapContainer center={[33.888, 35.495]} zoom={6} style={{ width: "100%", height: "350px" }}>
//             <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
//             <SearchControl setPosition={setPosition} />
//             {position && <Marker position={[position.lat, position.lng]} />}
//           </MapContainer>
//           <Button variant="contained" sx={{ mt: 2 }} onClick={() => setMapOpen(false)}>Confirm Location</Button>
//         </Paper>
//       </Modal>
//     </Paper>
//   );
// }






// import { useState } from "react";
// import { motion } from "framer-motion";
// import {
//   Box,
//   TextField,
//   Button,
//   MenuItem,
//   Paper,
//   Typography,
// } from "@mui/material";

// export default function CustomerForm() {
//   const [form, setForm] = useState({
//     name: "",
//     phone: "",
//     address: "",
//     itemType: "",
//   });

//   const itemOptions = [
//     "Electronics",
//     "Clothes",
//     "Food Delivery",
//     "Documents",
//     "Furniture",
//     "Other",
//   ];

//   const handleChange = (e) =>
//     setForm({ ...form, [e.target.name]: e.target.value });

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     console.log(form);
//     alert("Form submitted!");
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4 }}
//     >
//       <Paper
//         elevation={6}
//         sx={{
//           padding: 3,
//           maxWidth: 450,
//           margin: "20px auto",
//           borderRadius: 3,
//         }}
//       >
//         <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>
//           Customer Information
//         </Typography>

//         <Box
//           component="form"
//           onSubmit={handleSubmit}
//           sx={{
//             display: "flex",
//             flexDirection: "column",
//             gap: 2.5,
//           }}
//         >
//           <TextField
//             label="Full Name"
//             name="name"
//             variant="outlined"
//             fullWidth
//             required
//             value={form.name}
//             onChange={handleChange}
//           />

//           <TextField
//             label="Phone Number"
//             name="phone"
//             type="tel"
//             variant="outlined"
//             fullWidth
//             required
//             value={form.phone}
//             onChange={handleChange}
//           />

//           <TextField
//             label="Address"
//             name="address"
//             variant="outlined"
//             fullWidth
//             multiline
//             rows={2}
//             required
//             value={form.address}
//             onChange={handleChange}
//           />

//           <TextField
//             select
//             label="Type of Item"
//             name="itemType"
//             variant="outlined"
//             fullWidth
//             required
//             value={form.itemType}
//             onChange={handleChange}
//           >
//             {itemOptions.map((item, index) => (
//               <MenuItem key={index} value={item}>
//                 {item}
//               </MenuItem>
//             ))}
//           </TextField>

//           <Button
//             variant="contained"
//             color="primary"
//             type="submit"
//             sx={{ paddingY: 1.4, borderRadius: 2, fontSize: "1rem" }}
//           >
//             Submit
//           </Button>
//         </Box>
//       </Paper>
//     </motion.div>
//   );
// }
