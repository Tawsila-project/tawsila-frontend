import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import AuthLayout from "../layouts/AuthLayout";

export default function Register() {
  const [form, setForm] = useState({
    fullName: "",
    username: "",
    phone: "",
    address: "",
    password: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <AuthLayout>
      <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
        Register
      </Typography>

      <TextField
        fullWidth
        label="Full Name"
        name="fullName"
        margin="normal"
        onChange={handleChange}
      />

      <TextField
        fullWidth
        label="Username"
        name="username"
        margin="normal"
        onChange={handleChange}
      />

      <TextField
        fullWidth
        label="Phone"
        name="phone"
        margin="normal"
        onChange={handleChange}
      />

      <TextField
        fullWidth
        label="Address"
        name="address"
        margin="normal"
        onChange={handleChange}
      />

      <TextField
        fullWidth
        label="Password"
        type="password"
        name="password"
        margin="normal"
        onChange={handleChange}
      />

      <Button
        fullWidth
        variant="contained"
        size="large"
        sx={{
          mt: 3,
          bgcolor: "#2CA9E3",
          py: 1.4,
          fontSize: "1rem",
          "&:hover": { bgcolor: "#1C8DC2" },
        }}
      >
        Register
      </Button>

      <Box textAlign="center" mt={2}>
        <Typography fontSize=".9rem">
          Already have an account?{" "}
          <a href="/login" style={{ color: "#0ABE51" }}>
            Login
          </a>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
