import { useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Button,
  Rating,
  Snackbar, // New Import
  Alert,    // New Import
  CircularProgress, // New Import
} from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import api from "../components/api"; // Ensure this path is correct

export default function RateDelivery() {
  const navigate = useNavigate();
  const location = useLocation();

  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("orderId");

  const [value, setValue] = useState(0);
  const [loading, setLoading] = useState(false); // New State
  const [error, setError] = useState("");      // New State
  const [successMsg, setSuccessMsg] = useState(""); // New State

  const handleSubmit = async () => {
    if (value === 0 || !orderId) {
      setError("Please select a rating and ensure the order ID is present.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      setSuccessMsg("");

      // --- API CALL INTEGRATION ---
      const response = await api.patch(`/orders/${orderId}/rate`, { 
        rating: value 
      });
      // --- END API CALL ---

      console.log(`Rating submitted successfully:`, response.data);
      setSuccessMsg(`Thank you for rating ${value} stars for Order #${orderId}!`);
      
      // Navigate after a slight delay to allow the success Snackbar to show
      setTimeout(() => {
        navigate("/"); 
      }, 1500);

    } catch (err) {
      console.error("Rating submission error:", err);
      setError(
        err.response?.data?.error || "Failed to submit rating. Please try again."
      );
      setLoading(false); // Stop loading on failure
    } finally {
      // We don't stop loading here because navigation happens in the timeout on success
      if (error) {
          setLoading(false);
      }
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
          maxWidth: 400,
          margin: "40px auto",
          padding: 4,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600} mb={1}>
          Rate Your Delivery 🚚
        </Typography>

        {orderId ? (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Order **#{orderId}**
          </Typography>
        ) : (
          <Typography color="error" mb={2}>
            Error: Order ID missing.
          </Typography>
        )}

        <Rating
          name="delivery-rating"
          value={value}
          onChange={(event, newValue) => setValue(newValue)}
          size="large"
          disabled={loading} // Disable rating while submitting
        />

        <Box mt={3}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#0ABE51",
              "&:hover": { backgroundColor: "#079b3a" },
              py: 1.5,
              fontSize: "1rem",
              borderRadius: 2,
              width: "100%",
            }}
            onClick={handleSubmit}
            disabled={value === 0 || loading || !orderId}
            startIcon={loading && <CircularProgress size={20} color="inherit" />}
          >
            {loading ? "Submitting..." : "Submit Rating"}
          </Button>
        </Box>
      </Paper>

      {/* Snackbar Messages */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")}>
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!successMsg} autoHideDuration={1500} onClose={() => setSuccessMsg("")}>
        <Alert severity="success" onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      </Snackbar>
    </motion.div>
  );
}


