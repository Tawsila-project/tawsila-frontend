import { useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
} from "@mui/material";

export default function TrackingForm() {
  const [orderId, setOrderId] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!orderId.trim()) return;

    console.log("Tracking Order:", orderId);
    alert("Tracking order: " + orderId);
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
          maxWidth: 420,
          margin: "40px auto",
          padding: 3,
          borderRadius: 3,
        }}
      >
        <Typography
          variant="h5"
          fontWeight={600}
          textAlign="center"
          mb={3}
        >
          Track Your Order
        </Typography>

        <Box
          component="form"
          onSubmit={handleSubmit}
          sx={{
            display: "flex",
            flexDirection: "column",
            gap: 2.5,
          }}
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
            sx={{
              paddingY: 1.4,
              fontSize: "1rem",
              borderRadius: 2,
            }}
          >
            Track Order
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}
