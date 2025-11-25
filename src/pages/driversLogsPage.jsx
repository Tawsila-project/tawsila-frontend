// src/pages/LogisticsStatsPage.jsx
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";
import Logo from "../../public/Logo.png";

// Sample data
const data = [
  { name: "Delivered", value: 45 },
  { name: "In Transit", value: 25 },
  { name: "Pending", value: 20 },
  { name: "Cancelled", value: 10 },
];

// Colors matching your brand
const COLORS = ["#0ABE51", "#2CA9E3", "#FACC15", "#F44336"];

export default function LogisticsStatsPage() {
  return (
    <Box>

      <img
          src={Logo}
          alt="Company Logo"
          style={{ width: 110, height: "110" , display: "flex", marginLeft: "auto", marginRight: "auto"}}
        />
       <Typography variant="h5" fontWeight="bold" mt={3} mb={3} display={"flex"} align="center" justifyContent={"center"}>
        Logistics Statistics
      </Typography>

      <Paper sx={{ p: 3, overflowX: "auto" }}>
        <Box sx={{ width: "100%", height: { xs: 300, sm: 400 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
            </PieChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
      
    </Box>
  );
}
