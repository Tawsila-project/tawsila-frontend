// src/pages/PlacesStatsPage.jsx
import React from "react";
import { Box, Typography, Paper } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import Logo from "../../public/Logo.png";

// Sample data for places
const data = [
  { city: "dam w farez", deliveries: 45 },
  { city: "Beirut", deliveries: 30 },
  { city: "Mina", deliveries: 25 },
  { city: "Jubeil", deliveries: 15 },
  { city: "Down town", deliveries: 20 },
];

// Brand colors
const COLORS = ["#0ABE51", "#2CA9E3", "#0ABE51", "#2CA9E3", "#0ABE51"];

export default function PlacesStatsPage() {
  return (
    <Box>

      <img
          src={Logo}
          alt="Company Logo"
          style={{ width: 110, height: "110" , display: "flex", marginLeft: "auto", marginRight: "auto"}}
        />
       <Typography variant="h5" fontWeight="bold" mt={3} mb={3} display={"flex"} align="center" justifyContent={"center"}>
        Places Statistics
      </Typography>

      <Paper sx={{ p: 3, overflowX: "auto" }}>
        <Box sx={{ width: "100%", height: { xs: 300, sm: 400 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />
              <Bar dataKey="deliveries" name="Deliveries">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
