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
const res = await api.post("/users/login", form);

localStorage.setItem("token", res.data.token);
localStorage.setItem("role", res.data.user.role);
localStorage.setItem("driverId", res.data.user._id)
console.log("Login successful. Role:", res.data.user.role);

// if (res.data.user.role === "admin" || res.data.user.role === "staff") {
// navigate("/staff/dashboard/orders");
// }
// else {
// navigate("/");
// }

if (res.data.user.role === "admin") {
  navigate("/admin/logistics-stats");
} else if (res.data.user.role === "staff") {
  navigate("/staff/dashboard/orders");
} else {
  navigate("/");
}


} catch (err) {
console.error("Login error:", err);
alert(err.response?.data?.error || "Login failed. Check server connection.");
}
};

return (
<AuthLayout>
<Typography variant="h5" fontWeight="bold" textAlign="center" mb={3} color="#0ABE51">
🔑 Staff Login
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
sx={{ mt: 3, bgcolor: "#0ABE51", py: 1.5, fontSize: "1.1rem" }}
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
// import api from "../components/api";
// import { useNavigate } from "react-router-dom";

// export default function Login() {
//   const navigate = useNavigate();
//   const [form, setForm] = useState({ username: "", password: "" });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   const handleLogin = async () => {
//     try {
//       const res = await api.post("users/login", form);


//       // Store token + role
//       localStorage.setItem("token", res.data.token);
//       localStorage.setItem("role", res.data.user.role);
//       console.log(res.data.user.role);

//       // Redirection based on role
//       if (res.data.user.role === "admin") {
//         navigate("/DashboardLayout");
//       } 
//       else {
//         navigate("/staff/dashboard");
//       }
   

//     } catch (err) {
//       alert(err.response?.data?.error || "Login failed");
//     }
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
//         sx={{ mt: 3, bgcolor: "#0ABE51" }}
//         onClick={handleLogin}
//       >
//         Login
//       </Button>
//     </AuthLayout>
//   );
// }


