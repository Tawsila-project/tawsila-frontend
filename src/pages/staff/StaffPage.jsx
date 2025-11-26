import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Chip,
  CircularProgress,
  Snackbar,
  Alert,
  Modal,
  Stack,
} from "@mui/material";
import { Tooltip } from "@mui/material";
import api from "../../components/api";
import Logo from "../../assets/Logo.png";

export default function StaffPage() {
  const [staffList, setStaffList] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editingStaff, setEditingStaff] = useState(null);
  const [openCreate, setOpenCreate] = useState(false);

  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");
  const userId = localStorage.getItem("userId");

  console.log("Current User ID:", userId);


  // Fetch Staff
  const fetchStaff = async () => {
    try {
      setLoading(true);
      const res = await api.get("/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch staff");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  // Delete Staff
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this staff member?")) return;
    try {
      await api.delete(`/users/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccessMsg("Staff deleted successfully");
      setStaffList((prev) => prev.filter((s) => s._id !== id));
    } catch (err) {
      setError(err.response?.data?.error || "Failed to delete staff");
    }
  };

  // Toggle Availability

const handleToggleAvailability = async (staff) => {
  try {
    let url;
    let payload = { availability: !staff.availability };

    if (role === "staff" && staff._id === userId) {
      url = `/users/${staff._id}/availability`; // staff route
    } else if (role === "admin") {
      url = `/users/${staff._id}`; // admin route
    } else {
      setError("You cannot update this staff");
      return;
    }

    const res = await api.put(url, payload,{
      headers: { Authorization: `Bearer ${token}` },
    });

    setStaffList((prev) =>
      prev.map((s) =>
        s._id === staff._id ? { ...s, availability: res.data.availability } : s
      )
    );

    setSuccessMsg(
      `Availability updated to ${res.data.availability ? "Available" : "Offline"}`
    );

  } catch (err) {
    setError(err.response?.data?.error || "Failed to update availability");
  }
};


  // const handleToggleAvailability = async (staff) => {
  //   try {
  //     const res = await api.put(
  //       `/users/availability/${staff._id}`,
  //       { availability: !staff.availability },
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );
  //     setStaffList((prev) =>
  //       prev.map((s) => (s._id === staff._id ? { ...s, availability: res.data.availability } : s))
  //     );
  //     setSuccessMsg(`Availability updated to ${res.data.availability ? "Available" : "Offline"}`);

  //     if (res.data._id.toString() === userId) {
  //       localStorage.setItem("userId", res.data._id);
  //     }

  //   } catch (err) {
  //     setError(err.response?.data?.error || "Failed to update availability");
  //   }
  // };

  // Create Staff
  const handleCreateStaff = async (newStaff) => {
    try {
      const payload = { ...newStaff, role: "staff" }; // add role
      const res = await api.post("/users/register", payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList((prev) => [...prev, res.data]);
      setSuccessMsg("Staff created successfully");
      setOpenCreate(false);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to create staff");
    }
  };

  // Update Staff
  const handleUpdateStaff = async (updatedStaff) => {
    try {
      const res = await api.put(`/users/${updatedStaff._id}`, updatedStaff, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStaffList((prev) =>
        prev.map((s) => (s._id === res.data._id ? res.data : s))
      );
      setSuccessMsg("Staff updated successfully");
      setEditingStaff(null);

      // ✅ إذا تم تعديل المستخدم الحالي (logged-in staff) حدث localStorage
      if (res.data._id === userId) {
        localStorage.setItem("userId", res.data._id);
        localStorage.setItem("role", res.data.role); // إذا تغير الدور لأي سبب
      }
    } catch (err) {
      setError(err.response?.data?.error || "Failed to update staff");
    }
  };

  // Filtered Staff
  const filteredStaff = staffList
    .filter((staff) => staff.role === "staff")
    .filter(
      (staff) =>
        staff.full_name.toLowerCase().includes(search.toLowerCase()) ||
        staff.phone.includes(search) ||
        staff.address.toLowerCase().includes(search.toLowerCase())
    );

  // Staff Form
  const StaffForm = ({ initialData = {}, onSubmit, onClose }) => {
    const [formData, setFormData] = useState({
      _id: initialData._id || "",
      full_name: initialData.full_name || "",
      username: initialData.username || "",
      phone: initialData.phone || "",
      address: initialData.address || "",
      password: "",
    });

    const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
      e.preventDefault();
      if (initialData._id) {
        onSubmit({ ...formData, _id: initialData._id });
      } else {
        onSubmit(formData);
      }
    };

    return (
      <Box
        component="form"
        onSubmit={handleSubmit}
        p={3}
        sx={{
         width: { xs: "87%", sm: 400 },   // responsive width
          bgcolor: "background.paper",
          mx: "auto",
          mt: { xs: "10vh", sm: "10vh" },   // responsive top margin
          p: { xs: 2, sm: 3 },             // responsive padding
          borderRadius: 2,
          maxHeight: "90vh",
          overflowY: "auto",
        }}
      >
        <Typography variant="h6" mb={2}>
          {initialData._id ? "Edit Staff" : "Create New Staff"}
        </Typography>
        <Stack spacing={2} 
        
        
        >
          <TextField name="full_name" label="Full Name" value={formData.full_name} onChange={handleChange} fullWidth required />
          <TextField name="username" label="Username" value={formData.username} onChange={handleChange} fullWidth required />
          <TextField name="phone" label="Phone" value={formData.phone} onChange={handleChange} fullWidth required />
          <TextField name="address" label="Address" value={formData.address} onChange={handleChange} fullWidth required />
          {!initialData._id && (
            <TextField name="password" label="Password" value={formData.password} onChange={handleChange} type="password" fullWidth required />
          )}
          <Box display="flex" flexDirection={{ xs: "column", sm: "row" }}  justifyContent="space-between" gap={1}>
            <Button variant="contained" type="submit" fullWidth={true}>
              {initialData._id ? "Update" : "Create"}
            </Button>
            <Button variant="outlined" onClick={onClose} fullWidth={true}>
              Cancel
            </Button>
          </Box>
        </Stack>
      </Box>
    );
  };

  return (
    <Box  px={{ xs: 0, sm: 3 }}  // left/right padding 0 on mobile, 3 on sm+
  py={{ xs: 1, sm: 3 }}  // top/bottom padding smaller on mobile
  sx={{
    margin: 0,
    width: "100%",       // ensure it fills container
    maxWidth: "100%",    // prevent overflow
  }} >

    <img
        src={Logo}
        alt="Company Logo"
        style={{ width: 110, height: "110" , display: "flex", marginLeft: "auto", marginRight: "auto"}}
      />
      <Typography variant="h5" color="black" fontWeight="bold" mt={3} mb={3} display={"flex"} align="center" justifyContent={"center"}>
        Staff Members
      </Typography>


     {role === "admin" &&
      <Button variant="contained" 
      onClick={() => setOpenCreate(true)}  sx={{
      mb: 2,
      backgroundColor: "#2CA9E3",   // set your blue color
      color: "white",               // text color
      "&:hover": { backgroundColor: "#2790c7" }, // slightly darker on hover
    }}>
        Create New Staff
      </Button>
      }
       

      <TextField
        label="Search Staff"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" mt={5} >
          <CircularProgress />
        </Box>
      ) : (
        <Box sx={{ overflowX: "auto" }} p={0} >
          <TableContainer component={Paper}   sx={{ padding: "0", maxWidth: "100%" }} >
            <Table >
              <TableHead>
                <TableRow>
                  <TableCell>Name</TableCell>
                  <TableCell>Phone</TableCell>
                  <TableCell>Address</TableCell>
                  <TableCell>Availability</TableCell>
                  {role === "admin" && <TableCell>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStaff.map((staff) => (
                  <TableRow key={staff._id} >
                    <TableCell>{staff.full_name}</TableCell>
                    <TableCell>{staff.phone}</TableCell>
                    <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
                      <Tooltip title={staff.address} arrow>
                        <span>{staff.address}</span>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      {/* <Chip
                        label={staff.availability ? "Available" : "Offline"}
                        color={staff.availability ? "success" : "default"}
                        size="small"
                        onClick={() => role === "staff" && handleToggleAvailability(staff)}
                        sx={{ cursor: role === "staff" ? "pointer" : "default" }}
                      /> */}

                    
                      <Button
                        size="small"
                        variant={staff.availability ? "contained" : "outlined"}
                        color={staff.availability ? "success" : "secondary"}
                
                         onClick={() => {
                          if (role === "staff" && staff._id === userId) {
                            handleToggleAvailability(staff);
                          } else if (role === "admin") {
                            handleToggleAvailability(staff);
                          }
                        }}
                        
                        
                        sx={{
                          cursor: role === "admin" || (role === "staff" && staff._id === userId) ? "pointer" : "not-allowed",
                          minWidth: 90,
                        }}
                      >
                        {staff.availability ? "Available" : "Offline"}
                      </Button>
                  


                    </TableCell>
                    {role === "admin" && (
                      <TableCell>
                        <Button
                          size="small"
                          sx={{ mr: 1 }}
                          variant="outlined"
                          onClick={() => setEditingStaff(staff)}
                        >
                          Edit
                        </Button>
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          onClick={() => handleDelete(staff._id)}
                        >
                          Delete
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* Create Modal */}
      <Modal open={openCreate} onClose={() => setOpenCreate(false)}>
        <StaffForm onSubmit={handleCreateStaff} onClose={() => setOpenCreate(false)} />
      </Modal>

      {/* Edit Modal */}
      <Modal open={!!editingStaff} onClose={() => setEditingStaff(null)}>
        <StaffForm initialData={editingStaff} onSubmit={handleUpdateStaff} onClose={() => setEditingStaff(null)} />
      </Modal>

      {/* Snackbar Messages */}
      <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")}>
        <Alert severity="error" onClose={() => setError("")}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg("")}>
        <Alert severity="success" onClose={() => setSuccessMsg("")}>
          {successMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
}


// import { useState, useEffect } from "react";
// import {
//   Box,
//   Typography,
//   TextField,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Button,
//   Chip,
//   CircularProgress,
//   Snackbar,
//   Alert,
//   Modal,
//   Stack,
// } from "@mui/material";
// import { Tooltip } from "@mui/material";
// import api from "../../components/api";

// export default function StaffPage() {
//   const [staffList, setStaffList] = useState([]);
//   const [search, setSearch] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState("");
//   const [successMsg, setSuccessMsg] = useState("");
//   const [editingStaff, setEditingStaff] = useState(null);
//   const [openCreate, setOpenCreate] = useState(false);

//   const token = localStorage.getItem("token");
//   const role = localStorage.getItem("role");

//   // ------------------- Fetch Staff -------------------
//   const fetchStaff = async () => {
//     try {
//       setLoading(true);
//       const res = await api.get("/users", {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setStaffList(res.data);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to fetch staff");
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchStaff();
//   }, []);

//   // ------------------- Delete Staff -------------------
//   const handleDelete = async (id) => {
//     if (!window.confirm("Are you sure you want to delete this staff member?")) return;
//     try {
//       await api.delete(`/users/${id}`, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setSuccessMsg("Staff deleted successfully");
//       setStaffList((prev) => prev.filter((s) => s._id !== id));
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to delete staff");
//     }
//   };

//   // ------------------- Toggle Availability -------------------
//   const handleToggleAvailability = async (staff) => {
//     try {
//       const res = await api.put(
//         `/users/${staff._id}`,
//         { availability: !staff.availability },
//         { headers: { Authorization: `Bearer ${token}` } }
//       );
//       setStaffList((prev) =>
//         prev.map((s) => (s._id === staff._id ? { ...s, availability: res.data.availability } : s))
//       );
//       setSuccessMsg(`Availability updated to ${res.data.availability ? "Available" : "Offline"}`);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to update availability");
//     }
//   };

//   // ------------------- Create Staff -------------------
//   const handleCreateStaff = async (newStaff) => {
//     try {
//       const payload = { ...newStaff, role: "staff" }; // <-- add role
//       const res = await api.post("/users/register", payload, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setStaffList((prev) => [...prev, res.data]);
//       setSuccessMsg("Staff created successfully");
//       setOpenCreate(false);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to create staff");
//     }
//   };


//   // ------------------- Update Staff -------------------
//   const handleUpdateStaff = async (updatedStaff) => {
//     try {
//       const res = await api.put(`/users/${updatedStaff._id}`, updatedStaff, {
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setStaffList((prev) =>
//         prev.map((s) => (s._id === res.data._id ? res.data : s))
//       );
//       setSuccessMsg("Staff updated successfully");
//       setEditingStaff(null);
//     } catch (err) {
//       setError(err.response?.data?.error || "Failed to update staff");
//     }
//   };

//   // ------------------- Filtered Staff -------------------
//   const filteredStaff = staffList
//     .filter((staff) => staff.role === "staff")
//     .filter(
//       (staff) =>
//         staff.full_name.toLowerCase().includes(search.toLowerCase()) ||
//         staff.phone.includes(search) ||
//         staff.address.toLowerCase().includes(search.toLowerCase())
//     );

//   // ------------------- Staff Form Component -------------------
//   const StaffForm = ({ initialData = {}, onSubmit, onClose }) => {
//     const [formData, setFormData] = useState({
//        _id: initialData._id || "",  // <-- Add this
//       full_name: initialData.full_name || "",
//       username: initialData.username || "",
//       phone: initialData.phone || "",
//       address: initialData.address || "",
//       password: "",// only for create
//     });

//     const handleChange = (e) => {
//       const { name, value } = e.target;
//       setFormData((prev) => ({ ...prev, [name]: value }));
//     };

//     const handleSubmit = (e) => {
//       e.preventDefault();
//       if (initialData._id) {
//         onSubmit({ ...formData, _id: initialData._id }); // ensure _id is sent
//       } else {
//         onSubmit(formData);
//       }
//     };

//     return (
//       <Box component="form" onSubmit={handleSubmit} p={3} sx={{ width: 400, bgcolor: "background.paper", mx: "auto", mt: "10vh", borderRadius: 2 }}>
//         <Typography variant="h6" mb={2}>
//           {initialData._id ? "Edit Staff" : "Create New Staff"}
//         </Typography>
//         <Stack spacing={2}>
//           <TextField name="full_name" label="Full Name" value={formData.full_name} onChange={handleChange} fullWidth required />
//           <TextField name="username" label="Username" value={formData.username} onChange={handleChange} fullWidth required />
//           <TextField name="phone" label="Phone" value={formData.phone} onChange={handleChange} fullWidth required />
//           <TextField name="address" label="Address" value={formData.address} onChange={handleChange} fullWidth required />
//           {!initialData._id && (
//             <TextField name="password" label="Password" value={formData.password} onChange={handleChange} type="password" fullWidth required />
//           )}
//           <Box display="flex" justifyContent="space-between">
//             <Button variant="contained" type="submit">
//               {initialData._id ? "Update" : "Create"}
//             </Button>
//             <Button variant="outlined" onClick={onClose}>
//               Cancel
//             </Button>
//           </Box>
//         </Stack>
//       </Box>
//     );
//   };

  

//   return (
//     <Box p={{ xs: 2, sm: 7 }}>
//       <Typography variant="h5" fontWeight="bold" mb={3}>
//         Staff Members
//       </Typography>

//       <Button variant="contained" onClick={() => setOpenCreate(true)} sx={{ mb: 2 }}>
//         Create New Staff
//       </Button>

//       <TextField
//         label="Search Staff"
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//         fullWidth
//         sx={{ mb: 3 }}
//       />

//       {loading ? (
//         <Box display="flex" justifyContent="center" mt={5}>
//           <CircularProgress />
//         </Box>
//       ) : (
//         <TableContainer component={Paper}>
//           <Table>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Name</TableCell>
//                 <TableCell>Phone</TableCell>
//                 <TableCell>Address</TableCell>
//                 <TableCell>Availability</TableCell>
//                 {role === "admin" && <TableCell>Actions</TableCell>}
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredStaff.map((staff) => (
//                 <TableRow key={staff._id}>
//                   <TableCell>{staff.full_name}</TableCell>
//                   <TableCell>{staff.phone}</TableCell>
//                   <TableCell sx={{ whiteSpace: "normal", wordBreak: "break-word" }}>
//                     <Tooltip title={staff.address} arrow>
//                       <span>{staff.address}</span>
//                     </Tooltip>
//                   </TableCell>
//                   <TableCell>
//                     <Chip
//                       label={staff.availability ? "Available" : "Offline"}
//                       color={staff.availability ? "success" : "default"}
//                       size="small"
//                       onClick={() => role === "staff" && handleToggleAvailability(staff)}
//                       sx={{ cursor: role === "staff" ? "pointer" : "default" }}
//                     />
//                   </TableCell>
//                   {role === "admin" && (
//                     <TableCell>
//                       <Button
//                         size="small"
//                         sx={{ mr: 1 }}
//                         variant="outlined"
//                         onClick={() => setEditingStaff(staff)}
//                       >
//                         Edit
//                       </Button>
//                       <Button
//                         size="small"
//                         variant="outlined"
//                         color="error"
//                         onClick={() => handleDelete(staff._id)}
//                       >
//                         Delete
//                       </Button>
//                     </TableCell>
//                   )}
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       )}

//       {/* Create Modal */}
//       <Modal open={openCreate} onClose={() => setOpenCreate(false)}>
//         <StaffForm
//           onSubmit={handleCreateStaff}
//           onClose={() => setOpenCreate(false)}
//         />
//       </Modal>

//       {/* Edit Modal */}
//       <Modal open={!!editingStaff} onClose={() => setEditingStaff(null)}>
//         <StaffForm
//           initialData={editingStaff}
//           onSubmit={handleUpdateStaff}
//           onClose={() => setEditingStaff(null)}
//         />
//       </Modal>

//       {/* Snackbar Messages */}
//       <Snackbar open={!!error} autoHideDuration={4000} onClose={() => setError("")}>
//         <Alert severity="error" onClose={() => setError("")}>
//           {error}
//         </Alert>
//       </Snackbar>

//       <Snackbar open={!!successMsg} autoHideDuration={4000} onClose={() => setSuccessMsg("")}>
//         <Alert severity="success" onClose={() => setSuccessMsg("")}>
//           {successMsg}
//         </Alert>
//       </Snackbar>
//     </Box>
//   );
// }
