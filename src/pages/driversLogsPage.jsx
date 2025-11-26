import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, MenuItem, Select } from "@mui/material";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import api from "../../src/components/api";
import Logo from "../assets/Logo.png";

export default function OrdersRangeStats() {
  const [range, setRange] = useState("daily");
  const [data, setData] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/orders/logs-status?range=${range}`);
      setData(res.data);
    } catch (error) {
      console.error("Error fetching range stats:", error);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [range]);

  return (
    <Box>

      <img
      src={Logo}
      alt="Company Logo"
      style={{ width: 110, height: 110, display: "flex", marginLeft: "auto", marginRight: "auto" }}
      />
      
      <Typography variant="h5" color="black" fontWeight="bold" mt={3} mb={3} display={"flex"} justifyContent={"center"}>
        Order Statistics
      </Typography>

      <Select
        value={range}
        onChange={(e) => setRange(e.target.value)}
        sx={{ mb: 3, width: 200 }}
      >
        <MenuItem value="daily">Daily</MenuItem>
        <MenuItem value="weekly">Weekly</MenuItem>
        <MenuItem value="monthly">Monthly</MenuItem>
      </Select>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ width: "100%", height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#0ABE51" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}


// // src/pages/LogisticsStatsPage.jsx
// import React from "react";
// import { Box, Typography, Paper } from "@mui/material";
// import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
// import Logo from "../assets/Logo.png";


// // Sample data
// const data = [
//   { name: "Delivered", value: 45 },
//   { name: "In Transit", value: 25 },
//   { name: "Pending", value: 20 },
//   { name: "Cancelled", value: 10 },
// ];

// // Colors matching your brand
// const COLORS = ["#0ABE51", "#2CA9E3", "#FACC15", "#F44336"];

// export default function LogisticsStatsPage() {
//   return (
//     <Box>

//       <img
//           src={Logo}
//           alt="Company Logo"
//           style={{ width: 110, height: "110" , display: "flex", marginLeft: "auto", marginRight: "auto"}}
//         />
//        <Typography variant="h5" fontWeight="bold" mt={3} color="black" mb={3} display={"flex"} align="center" justifyContent={"center"}>
//         Logistics Statistics
//       </Typography>

//       <Paper sx={{ p: 3, overflowX: "auto" }}>
//         <Box sx={{ width: "100%", height: { xs: 300, sm: 400 } }}>
//           <ResponsiveContainer width="100%" height="100%">
//             <PieChart>
//               <Pie
//                 data={data}
//                 dataKey="value"
//                 nameKey="name"
//                 cx="50%"
//                 cy="50%"
//                 outerRadius={100}
//                 fill="#8884d8"
//                 label
//               >
//                 {data.map((entry, index) => (
//                   <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Pie>
//               <Tooltip />
//               <Legend verticalAlign="bottom" height={36} />
//             </PieChart>
//           </ResponsiveContainer>
//         </Box>
//       </Paper>
      
//     </Box>
//   );
// }
