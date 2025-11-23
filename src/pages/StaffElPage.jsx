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


