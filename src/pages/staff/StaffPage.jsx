// src/pages/staff/StaffPage.jsx
import { useState } from "react";
import { Box, Typography, TextField, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Chip } from "@mui/material";

export default function StaffPage() {
  const [search, setSearch] = useState("");

  // Dummy staff data
  const staffList = [
    { name: "Ahmed", phone: "94343", address: "mina", availability: true },
    { name: "Tarek", phone: "43434", address: "Beirut", availability: false },
    { name: "Samir", phone: "55665", address: "abu samra", availability: true },
  ];

  const filteredStaff = staffList.filter((staff) =>
    staff.name.toLowerCase().includes(search.toLowerCase()) ||
    staff.phone.includes(search) ||
    staff.address.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>Staff Members</Typography>

      <TextField
        label="Search Staff"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Availability</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredStaff.map((staff, idx) => (
              <TableRow key={idx}>
                <TableCell>{staff.name}</TableCell>
                <TableCell>{staff.phone}</TableCell>
                <TableCell>{staff.address}</TableCell>
                <TableCell>
                  <Chip
                    label={staff.availability ? "Available" : "Offline"}
                    color={staff.availability ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Button size="small" sx={{ mr: 1 }} variant="outlined">Edit</Button>
                  <Button size="small" variant="outlined" color="error">Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
