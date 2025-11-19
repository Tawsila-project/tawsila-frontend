import { useState } from "react";
import { motion } from "framer-motion";
import {
  Box,
  TextField,
  Button,
  MenuItem,
  Paper,
  Typography,
} from "@mui/material";

export default function CustomerForm() {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    itemType: "",
  });

  const itemOptions = [
    "Electronics",
    "Clothes",
    "Food Delivery",
    "Documents",
    "Furniture",
    "Other",
  ];

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
    alert("Form submitted!");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={6}
        sx={{
          padding: 3,
          maxWidth: 450,
          margin: "20px auto",
          borderRadius: 3,
        }}
      >
        <Typography variant="h5" fontWeight={600} textAlign="center" mb={3}>
          Customer Information
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
            label="Full Name"
            name="name"
            variant="outlined"
            fullWidth
            required
            value={form.name}
            onChange={handleChange}
          />

          <TextField
            label="Phone Number"
            name="phone"
            type="tel"
            variant="outlined"
            fullWidth
            required
            value={form.phone}
            onChange={handleChange}
          />

          <TextField
            label="Address"
            name="address"
            variant="outlined"
            fullWidth
            multiline
            rows={2}
            required
            value={form.address}
            onChange={handleChange}
          />

          <TextField
            select
            label="Type of Item"
            name="itemType"
            variant="outlined"
            fullWidth
            required
            value={form.itemType}
            onChange={handleChange}
          >
            {itemOptions.map((item, index) => (
              <MenuItem key={index} value={item}>
                {item}
              </MenuItem>
            ))}
          </TextField>

          <Button
            variant="contained"
            color="primary"
            type="submit"
            sx={{ paddingY: 1.4, borderRadius: 2, fontSize: "1rem" }}
          >
            Submit
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}
