import { useEffect, useState } from "react";
import api from "../components/api";
import {
  Box, Table, TableBody, TableCell, TableHead, TableRow, Paper,
  IconButton, Button, TextField, Dialog, DialogTitle, DialogContent,
  DialogActions, Typography
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [search, setSearch] = useState("");
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    phone: "",
    address: "",
    username: "",
    role: "staff",
    password: "",
  });
  const [editId, setEditId] = useState(null);

  // Fetch staff on load
  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    const res = await api.get("/users");
    const filtered = res.data.filter((u) => u.role === "staff");
    setStaff(filtered);
  };

  const handleSave = async () => {
    if (editId) {
      await api.put(`/users/${editId}`, formData);
    } else {
      await api.post("/users", formData);
    }

    loadStaff();
    setOpenDialog(false);
  };

  const handleDelete = async (id) => {
    await api.delete(`/users/${id}`);
    loadStaff();
  };

  const handleOpenDialog = (user = null) => {
    if (user) {
      setFormData(user);
      setEditId(user._id);
    } else {
      setFormData({
        full_name: "",
        phone: "",
        address: "",
        username: "",
        role: "staff",
        password: "",
      });
      setEditId(null);
    }
    setOpenDialog(true);
  };

  const filteredStaff = staff.filter((s) =>
    JSON.stringify(s).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h5" fontWeight={600}>Staff Management</Typography>
        <Box display="flex" gap={2}>
          <TextField label="Search" size="small" onChange={(e) => setSearch(e.target.value)} />
          <Button variant="contained" onClick={() => handleOpenDialog()}>
            Add Staff
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#2CA9E3" }}>
              <TableCell sx={{ color: "white" }}>Name</TableCell>
              <TableCell sx={{ color: "white" }}>Phone</TableCell>
              <TableCell sx={{ color: "white" }}>Address</TableCell>
              <TableCell sx={{ color: "white" }}>Username</TableCell>
              <TableCell align="right" sx={{ color: "white" }}>Actions</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredStaff.map((s) => (
              <TableRow key={s._id}>
                <TableCell>{s.full_name}</TableCell>
                <TableCell>{s.phone}</TableCell>
                <TableCell>{s.address}</TableCell>
                <TableCell>{s.username}</TableCell>
                <TableCell align="right">
                  <IconButton onClick={() => handleOpenDialog(s)}><Edit /></IconButton>
                  <IconButton onClick={() => handleDelete(s._id)}><Delete /></IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Modal */}
      <Dialog open={openDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editId ? "Edit Staff" : "Add Staff"}</DialogTitle>
        <DialogContent>
          <TextField label="Full Name" fullWidth margin="normal"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />
          <TextField label="Phone" fullWidth margin="normal"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
          <TextField label="Address" fullWidth margin="normal"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
          <TextField label="Username" fullWidth margin="normal"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
          />
          {!editId && (
            <TextField label="Password" fullWidth margin="normal"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>
            {editId ? "Update" : "Add"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}


// import { useState } from "react";
// import {
//   Box,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   IconButton,
//   Button,
//   TextField,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Typography,
// } from "@mui/material";
// import { Edit, Delete } from "@mui/icons-material";

// export default function StaffPage() {
//   const [staff, setStaff] = useState([
//     { id: 1, name: "Ahmed", phone: "94343", address: "Tripoli, mina", username: "ahmed232" },
//     { id: 2, name: "Samir", phone: "12345", address: "Abu samra", username: "samir79" },
//   ]);
//   const [search, setSearch] = useState("");
//   const [openDialog, setOpenDialog] = useState(false);
//   const [formData, setFormData] = useState({ name: "", phone: "", address: "", username: "" });
//   const [editId, setEditId] = useState(null);

//   // Colors
//   const primaryColor = "#0ABE51";
//   const secondaryColor = "#2CA9E3";

//   // Handle add/edit dialog
//   const handleOpenDialog = (staffItem = null) => {
//     if (staffItem) {
//       setFormData(staffItem);
//       setEditId(staffItem.id);
//     } else {
//       setFormData({ name: "", phone: "", address: "", username: "" });
//       setEditId(null);
//     }
//     setOpenDialog(true);
//   };

//   const handleCloseDialog = () => setOpenDialog(false);

//   const handleSave = () => {
//     if (editId) {
//       setStaff((prev) =>
//         prev.map((s) => (s.id === editId ? { ...formData, id: editId } : s))
//       );
//     } else {
//       setStaff((prev) => [...prev, { ...formData, id: Date.now() }]);
//     }
//     handleCloseDialog();
//   };

//   const handleDelete = (id) => {
//     setStaff((prev) => prev.filter((s) => s.id !== id));
//   };

//   const filteredStaff = staff.filter((s) =>
//     Object.values(s)
//       .join(" ")
//       .toLowerCase()
//       .includes(search.toLowerCase())
//   );

//   return (
//     <Box>
//       {/* Header */}
//       <Box
//         display="flex"
//         flexDirection={{ xs: "column", sm: "row" }}
//         justifyContent="space-between"
//         alignItems={{ xs: "stretch", sm: "center" }}
//         mb={3}
//       >
//         <Typography variant="h5" sx={{ mb: { xs: 1, sm: 0 }, fontWeight: 600 }}>
//           Staff Management
//         </Typography>

//         <Box display="flex" flexDirection={{ xs: "column", sm: "row" }} gap={1}>
//           <TextField
//             label="Search staff..."
//             variant="outlined"
//             size="small"
//             value={search}
//             onChange={(e) => setSearch(e.target.value)}
//           />
//           <Button
//             variant="contained"
//             sx={{ backgroundColor: primaryColor, "&:hover": { backgroundColor: secondaryColor } }}
//             onClick={() => handleOpenDialog()}
//           >
//             Add Staff
//           </Button>
//         </Box>
//       </Box>

//       {/* Table */}
//       <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ backgroundColor: secondaryColor }}>
//               <TableCell sx={{ color: "white", fontWeight: 600 }}>Name</TableCell>
//               <TableCell sx={{ color: "white", fontWeight: 600 }}>Phone</TableCell>
//               <TableCell sx={{ color: "white", fontWeight: 600 }}>Address</TableCell>
//               <TableCell sx={{ color: "white", fontWeight: 600 }}>Username</TableCell>
//               <TableCell sx={{ color: "white", fontWeight: 600 }} align="right">
//                 Actions
//               </TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {filteredStaff.map((s) => (
//               <TableRow key={s.id} sx={{ "&:hover": { backgroundColor: "#f0f0f0" } }}>
//                 <TableCell>{s.name}</TableCell>
//                 <TableCell>{s.phone}</TableCell>
//                 <TableCell>{s.address}</TableCell>
//                 <TableCell>{s.username}</TableCell>
//                 <TableCell align="right">
//                   <IconButton
//                     sx={{ color: primaryColor }}
//                     onClick={() => handleOpenDialog(s)}
//                   >
//                     <Edit />
//                   </IconButton>
//                   <IconButton sx={{ color: "#F44336" }} onClick={() => handleDelete(s.id)}>
//                     <Delete />
//                   </IconButton>
//                 </TableCell>
//               </TableRow>
//             ))}
//             {filteredStaff.length === 0 && (
//               <TableRow>
//                 <TableCell colSpan={5} align="center">
//                   No staff found.
//                 </TableCell>
//               </TableRow>
//             )}
//           </TableBody>
//         </Table>
//       </TableContainer>

//       {/* Add/Edit Dialog */}
//       <Dialog open={openDialog} onClose={handleCloseDialog} fullWidth maxWidth="sm">
//         <DialogTitle sx={{ fontWeight: 600 }}>
//           {editId ? "Edit Staff" : "Add Staff"}
//         </DialogTitle>
//         <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
//           <TextField
//             label="Name"
//             value={formData.name}
//             onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//             fullWidth
//           />
//           <TextField
//             label="Phone"
//             value={formData.phone}
//             onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
//             fullWidth
//           />
//           <TextField
//             label="Address"
//             value={formData.address}
//             onChange={(e) => setFormData({ ...formData, address: e.target.value })}
//             fullWidth
//           />
//           <TextField
//             label="Username"
//             value={formData.username}
//             onChange={(e) => setFormData({ ...formData, username: e.target.value })}
//             fullWidth
//           />
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={handleCloseDialog}>Cancel</Button>
//           <Button
//             variant="contained"
//             sx={{ backgroundColor: primaryColor, "&:hover": { backgroundColor: secondaryColor } }}
//             onClick={handleSave}
//           >
//             {editId ? "Update" : "Add"}
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// }
