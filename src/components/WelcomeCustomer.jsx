// src/components/WelcomeCustomer.jsx
import { useState } from "react";
import { Box, Paper, Typography, TextField, MenuItem, Button } from "@mui/material";
import { motion } from "framer-motion";

export default function WelcomeCustomer() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    itemType: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = () => {
    console.log("Request Delivery:", form);
    alert("Your delivery request has been submitted!");
    setForm({
      fullName: "",
      phone: "",
      address: "",
      itemType: "",
    });
  };

  const itemOptions = [
    { label: "Food", value: "food" },
    { label: "Documents", value: "documents" },
    { label: "Electronics", value: "electronics" },
    { label: "Others", value: "others" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f3f4f6",
          padding: 2,
        }}
      >
        <Paper
          elevation={6}
          sx={{
            width: "100%",
            maxWidth: 450,
            padding: 4,
            borderRadius: 3,
            textAlign: "center",
          }}
        >
          <Typography variant="h5" fontWeight="bold" mb={3}>
            Welcome! Request Your Delivery
          </Typography>

          <TextField
            fullWidth
            label="Full Name"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Phone"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            label="Address"
            name="address"
            value={form.address}
            onChange={handleChange}
            margin="normal"
          />

          <TextField
            fullWidth
            select
            label="Type of Item"
            name="itemType"
            value={form.itemType}
            onChange={handleChange}
            margin="normal"
          >
            {itemOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            sx={{
              mt: 3,
              bgcolor: "#0ABE51",
              "&:hover": { bgcolor: "#079b3a" },
              width: "100%",
              py: 1.5,
              fontSize: "1rem",
              borderRadius: 2,
            }}
            onClick={handleSubmit}
            disabled={
              !form.fullName || !form.phone || !form.address || !form.itemType
            }
          >
            Request Delivery
          </Button>
        </Paper>
      </Box>
    </motion.div>
  );
}
