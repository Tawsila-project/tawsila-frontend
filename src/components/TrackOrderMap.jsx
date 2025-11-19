import { useState } from "react";
import { motion } from "framer-motion";
import { Box, Paper, TextField, Button, Typography } from "@mui/material";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon issue in Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function TrackOrderMap() {
  const [orderId, setOrderId] = useState("");
  const [tracking, setTracking] = useState(null);

  // Dummy data for orders (simulate API)
  const orders = {
    "#4353": { lat: 51.505, lng: -0.09, customer: "Samir" },
    "#5266": { lat: 51.515, lng: -0.1, customer: "Tarek" },
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    if (orders[orderId]) {
      setTracking(orders[orderId]);
    } else {
      alert("Order not found!");
      setTracking(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 600,
          margin: "40px auto",
          padding: 3,
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>
          Track Your Order
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{ display: "flex", gap: 2, flexDirection: { xs: "column", sm: "row" } }}
        >
          <TextField
            label="Enter Order ID"
            variant="outlined"
            fullWidth
            required
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <Button
            type="submit"
            variant="contained"
            sx={{ paddingY: 1.4, fontSize: "1rem", borderRadius: 2 }}
          >
            Track Order
          </Button>
        </Box>

        {tracking && (
          <Box mt={4} sx={{ height: 400, width: "100%" }}>
            <MapContainer
              center={[tracking.lat, tracking.lng]}
              zoom={13}
              scrollWheelZoom={false}
              style={{ height: "100%", width: "100%", borderRadius: "12px" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[tracking.lat, tracking.lng]}>
                <Popup>
                  Order {orderId} - Customer: {tracking.customer}
                </Popup>
              </Marker>
            </MapContainer>
          </Box>
        )}
      </Paper>
    </motion.div>
  );
}
