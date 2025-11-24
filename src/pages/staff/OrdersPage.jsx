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

export default function OrdersPage() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null); // order to delete
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });

  const userRole = localStorage.getItem("role"); // "staff" or "admin"

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
  // const getCityFromAddress = (address) => {
  //   if (!address) return "-";
  //   const parts = address.split(",").map((p) => p.trim());
  //   return parts[parts.length - 1];
  // };

 const getCityFromAddress = (address) => {
  if (!address) return "-";
  const parts = address.trim().split(" "); // split by space
  return parts[0]; // return the first word
};



  return (
    <Box p={{ xs: 2, sm: 7 }}>
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

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table sx={{ minWidth: { xs: 700, sm: "100%" } }}>
            <TableHead>
              <TableRow>
                <TableCell>Id</TableCell>
                <TableCell>Customer Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Place</TableCell>
                <TableCell>Type of Item</TableCell>
                <TableCell>Assigned Staff</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order._id}>
                  <TableCell>{order.order_number.slice(-6)}</TableCell>
                  <TableCell>{order.customer.name}</TableCell>
                  <TableCell>{order.customer.phone}</TableCell>
                  <TableCell>{getCityFromAddress(order.customer.address)}</TableCell>
                  <TableCell>{order.type_of_item || "-"}</TableCell>
                  <TableCell>{order.assigned_staff_id?.username || "Unassigned"}</TableCell>
                  <TableCell>
                    <Chip label={order.status} color={statusColor[order.status]} size="small" />
                  </TableCell>
                  <TableCell>{dayjs(order.createdAt).format("DD/MM/YYYY HH:mm")}</TableCell>
                  <TableCell>
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
                  <TableCell colSpan={9} align="center">
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
            width: 300,
            bgcolor: "background.paper",
            p: 4,
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
            width: 350,
            bgcolor: "background.paper",
            p: 4,
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
