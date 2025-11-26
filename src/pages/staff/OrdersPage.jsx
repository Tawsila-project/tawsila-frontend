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
  Chip,
  CircularProgress,
  IconButton,
  Button,
  Modal,
  Snackbar,
  Alert,
} from "@mui/material";
import { Edit, Delete } from "@mui/icons-material";
import api from "../../components/api";
import dayjs from "dayjs";
import Logo from "../../assets/Logo.png";


export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const userRole = localStorage.getItem("role");

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.get("/orders");
      setOrders(res.data);
    } catch (err) {
      console.error("Error fetching orders:", err.response?.data?.error || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    try {
      const res = await api.delete(`/orders/${deleteConfirm._id}`);
      setOrders((prev) => prev.filter((order) => order._id !== deleteConfirm._id));
      setSnackbar({ open: true, message: "Order deleted successfully", severity: "success" });
      setDeleteConfirm(null);
    } catch (err) {
      console.error("Error deleting order:", err.response?.data?.error || err.message);
      setSnackbar({ open: true, message: "Failed to delete order", severity: "error" });
      setDeleteConfirm(null);
    }
  };

  const handleEdit = (order) => {
    setEditingOrder(order);
    setEditStatus(order.status);
  };

  const handleUpdate = async () => {
    if (!editingOrder) return;
    try {
      const res = await api.put(`/orders/${editingOrder._id}`, { status: editStatus });
      setOrders((prev) =>
        prev.map((order) => (order._id === editingOrder._id ? res.data.order : order))
      );
      setEditingOrder(null);
      setSnackbar({ open: true, message: "Order updated successfully", severity: "success" });
    } catch (err) {
      console.error("Error updating order:", err.response?.data?.error || err.message);
      setSnackbar({ open: true, message: "Failed to update order", severity: "error" });
    }
  };

  const filteredOrders = orders.filter((order) =>
    order.order_number.slice(-6).toLowerCase().includes(search.toLowerCase()) ||
    order.customer.name.toLowerCase().includes(search.toLowerCase()) ||
    order.customer.phone.includes(search) ||
    order.customer.address.toLowerCase().includes(search.toLowerCase())
  );

  const statusColor = { received: "info", delivered: "success", in_transit: "warning" };

  const getCityFromAddress = (address) => {
    if (!address) return "-";
    const parts = address.trim().split(" ");
    return parts[0];
  };

  return (
    <Box
       sx={{
        px: { xs: 1, sm: 2, md: 4 }, // horizontal padding responsive
    py: { xs: 2, sm: 3 },        // vertical padding responsive
    width: "100%",
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",        // centers logo and heading
    backgroundColor: "#f9f9f9",
      }}
    >

        <img
          src={Logo}
          alt="Company Logo"
          style={{ width: 110, height: "110" , display: "flex", marginLeft: "auto", marginRight: "auto", marginBottom: 16,}}
        />
      <Typography variant="h5" color="black" fontWeight="bold" mb={3}>
        Orders
      </Typography>

      <TextField
        label="Search Orders"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ py: 1, px: 1 }}>Id</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Customer Name</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Phone</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Place</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Type of Item</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Assigned Staff</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Status</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Created At</TableCell>
                <TableCell sx={{ py: 1, px: 1 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell sx={{ py: 1, px: 1 }}>{order.order_number.slice(-6)}</TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>{order.customer.name}</TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>{order.customer.phone}</TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>{getCityFromAddress(order.customer.address)}</TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>{order.type_of_item || "-"}</TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>{order.assigned_staff_id?.username || "Unassigned"}</TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>
                    <Chip label={order.status} color={statusColor[order.status]} size="small" />
                  </TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>{dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell sx={{ py: 1, px: 1 }}>
                    <IconButton color="primary" onClick={() => handleEdit(order)}>
                      <Edit />
                    </IconButton>
                    {userRole === "admin" && (
                      <IconButton color="error" onClick={() => setDeleteConfirm(order)}>
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredOrders.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 2 }}>
                    No orders found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Edit modal */}
      <Modal open={!!editingOrder} onClose={() => setEditingOrder(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "95%", sm: 300 },
            bgcolor: "background.paper",
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
          }}
        >
          <Typography variant="h6" mb={2}>
            Edit Order Status
          </Typography>
          <TextField
            select
            label="Status"
            value={editStatus}
            onChange={(e) => setEditStatus(e.target.value)}
            fullWidth
            SelectProps={{ native: true }}
            sx={{ mb: 2 }}
          >
            <option value="received">Received</option>
            <option value="in_transit">In Transit</option>
            <option value="delivered">Delivered</option>
          </TextField>
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button variant="contained" onClick={handleUpdate}>
              Update
            </Button>
            <Button variant="outlined" onClick={() => setEditingOrder(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Delete confirmation modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <Box
          sx={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: { xs: "90%", sm: 350 },
            bgcolor: "background.paper",
            p: { xs: 2, sm: 4 },
            borderRadius: 2,
            textAlign: "center",
          }}
        >
          <Typography variant="h6" mb={2}>
            Are you sure you want to delete this order?
          </Typography>
          <Typography mb={2}>Order #: {deleteConfirm?.order_number}</Typography>
          <Box display="flex" justifyContent="center" gap={2}>
            <Button variant="contained" color="error" onClick={handleDelete}>
              Delete
            </Button>
            <Button variant="outlined" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
          </Box>
        </Box>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}





// // src/pages/staff/OrdersPage.jsx
// import { useState } from "react";
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
// } from "@mui/material";

// export default function OrdersPage() {
//   const [search, setSearch] = useState("");

//   // Dummy orders data
//   const ordersList = [
//     { id: "#4353", customer: "Samir", phone: "43434", address: "mina", assigned: "12:32", status: "Received" },
//     { id: "#5266", customer: "Tarek", phone: "43434", address: "Beirut", assigned: "5:20", status: "Delivered" },
//     { id: "#7821", customer: "Ahmed", phone: "55665", address: "Abu samra", assigned: "14:10", status: "In Transit" },
//   ];

//   const filteredOrders = ordersList.filter((order) =>
//     order.id.toLowerCase().includes(search.toLowerCase()) ||
//     order.customer.toLowerCase().includes(search.toLowerCase()) ||
//     order.phone.includes(search) ||
//     order.address.toLowerCase().includes(search.toLowerCase())
//   );

//   // Status color mapping
//   const statusColor = {
//     "Received": "info",
//     "Delivered": "success",
//     "In Transit": "warning",
//   };

//   return (
//     <Box p={{ xs: 2, sm: 7 }}>
//       <Typography variant="h5" fontWeight="bold" mb={3}>
//         Orders
//       </Typography>

//       <TextField
//         label="Search Orders"
//         value={search}
//         onChange={(e) => setSearch(e.target.value)}
//         fullWidth
//         sx={{ mb: 3 }}
//       />

//       {/* Responsive Table Wrapper */}
//       <Box sx={{ overflowX: "auto" }}>
//         <TableContainer component={Paper}>
//           <Table sx={{ minWidth: { xs: 600, sm: "100%" } }}>
//             <TableHead>
//               <TableRow>
//                 <TableCell>Order ID</TableCell>
//                 <TableCell>Customer Name</TableCell>
//                 <TableCell>Phone</TableCell>
//                 <TableCell>Address</TableCell>
//                 <TableCell>Assigned</TableCell>
//                 <TableCell>Status</TableCell>
//                 <TableCell>Actions</TableCell>
//               </TableRow>
//             </TableHead>
//             <TableBody>
//               {filteredOrders.map((order, idx) => (
//                 <TableRow key={idx}>
//                   <TableCell>{order.id}</TableCell>
//                   <TableCell>{order.customer}</TableCell>
//                   <TableCell>{order.phone}</TableCell>
//                   <TableCell>{order.address}</TableCell>
//                   <TableCell>{order.assigned}</TableCell>
//                   <TableCell>
//                     <Chip label={order.status} color={statusColor[order.status]} size="small" />
//                   </TableCell>
//                   <TableCell>
//                     <Button size="small" sx={{ mr: 1, mb: { xs: 1, sm: 0 } }} variant="outlined">
//                       Edit
//                     </Button>
//                     <Button size="small" variant="outlined" color="error">
//                       Delete
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </TableContainer>
//       </Box>
//     </Box>
//   );
// }
