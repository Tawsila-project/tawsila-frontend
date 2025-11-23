// src/components/tracking/DriverTracking.jsx

import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Divider,
} from "@mui/material";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Driver Icon
const driverIcon = new L.Icon({
  iconUrl: "https://cdn-icons-png.flaticon.com/512/3097/3097136.png",
  iconSize: [50, 50],
  iconAnchor: [25, 25],
  popupAnchor: [0, -20],
});

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

export default function DriverTracking({ orderNumber, driverId }) {
  const [isTracking, setIsTracking] = useState(false);
  const [currentPos, setCurrentPos] = useState(null);
  const [statusMsg, setStatusMsg] = useState("Ready…");
  const [socketConnected, setSocketConnected] = useState(false);

  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  // Socket connection
  useEffect(() => {
    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setStatusMsg("Connected ✔ Ready to track");
      socket.emit("driver-join", driverId);
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      setStatusMsg("Disconnected… Reconnecting");
    });

    return () => socket.disconnect();
  }, [driverId]);

  // Start tracking
  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Your device does not support GPS.");
      return;
    }

    setIsTracking(true);
    setStatusMsg("Sending live location…");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;

        setCurrentPos([latitude, longitude]);

        if (socketRef.current?.connected) {
          socketRef.current.emit("update-location", {
            orderId: orderNumber,
            driverId,
            lat: latitude,
            lng: longitude,
          });
        }
      },
      (err) => {
        setStatusMsg("GPS Error: " + err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 8000,
      }
    );
  };

  // Stop Tracking
  const stopTracking = () => {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;

    setIsTracking(false);
    setStatusMsg("Tracking stopped.");
  };

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        mt: 4,
        px: { xs: 1, sm: 2 },
      }}
    >
      <Paper
        elevation={6}
        sx={{
          width: "100%",
          maxWidth: "900px",
          p: 3,
          borderRadius: 4,
          background: "#ffffff",
          boxShadow: "0 8px 20px rgba(0,0,0,0.07)",
        }}
      >
        <Typography fontWeight={700} variant="h4" textAlign="center" mb={2}>
          🚗 Live Driver Tracking
        </Typography>

        {/* Status Block */}
        <Paper
          elevation={0}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            background: socketConnected ? "#e3fce5" : "#ffe7e7",
            border: socketConnected ? "1px solid #52c15a" : "1px solid #d9534f",
          }}
        >
          <Typography variant="body1" fontWeight={600}>
            Server Status:{" "}
            <span style={{ color: socketConnected ? "#2e7d32" : "#c62828" }}>
              {socketConnected ? "Connected 🟢" : "Offline 🔴"}
            </span>
          </Typography>
        </Paper>

        <Box
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 3,
            background: "#f7f9fc",
            border: "1px solid #e0e6ed",
          }}
        >
          <Typography>
            <strong>Order ID:</strong> {orderNumber}
          </Typography>
          <Typography>
            <strong>Driver ID:</strong> {driverId}
          </Typography>
          <Typography>
            <strong>Status:</strong> {statusMsg}
          </Typography>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* MAP */}
        <Box
          sx={{
            height: 400,
            borderRadius: 3,
            overflow: "hidden",
            mb: 3,
            border: "1px solid #ddd",
          }}
        >
          {currentPos ? (
            <MapContainer
              center={currentPos}
              zoom={16}
              style={{ height: "100%", width: "100%" }}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={currentPos} icon={driverIcon}>
                <Popup>You</Popup>
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
              }}
            >
              <CircularProgress />
              <Typography ml={2}>Waiting for GPS…</Typography>
            </Box>
          )}
        </Box>

        {/* BUTTONS */}
        <Box display="flex" gap={2}>
          {!isTracking ? (
            <Button
              variant="contained"
              fullWidth
              color="success"
              onClick={startTracking}
              size="large"
              sx={{
                py: 1.8,
                fontSize: "1.1rem",
                borderRadius: 3,
              }}
            >
              Start Delivery 🚀
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              color="error"
              onClick={stopTracking}
              size="large"
              sx={{
                py: 1.8,
                fontSize: "1.1rem",
                borderRadius: 3,
              }}
            >
              Stop Delivery 🛑
            </Button>
          )}
        </Box>
      </Paper>
    </Box>
  );
}




