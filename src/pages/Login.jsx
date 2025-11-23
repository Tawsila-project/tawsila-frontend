import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import AuthLayout from "../layouts/AuthLayout";
import api from "../components/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", password: "" });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async () => {
    try {
      const res = await api.post("users/login", form);


      // Store token + role
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.user.role);
      console.log(res.data.user.role);

      // Redirection based on role
      if (res.data.user.role === "admin") {
        navigate("/DashboardLayout");
      } 
      else {
        navigate("/staff/dashboard");
      }
   

    } catch (err) {
      alert(err.response?.data?.error || "Login failed");
    }
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
        sx={{ mt: 3, bgcolor: "#0ABE51" }}
        onClick={handleLogin}
      >
        Login
      </Button>
    </AuthLayout>
  );
}



// import { useState } from "react";
// import { Box, TextField, Button, Typography } from "@mui/material";
// import AuthLayout from "../layouts/AuthLayout";

// export default function Login() {
//   const [form, setForm] = useState({ username: "", password: "" });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   return (
//     <AuthLayout>
//       <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
//         Login
//       </Typography>

//       <TextField
//         fullWidth
//         label="Username"
//         name="username"
//         margin="normal"
//         onChange={handleChange}
//       />

//       <TextField
//         fullWidth
//         label="Password"
//         type="password"
//         name="password"
//         margin="normal"
//         onChange={handleChange}
//       />

//       <Button
//         fullWidth
//         variant="contained"
//         size="large"
//         sx={{
//           mt: 3,
//           bgcolor: "#0ABE51",
//           py: 1.4,
//           fontSize: "1rem",
//           "&:hover": { bgcolor: "#099D44" },
//         }}
//       >
//         Login
//       </Button>

//       <Box textAlign="center" mt={2}>
//         <Typography fontSize=".9rem">
//           Don’t have an account?{" "}
//           <a href="/register" style={{ color: "#2CA9E3" }}>
//             Register
//           </a>
//         </Typography>
//       </Box>
//     </AuthLayout>
//   );
// }
