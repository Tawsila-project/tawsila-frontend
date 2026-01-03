import React, { useEffect, useState, useRef } from "react";
import { Box, Typography, Paper, MenuItem, TextField, Button } from "@mui/material";
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
import api from "../../src/components/api";
import Logo from "../assets/Logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const COLORS = ["#0ABE51", "#2CA9E3", "#0ABE51", "#2CA9E3", "#0ABE51"];

export default function PlacesStatsPage() {
  const [range, setRange] = useState("weekly");
  const [data, setData] = useState([]);
  const chartRef = useRef();

  const fetchStats = async () => {
    try {
      const res = await api.get(`/orders/places?range=${range}`);
      setData(res.data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  useEffect(() => { fetchStats(); }, [range]);

  const downloadPDF = async () => {
    if (!chartRef.current) return;

    const canvas = await html2canvas(chartRef.current, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // Header
    pdf.setFontSize(18);
    pdf.setTextColor("#0ABE51");
    pdf.setFont("helvetica", "bold");
    pdf.text("Tawsila - Places Report", pageWidth / 2, 15, { align: "center" });

    pdf.setFontSize(12);
    pdf.setTextColor("#333");
    pdf.setFont("helvetica", "normal");
    pdf.text(`Report Range: ${range.toUpperCase()}`, pageWidth / 2, 23, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: "center" });

    // Logo
    const logo = document.querySelector("#report-logo");
    if (logo) {
      const logoCanvas = await html2canvas(logo, { scale: 3 });
      const logoData = logoCanvas.toDataURL("image/png");
      pdf.addImage(logoData, "PNG", pageWidth / 2 - 15, 35, 30, 30);
    }

    // Chart
    const chartY = 70;
    const chartWidth = pageWidth - 20;
    const chartHeight = (canvas.height * chartWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, chartY, chartWidth, chartHeight);

    pdf.save(`Places_Stats_${range}.pdf`);
  };

  return (
    <Box>
      <img
        id="report-logo"
        src={Logo}
        alt="Company Logo"
        style={{ width: 60, height: 60, display: "block", margin: "auto", marginBottom: 10 }}
      />

      <Typography variant="h5" fontWeight="bold" mt={3} mb={3} textAlign="center">
        Places Statistics
      </Typography>

      <Box display="flex" justifyContent="center" mb={2} gap={2}>
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

        <Button variant="contained" color="primary" onClick={downloadPDF}>
          Download PDF
        </Button>
      </Box>

      <Paper sx={{ p: 3, overflowX: "auto" }} ref={chartRef}>
        <Box sx={{ width: "100%", height: 400 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              
              {/* XAxis محسّن */}
              <XAxis
                dataKey="city"
                tick={{ fontSize: 12 }}
                interval={0} // عرض كل التسمية
                angle={-35} // تدوير النص لتجنب التداخل
                textAnchor="end"
              />
              
              <YAxis />
              <Tooltip />
              <Legend verticalAlign="bottom" height={36} />

              {/* الأعمدة مع LabelList */}
              <Bar dataKey="deliveries" name="Deliveries">
                {data.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
                <LabelList
                  dataKey="city"  // اسم المنطقة على العمود
                  position="top"
                  angle={-45}
                  style={{ fontSize: 10, fill: "#333", fontWeight: "bold" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}



// import React, { useEffect, useState } from "react";
// import { Box, Typography, Paper, MenuItem, TextField } from "@mui/material";
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";
// import api from "../../src/components/api";
// import Logo from "../assets/Logo.png";

// const COLORS = ["#0ABE51", "#2CA9E3", "#0ABE51", "#2CA9E3", "#0ABE51"];

// export default function PlacesStatsPage() {
//   const [range, setRange] = useState("weekly");
//   const [data, setData] = useState([]);

//   const fetchStats = async () => {
//     try {
//       const res = await api.get(`/orders/places?range=${range}`);
//       setData(res.data);
//     } catch (err) {
//       console.error("Error loading stats:", err);
//     }
//   };

//   useEffect(() => {
//     fetchStats();
//   }, [range]);

//   return (
//     <Box>

//       <img
//         src={Logo}
//         alt="Company Logo"
//         style={{ width: 110, height: 110, display: "flex", marginLeft: "auto", marginRight: "auto" }}
//       />

//       <Typography variant="h5" color="black" fontWeight="bold" mt={3} mb={3} display={"flex"} justifyContent={"center"}>
//         Places Statistics
//       </Typography>

//       {/* 🔥 Filter */}
//       <Box display="flex" justifyContent="center" mb={2}>
//         <TextField
//           select
//           label="Filter By"
//           value={range}
//           onChange={(e) => setRange(e.target.value)}
//           sx={{ width: 200 }}
//         >
//           <MenuItem value="daily">Daily</MenuItem>
//           <MenuItem value="weekly">Weekly</MenuItem>
//           <MenuItem value="monthly">Monthly</MenuItem>
//         </TextField>
//       </Box>

//       <Paper sx={{ p: 3, overflowX: "auto" }}>
//         <Box sx={{ width: "100%", height: { xs: 300, sm: 400 } }}>
//           <ResponsiveContainer width="100%" height="100%">
//             <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
//               <CartesianGrid strokeDasharray="3 3" />
//               <XAxis dataKey="city" />
//               <YAxis />
//               <Tooltip />
//               <Legend verticalAlign="bottom" height={36} />
//               <Bar dataKey="deliveries" name="Deliveries">
//                 {data.map((entry, index) => (
//                   <Cell key={index} fill={COLORS[index % COLORS.length]} />
//                 ))}
//               </Bar>
//             </BarChart>
//           </ResponsiveContainer>
//         </Box>
//       </Paper>
//     </Box>
//   );
// }
