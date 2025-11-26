import React, { useEffect, useState } from "react";
import { Box, Typography, Paper, MenuItem, TextField } from "@mui/material";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
import api from "../../src/components/api";
import Logo from "../assets/Logo.png";

const COLORS = ["#0ABE51", "#2CA9E3", "#0ABE51", "#2CA9E3", "#0ABE51"];

export default function PlacesStatsPage() {
  const [range, setRange] = useState("weekly");
  const [data, setData] = useState([]);

  const fetchStats = async () => {
    try {
      const res = await api.get(`/orders/places?range=${range}`);
      setData(res.data);
    } catch (err) {
      console.error("Error loading stats:", err);
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
        Places Statistics
      </Typography>

      {/* 🔥 Filter */}
      <Box display="flex" justifyContent="center" mb={2}>
        <TextField
          select
          label="Filter By"
          value={range}
          onChange={(e) => setRange(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </TextField>
      </Box>

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
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}
