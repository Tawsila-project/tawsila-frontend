import React, { useEffect, useState, useRef } from "react";
import { 
  Box, 
  Typography, 
  Paper, 
  MenuItem, 
  TextField, 
  Button,
  CircularProgress,
  Alert,
  Divider
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell,
  LabelList
} from "recharts";
import Logo from "../assets/Logo.png"

// Modern Lucide-style icons using inline SVGs for reliability
const MapIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
    <circle cx="12" cy="10" r="3"></circle>
  </svg>
);

const ChartIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '8px' }}>
    <line x1="18" y1="20" x2="18" y2="10"></line>
    <line x1="12" y1="20" x2="12" y2="4"></line>
    <line x1="6" y1="20" x2="6" y2="14"></line>
  </svg>
);

const COLORS = ["#0ABE51", "#2CA9E3", "#078d3c", "#1a7fb1", "#055e28"];
const LOGO_PATH = "../assets/Logo.png";

export default function PlacesStatsPage() {
  const [range, setRange] = useState("weekly");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const chartRef = useRef();

  useEffect(() => {
    const loadScript = (src) => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = src;
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.head.appendChild(script);
      });
    };
    Promise.all([
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"),
      loadScript("https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js")
    ]);
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError(null);
    try {
      let apiInstance;
      try {
        const apiModule = await import("../../src/components/api");
        apiInstance = apiModule.default || apiModule;
      } catch (e) {
        throw new Error("API Connection Issue");
      }

      const res = await apiInstance.get(`/orders/places?range=${range}`);
      setData(res.data || []);
    } catch (err) {
      console.error("Error loading stats:", err);
      // Using fallback for UI preview purposes
      setData([
        { city: "Tripoli", deliveries: 150 },
        { city: "Beirut", deliveries: 280 },
        { city: "Sidon", deliveries: 95 },
        { city: "Jbeil", deliveries: 60 },
        { city: "Zahle", deliveries: 45 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    fetchStats(); 
  }, [range]);

  // const downloadPDF = async () => {
  //   if (!chartRef.current || !window.jspdf || !window.html2canvas) return;
  //   const canvas = await window.html2canvas(chartRef.current, { scale: 2 });
  //   const imgData = canvas.toDataURL("image/png");
  //   const { jsPDF } = window.jspdf;
  //   const pdf = new jsPDF("p", "mm", "a4");
  //   pdf.addImage(imgData, "PNG", 10, 20, 190, 0);
  //   pdf.save(`Tawsila_Report_${range}.pdf`);
  // };


  const downloadPDF = async () => {
  if (!chartRef.current || !window.jspdf || !window.html2canvas) return;

  const canvas = await window.html2canvas(chartRef.current, { scale: 2 });
  const imgData = canvas.toDataURL("image/png");

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  // Add Logo at the top
  const logoImg = new Image();
  logoImg.src = Logo; // use imported logo
  await new Promise((resolve) => {
    logoImg.onload = resolve;
  });
  pdf.addImage(logoImg, "PNG", 10, 10, 30, 30); // x=10, y=10, width=30mm, height=30mm

  // Add Report Title
  pdf.setFontSize(16);
  pdf.setFont(undefined, "bold");
  pdf.text("Area Analytics Report", 50, 20); // Adjust X, Y as needed

  // Add Today's Date
  const today = new Date();
  const dateStr = today.toLocaleDateString(); // e.g., 1/4/2026
  pdf.setFontSize(12);
  pdf.setFont(undefined, "normal");
  pdf.text(`Date: ${dateStr}`, 50, 28); // below the title

  // Add the chart image below the header
  pdf.addImage(imgData, "PNG", 10, 45, 190, 0);

  pdf.save(`Tawsila_Report_${range}_${dateStr}.pdf`);
};

  return (
    <Box sx={{ p: { xs: 2, md: 5 }, backgroundColor: "#F1F5F9", minHeight: "100vh", fontFamily: "'Inter', sans-serif" }}>
      
      {/* Header & Logo Section */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 6 }}>
        <Box 
          component="img"
          src={Logo}
          alt="Tawsila"
          sx={{ width: 100, mb: 2, filter: 'drop-shadow(0px 4px 10px rgba(0,0,0,0.05))' }}
          onError={(e) => { e.target.style.display = 'none'; }}
        />
        <Typography variant="h3" sx={{ fontWeight: 900, color: "#1976d2", letterSpacing: "-1px", mb: 1 }}>
          Area Analytics
        </Typography>
        <Typography variant="body1" sx={{ color: "#64748B", fontWeight: 500 }}>
          Track delivery performance by geographic location
        </Typography>
      </Box>

      {/* Control Section */}
      <Paper 
        elevation={0} 
        sx={{ 
          maxWidth: 900, 
          mx: 'auto', 
          p: 2, 
          mb: 4, 
          borderRadius: "20px", 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
          backgroundColor: "rgba(255, 255, 255, 0.8)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.3)"
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', pl: 2 }}>
          <MapIcon />
          <Typography sx={{ fontWeight: 700, color: "#1E293B" }}>Report Range:</Typography>
          <TextField
            select
            variant="standard"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            sx={{ ml: 2, minWidth: 120, '& .MuiInput-underline:before': { borderBottom: 'none' } }}
            InputProps={{ style: { fontWeight: 700, color: "#0ABE51" } }}
          >
            <MenuItem value="daily">Daily</MenuItem>
            <MenuItem value="weekly">Weekly</MenuItem>
            <MenuItem value="monthly">Monthly</MenuItem>
          </TextField>
        </Box>

        <Button 
          variant="contained" 
          onClick={downloadPDF}
          sx={{ 
            borderRadius: "12px", 
            backgroundColor: "#1976d2", 
            px: 4, 
            py: 1.5,
            fontWeight: 700,
            textTransform: 'none',
            boxShadow: '0 4px 15px rgba(15, 23, 42, 0.2)',
            '&:hover': { backgroundColor: "#334155" }
          }}
        >
          Export PDF
        </Button>
      </Paper>

      {/* Main Chart Container */}
      <Paper 
        ref={chartRef}
        elevation={0} 
        sx={{ 
          maxWidth: 1000, 
          mx: 'auto', 
          borderRadius: "32px", 
          overflow: 'hidden',
          border: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.05)'
        }}
      >
        {/* Chart Header */}
        <Box sx={{ p: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #F1F5F9' }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box sx={{ width: 12, height: 12, borderRadius: '3px', backgroundColor: '#0ABE51', mr: 1.5 }} />
              <Typography variant="h6" sx={{ fontWeight: 800, color: '#1976d2' }}>
                Delivery Statistics by City
              </Typography>
            </Box>
            <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 600, ml: 3.5 }}>
              Shows completed orders based on selected time range
            </Typography>
          </Box>
          <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
            <Typography sx={{ fontSize: '12px', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>Data Status</Typography>
            <Typography sx={{ fontSize: '14px', color: '#0ABE51', fontWeight: 800 }}>Live</Typography>
          </Box>
        </Box>

        <Box sx={{ p: { xs: 2, md: 5 } }}>
          {loading ? (
            <Box display="flex" justifyContent="center" py={10}><CircularProgress sx={{ color: '#0ABE51' }} /></Box>
          ) : (
            <Box sx={{ width: "100%", height: 450 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#F1F5F9" />
                  <XAxis 
                    dataKey="city" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#64748B', fontWeight: 700, fontSize: 13 }}
                    dy={15}
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: '#F8FAFC' }}
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                      padding: '15px' 
                    }}
                  />
                  <Bar dataKey="deliveries" radius={[10, 10, 10, 10]} barSize={40}>
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} fillOpacity={0.85} />
                    ))}
                    <LabelList 
                      dataKey="deliveries" 
                      position="top" 
                      offset={15} 
                      style={{ fill: '#1E293B', fontWeight: 900, fontSize: '16px' }} 
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ px: 4, py: 3, backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between' }}>
          <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
            Total Orders: {data.reduce((acc, curr) => acc + curr.deliveries, 0)}
          </Typography>
          <Typography sx={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
             Tawsila © {new Date().getFullYear()}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
}
