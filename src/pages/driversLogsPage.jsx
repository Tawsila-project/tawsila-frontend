import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  Paper,
  MenuItem,
  Select,
  Button,
} from "@mui/material";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import api from "../../src/components/api";
import Logo from "../assets/Logo.png";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function OrdersRangeStats() {
  const [range, setRange] = useState("daily");
  const [data, setData] = useState([]);
  const chartRef = useRef();

  // ==========================
  // Fetch data
  // ==========================
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

  // ==========================
  // Download PDF
  // ==========================
  const downloadPDF = async () => {
    if (!chartRef.current || data.length === 0) return;

    const canvas = await html2canvas(chartRef.current, { scale: 3 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pageWidth = pdf.internal.pageSize.getWidth();

    // ===== Header =====
    pdf.setFontSize(18);
    pdf.setTextColor("#0ABE51");
    pdf.setFont("helvetica", "bold");
    pdf.text("Tawsila - Orders Report", pageWidth / 2, 15, { align: "center" });

    pdf.setFontSize(12);
    pdf.setTextColor("#333");
    pdf.setFont("helvetica", "normal");
    pdf.text(`Report Range: ${range.toUpperCase()}`, pageWidth / 2, 23, { align: "center" });
    pdf.text(`Generated on: ${new Date().toLocaleString()}`, pageWidth / 2, 30, { align: "center" });

    // ===== Logo =====
    const logo = document.querySelector("#report-logo");
    if (logo) {
      const logoCanvas = await html2canvas(logo, { scale: 3 });
      const logoData = logoCanvas.toDataURL("image/png");
      pdf.addImage(logoData, "PNG", pageWidth / 2 - 15, 35, 30, 30);
    }

    // ===== Chart =====
    const chartY = 75;
    const chartWidth = pageWidth - 20;
    const chartHeight = (canvas.height * chartWidth) / canvas.width;
    pdf.addImage(imgData, "PNG", 10, chartY, chartWidth, chartHeight);

    pdf.save(`Orders_Stats_${range}.pdf`);
  };

  // ==========================
  // Render
  // ==========================
  return (
    <Box sx={{ p: 2 }}>
      {/* Logo */}
      <img
        id="report-logo"
        src={Logo}
        alt="Company Logo"
        style={{ width: 60, height: 60, display: "block", margin: "auto", marginBottom: 10 }}
      />

      {/* Title */}
      <Typography variant="h5" fontWeight="bold"  mt={3} mb={3} textAlign="center" sx={{ fontWeight: 900, color: "#1976d2" }}>
        Order Statistics
      </Typography>

      {/* Filters */}
      <Box display="flex" justifyContent="center" mb={2} gap={2}>
        <Select
          value={range}
          onChange={(e) => setRange(e.target.value)}
          sx={{ width: 200 }}
        >
          <MenuItem value="daily">Daily</MenuItem>
          <MenuItem value="weekly">Weekly</MenuItem>
          <MenuItem value="monthly">Monthly</MenuItem>
        </Select>

        <Button variant="contained" color="primary" onClick={downloadPDF}>
          Download PDF
        </Button>
      </Box>

      {/* Chart */}
      <Paper sx={{ p: 3, overflowX: "auto" }} ref={chartRef}>
        <Box sx={{ width: "100%", height: 500 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 50 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 12, fontWeight: "bold", angle: -45, textAnchor: "end" }}
                interval={0} // كل التواريخ تظهر
              />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#0ABE51"
                strokeWidth={3}
              >
                <LabelList
                  dataKey="orders"
                  position="top"
                  style={{ fontSize: 12, fill: "#333", fontWeight: "bold" }}
                />
              </Line>
            </LineChart>
          </ResponsiveContainer>
        </Box>
      </Paper>
    </Box>
  );
}


