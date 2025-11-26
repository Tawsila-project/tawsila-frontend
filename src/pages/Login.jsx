import { useState } from "react";
import { Box, TextField, Button, Typography, CircularProgress, Backdrop } from "@mui/material";
import AuthLayout from "../layouts/AuthLayout";
import api from "../components/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };


  console.log(import.meta.env.VITE_API_URL);

  const handleLogin = async () => {
    try {
      setLoading(true); // start loading

      const res = await api.post("/users/login", form);

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      localStorage.setItem("userId", res.data.user._id);
      localStorage.setItem("driverId", res.data.user._id);

      console.log("Login successful. Role:", res.data.user.role);

      if (res.data.user.role === "admin") {
        navigate("/admin/driverLogs");
      } else if (res.data.user.role === "staff") {
        navigate("/staff/dashboard/orders");
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err);
      alert(err.response?.data?.error || "Login failed. Check server connection.");
    } finally {
      setLoading(false); // stop loading
    }
  };

  return (
    <>
      {/* Loading Overlay */}
      <Backdrop
        open={loading}
        sx={{
          zIndex: 2000,
          color: "#fff",
          backdropFilter: "blur(4px)"
        }}
      >
        <CircularProgress size={70} thickness={5} />
      </Backdrop>

      <AuthLayout>
        <Typography
          variant="h5"
          fontWeight="bold"
          textAlign="center"
          mb={3}
          color="#0ABE51"
        >
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
          sx={{
            mt: 3,
            bgcolor: "#0ABE51",
            py: 1.5,
            fontSize: "1.1rem",
            opacity: loading ? 0.7 : 1,
          }}
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Logging in..." : "Login"}
        </Button>
      </AuthLayout>
    </>
  );
}


// import { useState } from "react";
// import { Box, TextField, Button, Typography } from "@mui/material";
// import AuthLayout from "../layouts/AuthLayout";
// import api from "../components/api";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
// const navigate = useNavigate();
// const [form, setForm] = useState({ username: "", password: "" });

// const handleChange = (e) => {
// setForm({ ...form, [e.target.name]: e.target.value });
// };

// const handleLogin = async () => {
//   try {
//     const res = await api.post("/users/login", form);

//     localStorage.setItem("token", res.data.token);
//     localStorage.setItem("role", res.data.user.role);
//     localStorage.setItem("userId", res.data.user._id);
//     localStorage.setItem("driverId", res.data.user._id)

//     console.log("Login successful. Role:", res.data.user.role);

//     if (res.data.user.role === "admin") {
//       navigate("/admin/driverLogs");
//     } else if (res.data.user.role === "staff") {
//       navigate("/staff/dashboard/orders");
//     } else {
//       navigate("/");
//     }
//   } catch (err) {
//     console.error("Login error:", err);
//     alert(err.response?.data?.error || "Login failed. Check server connection.");
//   }
// };


// return (
// <AuthLayout>
//     <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3} color="#0ABE51">
//     Login
//     </Typography>

//   <TextField
//       fullWidth
//       label="Username"
//       name="username"
//       margin="normal"
//       onChange={handleChange}
//   />

//     <TextField
//       fullWidth
//       label="Password"
//       type="password"
//       name="password"
//       margin="normal"
//       onChange={handleChange}
//     />

//     <Button
//         fullWidth
//         variant="contained"
//         sx={{ mt: 3, bgcolor: "#0ABE51", py: 1.5, fontSize: "1.1rem" }}
//         onClick={handleLogin}
//         >
//         Login
//     </Button>
//     </AuthLayout>
//     );
//     }



