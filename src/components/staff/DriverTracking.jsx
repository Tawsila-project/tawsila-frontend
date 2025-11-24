import { useEffect, useState, useRef } from "react";
import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Divider,
  Modal,
} from "@mui/material";
import { io } from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import api from "../api";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import WifiIcon from "@mui/icons-material/Wifi";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import { DirectionsCar } from "@mui/icons-material";

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
  const [newOrder, setNewOrder] = useState(null);
  const [isOrderAccepted, setIsOrderAccepted] = useState(false);
  const [currentOrderId, setCurrentOrderId] = useState(orderNumber);

  const watchIdRef = useRef(null);
  const socketRef = useRef(null);

  if (!driverId) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <CircularProgress size={28} />
        <Typography mt={2} fontWeight={500} color="textSecondary">
          Loading driver profile...
        </Typography>
        <Typography mt={1} color="error" fontWeight={600}>
          (Driver ID is missing)
        </Typography>
      </Box>
    );
  }

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
      if (!isOrderAccepted) setNewOrder(orderData);
    };

    socket.on("new-order", handleNewOrder);

    socket.on("disconnect", () => {
      setSocketConnected(false);
      setStatusMsg("Disconnected… Reconnecting");
    });

    return () => {
      socket.off("new-order", handleNewOrder);
      socket.disconnect();
    };
  }, [driverId, isOrderAccepted]);

  const handleAcceptOrder = async () => {
    if (!newOrder) return;

    try {
      setStatusMsg(`Accepting order #${newOrder.order_number}...`);
      await api.post("/orders/accept", {
        order_number: newOrder.order_number,
        driver_id: driverId,
      });

      setCurrentOrderId(newOrder.order_number);
      setIsOrderAccepted(true);
      setNewOrder(null);
      setStatusMsg(`Order #${currentOrderId} accepted! Start tracking.`);
    } catch (error) {
      console.error("Error accepting order:", error);
      setStatusMsg("Failed to accept order. Try again.");
      alert(error.response?.data?.error || "Acceptance failed!");
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      alert("Your device does not support GPS.");
      return;
    }
    if (!isOrderAccepted && !orderNumber) {
      alert("Please accept an order first or ensure an order ID is provided.");
      return;
    }

    setIsTracking(true);
    setStatusMsg("Sending live location…");

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setCurrentPos([latitude, longitude]);

        if (socketRef.current?.connected && currentOrderId) {
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

  const stopTracking = () => {
    navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null;
    setIsTracking(false);
    setStatusMsg("Tracking stopped.");

    if (socketRef.current?.connected && currentOrderId) {
      socketRef.current.emit("update-location", {
        orderId: currentOrderId,
        driverId,
        lat: null,
        lng: null,
      });
    }
  };

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
          maxWidth: 600, // smaller container
          p: { xs: 2, sm: 3 },
          borderRadius: 4,
          background: "#ffffff",
          boxShadow: "0 12px 24px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
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

        {/* Status */}
        <Paper
          elevation={0}
          sx={{
            display: "flex",
            alignItems: "center",
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
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <WifiIcon fontSize="small" color={socketConnected ? "success" : "error"} />
            {socketConnected ? "Connected" : "Offline"}
          </Typography>
          <Typography variant="body2">{statusMsg}</Typography>
        </Paper>

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
          <Typography><strong>Order ID:</strong> {currentOrderId || "Awaiting New..."}</Typography>
          <Typography><strong>Driver ID:</strong> {driverId}</Typography>
          <Typography sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <GpsFixedIcon fontSize="small" color="primary" /> <strong>Status:</strong> {statusMsg}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* Map */}
        <Box
          sx={{
            height: { xs: 150, sm: 180, md: 200 }, // smaller map
            width: "100%",
            borderRadius: 3,
            overflow: "hidden",
            mb: 2,
            border: "1px solid #ddd",
            mx: "auto",
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
                Waiting for GPS…
              </Typography>
            </Box>
          )}
        </Box>

        {/* Buttons */}
        <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={1.5}>
          {!isTracking ? (
            <Button
              variant="contained"
              fullWidth
              color="success"
              onClick={startTracking}
              size="large"
              disabled={!isOrderAccepted && !orderNumber}
              sx={{
                py: 1.6,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Start Delivery
            </Button>
          ) : (
            <Button
              variant="contained"
              fullWidth
              color="error"
              onClick={stopTracking}
              size="large"
              sx={{
                py: 1.6,
                fontSize: { xs: "0.9rem", sm: "1rem" },
                borderRadius: 3,
                fontWeight: 600,
              }}
            >
              Stop Delivery
            </Button>
          )}
        </Box>
      </Paper>

      {/* New Order Modal */}
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
            <Box
              textAlign="left"
              mb={2}
              sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2 }}
            >
              <Typography variant="body2"><strong>Order ID:</strong> {newOrder.order_number}</Typography>
              <Typography variant="body2"><strong>Item Type:</strong> {newOrder.type_of_item}</Typography>
              <Typography variant="body2" sx={{ wordWrap: "break-word" }}>
                <strong>Address:</strong> {newOrder.customer_address}
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


//   if (!driverId) {
//         return (
//             <Box sx={{ p: 4, textAlign: 'center' }}>
//                 <CircularProgress />
//                 <Typography mt={2}>Loading driver profile...</Typography>
//                 <Typography color="error">
//                     (Error in console: Driver ID is missing)
//                 </Typography>
//             </Box>
//         );
//     }

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
//       console.log("🔔 New Order Received:", orderData);
//       if (!isOrderAccepted) {
//         setNewOrder(orderData);
//       }
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


// const handleAcceptOrder = async () => {
// if (!newOrder) return;

// try {
// setStatusMsg(`Accepting order #${newOrder.order_number}...`);

// await api.post("/orders/accept", {
// order_number: newOrder.order_number,
// driver_id: driverId,
// });

// setCurrentOrderId(newOrder.order_number);
// setIsOrderAccepted(true);

// const acceptedOrderNumber = newOrder.order_number;
// setNewOrder(null);

// setStatusMsg(`Order #${acceptedOrderNumber} accepted! Start tracking.`);
// } catch (error) {
// console.error("Error accepting order:", error);
// setStatusMsg("Failed to accept order. Try again.");
// alert(error.response?.data?.error || "Acceptance failed!");
// }
// };

 
 



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

//         if (socketRef.current?.connected) {
//           // const currentOrderId = orderNumber || newOrder?.order_number;

//           if (currentOrderId) {
//             socketRef.current.emit("update-location", {
//               orderId: currentOrderId,
//               driverId,
//               lat: latitude,
//               lng: longitude,
//             });
//           }
//         }
//       },
//       (err) => {
//         setStatusMsg("GPS Error: " + err.message);
//       },
//       {
//         enableHighAccuracy: true,
//         maximumAge: 0,
//         timeout: 8000,
//       }
//     );
//   };

//   const stopTracking = () => {
// navigator.geolocation.clearWatch(watchIdRef.current);
// watchIdRef.current = null;

// setIsTracking(false);
// setStatusMsg("Tracking stopped.");

// if (socketRef.current?.connected) {
// const currentOrderId = orderNumber || newOrder?.order_number;

// if (currentOrderId) {
// socketRef.current.emit("update-location", {
// orderId: currentOrderId,
// driverId,
// lat: null,
// lng: null,
// });
// }
// }
// };



//   return (
//     <Box
//       sx={{
//         width: "100%",
//         display: "flex",
//         justifyContent: "center",
//         mt: 4,
//         px: { xs: 1, sm: 2 },
//       }}
//     >
//       <Paper
//         elevation={6}
//         sx={{
//           width: "100%",
//           maxWidth: "900px",
//           p: 3,
//           borderRadius: 4,
//           background: "#ffffff",
//           boxShadow: "0 8px 20px rgba(0,0,0,0.07)",
//         }}
//       >
//         <Typography fontWeight={700} variant="h4" textAlign="center" mb={2}>
//           🚗 Live Driver Tracking
//         </Typography>

//         <Paper
//           elevation={0}
//           sx={{
//             p: 2,
//             mb: 2,
//             borderRadius: 3,
//             background: socketConnected ? "#e3fce5" : "#ffe7e7",
//             border: socketConnected ? "1px solid #52c15a" : "1px solid #d9534f",
//           }}
//         >
//           <Typography variant="body1" fontWeight={600}>
//             Server Status:{" "}
//             <span style={{ color: socketConnected ? "#2e7d32" : "#c62828" }}>
//               {socketConnected ? "Connected 🟢" : "Offline 🔴"}
//             </span>
//           </Typography>
//         </Paper>

//         <Box
//           sx={{
//             p: 2,
//             mb: 2,
//             borderRadius: 3,
//             background: "#f7f9fc",
//             border: "1px solid #e0e6ed",
//           }}
//         >
//           <Typography>
//             <strong>Order ID:</strong>{" "}
//             {currentOrderId || "Awaiting New..."}
//           </Typography>
//           <Typography>
//             <strong>Driver ID:</strong> {driverId}
//           </Typography>
//           <Typography>
//             <strong>Status:</strong> {statusMsg}
//           </Typography>
//         </Box>

//         <Divider sx={{ my: 3 }} />

//         <Box
//           sx={{
//             height: 400,
//             borderRadius: 3,
//             overflow: "hidden",
//             mb: 3,
//             border: "1px solid #ddd",
//           }}
//         >
//           {currentPos ? (
//             <MapContainer
//               center={currentPos}
//               zoom={16}
//               style={{ height: "100%", width: "100%" }}
//             >
//               <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
//               <Marker position={currentPos} icon={driverIcon}>
//                 <Popup>You</Popup>
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
//               }}
//             >
//               <CircularProgress />
//               <Typography ml={2}>Waiting for GPS…</Typography>
//             </Box>
//           )}
//         </Box>

//         <Box sx={{ mt: 3, pt: 3, borderTop: "1px dashed #ccc" }}>
//           {/* <Typography
//             variant="body2"
//             color="textSecondary"
//             align="center"
//             mb={1}
//           >
//             🛠 Debugging Tools (Use if GPS fails)
//           </Typography> */}


//           {/* <Button
//             variant="contained"
//             color="warning"
//             fullWidth
//             onClick={() => {
//             if (!socketRef.current || !socketRef.current.connected) {
//             alert("Socket disconnected! Wait for connection.");
//             return;
//             }

//             const debugOrderId = currentOrderId || "DEBUG_001";

//             const beirutLat = 33.888;
//             const beirutLng = 35.495;

//             console.log("🧪 FORCE SENDING BEIRUT LOCATION for Order:", debugOrderId);

//             setCurrentPos([beirutLat, beirutLng]);

//             socketRef.current.emit("update-location", {
//             orderId: debugOrderId,
//             driverId: driverId,
//             lat: beirutLat,
//             lng: beirutLng,
//             });
//             }}
//             >
//             🧪 FORCE JUMP TO BEIRUT
//             </Button> */}

//         </Box>

//         <Box display="flex" gap={2} mt={3}>
//           {!isTracking ? (
//             <Button
//               variant="contained"
//               fullWidth
//               color="success"
//               onClick={startTracking}
//               size="large"
//               disabled={!isOrderAccepted && !orderNumber}
//               sx={{
//                 py: 1.8,
//                 fontSize: "1.1rem",
//                 borderRadius: 3,
//               }}
//             >
//               Start Delivery 🚀
//             </Button>
//           ) : (
//             <Button
//               variant="contained"
//               fullWidth
//               color="error"
//               onClick={stopTracking}
//               size="large"
//               sx={{
//                 py: 1.8,
//                 fontSize: "1.1rem",
//                 borderRadius: 3,
//               }}
//             >
//               Stop Delivery 🛑
//             </Button>
//           )}
//         </Box>
//       </Paper>

//       <Modal open={!!newOrder} onClose={() => setNewOrder(null)}>
//         <Paper
//           sx={{
//             position: "absolute",
//             top: "50%",
//             left: "50%",
//             transform: "translate(-50%, -50%)",
//             padding: 4,
//             maxWidth: 450,
//             textAlign: "center",
//             borderRadius: 3,
//             boxShadow: 24,
//           }}
//         >
//           <Typography variant="h5" fontWeight={700} color="primary" mb={2}>
//             🔔 NEW DELIVERY REQUEST!
//           </Typography>

//           {newOrder && (
//             <Box
//               textAlign="left"
//               mb={3}
//               sx={{ bgcolor: "#f5f5f5", p: 2, borderRadius: 2 }}
//             >
//               <Typography variant="body1">
//                 <strong>Order ID:</strong> {newOrder.order_number}
//               </Typography>
//               <Typography variant="body1">
//                 <strong>Item Type:</strong> {newOrder.type_of_item}
//               </Typography>
//               <Typography variant="body1" sx={{ wordWrap: "break-word" }}>
//                 <strong>Address:</strong> {newOrder.customer_address}
//               </Typography>
//             </Box>
//           )}

//           <Button
//             variant="contained"
//             color="success"
//             fullWidth
//             onClick={handleAcceptOrder}
//             size="large"
//             sx={{ py: 1.5, fontSize: "1.1rem" }}
//           >
//             Accept Order (GO)
//           </Button>

//           <Button
//             variant="outlined"
//             color="error"
//             fullWidth
//             onClick={() => setNewOrder(null)}
//             sx={{ mt: 1 }}
//           >
//             Decline
//           </Button>
//         </Paper>
//       </Modal>
//     </Box>
//   );
// }
