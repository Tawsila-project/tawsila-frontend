// src/pages/staff/OrdersPage.jsx
import { useState } from "react";
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
} from "@mui/material";

export default function OrdersPage() {
  const [search, setSearch] = useState("");

  // Dummy orders data
  const ordersList = [
    { id: "#4353", customer: "Samir", phone: "43434", address: "mina", assigned: "12:32", status: "Received" },
    { id: "#5266", customer: "Tarek", phone: "43434", address: "Beirut", assigned: "5:20", status: "Delivered" },
    { id: "#7821", customer: "Ahmed", phone: "55665", address: "Abu samra", assigned: "14:10", status: "In Transit" },
  ];

  const filteredOrders = ordersList.filter((order) =>
    order.id.toLowerCase().includes(search.toLowerCase()) ||
    order.customer.toLowerCase().includes(search.toLowerCase()) ||
    order.phone.includes(search) ||
    order.address.toLowerCase().includes(search.toLowerCase())
  );

  // Status color mapping
  const statusColor = {
    "Received": "info",
    "Delivered": "success",
    "In Transit": "warning",
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" mb={3}>
        Orders
      </Typography>

      <TextField
        label="Search Orders"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Order ID</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Address</TableCell>
              <TableCell>Assigned</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order, idx) => (
              <TableRow key={idx}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.phone}</TableCell>
                <TableCell>{order.address}</TableCell>
                <TableCell>{order.assigned}</TableCell>
                <TableCell>
                  <Chip label={order.status} color={statusColor[order.status]} size="small" />
                </TableCell>
                <TableCell>
                  <Button size="small" sx={{ mr: 1 }} variant="outlined">
                    Edit
                  </Button>
                  <Button size="small" variant="outlined" color="error">
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
