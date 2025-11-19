// src/pages/OrdersPage.jsx
import React, { useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  IconButton,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";

const initialOrders = [
  {
    id: "#4353",
    customer: "Samir",
    phone: "43434",
    address: "Tripoli",
    assigned: "12:32",
    status: "Received",
  },
  {
    id: "#5266",
    customer: "Tarek",
    phone: "43434",
    address: "Beirut",
    assigned: "5:20",
    status: "Delivered",
  },
];

export default function OrdersPage() {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");

  // Filtered orders based on search
  const filteredOrders = orders.filter(
    (order) =>
      order.customer.toLowerCase().includes(search.toLowerCase()) ||
      order.id.toLowerCase().includes(search.toLowerCase()) ||
      order.status.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = (id) => {
    setOrders(orders.filter((order) => order.id !== id));
  };

  const handleEdit = (id) => {
    alert(`Edit order ${id} (implement your modal or form)`);
  };

  const handleAddOrder = () => {
    alert("Add Order (implement your form)");
  };

  return (
    <Box>
      <Box
        display="flex"
        flexDirection={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        mb={3}
        gap={2}
      >
        <Typography variant="h5" fontWeight="bold">
          Orders
        </Typography>

        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="Search Orders"
            variant="outlined"
            size="small"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button
            variant="contained"
            sx={{
              bgcolor: "#0ABE51",
              "&:hover": { bgcolor: "#059a3b" },
            }}
            onClick={handleAddOrder}
          >
            Add Order
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead sx={{ bgcolor: "#2CA9E3" }}>
            <TableRow>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Order ID</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Customer</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Phone</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Address</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Assigned</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
              <TableCell sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map((order) => (
              <TableRow key={order.id} hover>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>{order.phone}</TableCell>
                <TableCell>{order.address}</TableCell>
                <TableCell>{order.assigned}</TableCell>
                <TableCell>{order.status}</TableCell>
                <TableCell>
                  <IconButton
                    sx={{ color: "#2CA9E3" }}
                    onClick={() => handleEdit(order.id)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton
                    sx={{ color: "#F44336" }}
                    onClick={() => handleDelete(order.id)}
                  >
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}

            {filteredOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No orders found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
