import { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";
import AuthLayout from "../layouts/AuthLayout";
import api from "../components/api";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name: "",
    username: "",
    phone: "",
    address: "",
    password: "",
    role: "customer"
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async () => {
    try {
      await api.post("users/register", form);
      alert("Registered successfully!");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.error || "Registration failed");
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
        Register
      </Typography>

      <TextField fullWidth label="Full Name" name="full_name" margin="normal" onChange={handleChange} />
      <TextField fullWidth label="Username" name="username" margin="normal" onChange={handleChange} />
      <TextField fullWidth label="Phone" name="phone" margin="normal" onChange={handleChange} />
      <TextField fullWidth label="Address" name="address" margin="normal" onChange={handleChange} />
      <TextField fullWidth label="Password" type="password" name="password" margin="normal" onChange={handleChange} />

      <Button
        fullWidth
        variant="contained"
        sx={{ mt: 3, bgcolor: "#2CA9E3" }}
        onClick={handleRegister}
      >
        Register
      </Button>
    </AuthLayout>
  );
}


// import { useState } from "react";
// import { Box, TextField, Button, Typography } from "@mui/material";
// import AuthLayout from "../layouts/AuthLayout";

// export default function Register() {
//   const [form, setForm] = useState({
//     fullName: "",
//     username: "",
//     phone: "",
//     address: "",
//     password: "",
//   });

//   const handleChange = (e) => {
//     setForm({ ...form, [e.target.name]: e.target.value });
//   };

//   return (
//     <AuthLayout>
//       <Typography variant="h5" fontWeight="bold" textAlign="center" mb={3}>
//         Register
//       </Typography>

//       <TextField
//         fullWidth
//         label="Full Name"
//         name="fullName"
//         margin="normal"
//         onChange={handleChange}
//       />

//       <TextField
//         fullWidth
//         label="Username"
//         name="username"
//         margin="normal"
//         onChange={handleChange}
//       />

//       <TextField
//         fullWidth
//         label="Phone"
//         name="phone"
//         margin="normal"
//         onChange={handleChange}
//       />

//       <TextField
//         fullWidth
//         label="Address"
//         name="address"
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
//           bgcolor: "#2CA9E3",
//           py: 1.4,
//           fontSize: "1rem",
//           "&:hover": { bgcolor: "#1C8DC2" },
//         }}
//       >
//         Register
//       </Button>

//       <Box textAlign="center" mt={2}>
//         <Typography fontSize=".9rem">
//           Already have an account?{" "}
//           <a href="/login" style={{ color: "#0ABE51" }}>
//             Login
//           </a>
//         </Typography>
//       </Box>
//     </AuthLayout>
//   );
// }
