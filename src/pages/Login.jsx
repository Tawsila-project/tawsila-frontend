import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import AuthLayout from "../layouts/AuthLayout";

export default function Login() {
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  return (
    <AuthLayout>
      <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
        Login
      </Typography>

      <TextField
        fullWidth
        label="Username"
        name="username"
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
          bgcolor: "#0ABE51",
          py: 1.4,
          fontSize: "1rem",
          "&:hover": { bgcolor: "#099D44" },
        }}
      >
        Login
      </Button>

      <Box textAlign="center" mt={2}>
        <Typography fontSize=".9rem">
          Don’t have an account?{" "}
          <a href="/register" style={{ color: "#2CA9E3" }}>
            Register
          </a>
        </Typography>
      </Box>
    </AuthLayout>
  );
}
