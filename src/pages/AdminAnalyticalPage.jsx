import React, { useEffect, useState, useRef } from "react";

import {
  Box,
  Typography,
  Paper,
  MenuItem,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
  Skeleton,
  CircularProgress,
  IconButton,
  Tooltip as MuiTooltip
} from "@mui/material";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from "recharts";
import { 
  PictureAsPdf, 
  Psychology, 
  QueryStats, 
  Map, 
  Refresh
} from "@mui/icons-material";

// Configuration
const apiKey = ""; 
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";
const COLORS = ["#0ABE51", "#2CA9E3", "#FFBB28", "#FF8042", "#8884d8"];
import Logo from "../assets/Logo.png";


/**
 * IMPORTANT NOTE ON ASSETS:
 * In this sandbox environment, we cannot directly "import" local image files via ES modules.
 * Instead, we use a constant for the path which will work in your local environment.
 */
const LOGO_PATH = "../assets/Logo.png"; 

export default function App() {
  const [range, setRange] = useState("weekly");
  const [timelineData, setTimelineData] = useState([]);
  const [placesData, setPlacesData] = useState([]);
  const [aiAnalysis, setAiAnalysis] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const reportRef = useRef();

  // Load PDF export libraries
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

  const fetchAllData = async () => {
    setLoading(true);
    setAiAnalysis("");
    
    // Mock data for preview
    const mockTimeline = [
      { date: "2026-1-01", orders: 45 },
      { date: "2026-1-02", orders: 52 },
      { date: "2026-1-03", orders: 48 },
      { date: "2026-1-04", orders: 70 },
      { date: "2026-1-05", orders: 61 },
      { date: "2026-1-06", orders: 85 },
      { date: "2026-1-07", orders: 92 }
    ];

    const mockPlaces = [
      { city: "Tripoli", deliveries: 520 },
      { city: "Beirut", deliveries: 250 },
      { city: "Sidon", deliveries: 85 },
      { city: "Byblos", deliveries: 45 },
      { city: "Zahle", deliveries: 30 }
    ];

    setTimeout(() => {
      setTimelineData(mockTimeline);
      setPlacesData(mockPlaces);
      setLoading(false);
      analyzeDataWithAI(mockTimeline, mockPlaces);
    }, 800);
  };

  useEffect(() => {
    fetchAllData();
  }, [range]);

  const analyzeDataWithAI = async (timeline, places) => {
    if (timeline.length === 0 && places.length === 0) return;
    setAnalyzing(true);
    
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const prompt = `
      Analyze this delivery data and provide strategic insights:
      Timeline: ${JSON.stringify(timeline)}
      Places: ${JSON.stringify(places)}
      Return findings as professional bullet points in English. Focus on growth and efficiency.
    `;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      });
      const result = await response.json();
      setAiAnalysis(result.candidates?.[0]?.content?.parts?.[0]?.text || "AI Insights.");
    } catch (error) {
      setAiAnalysis("Failed to generate analysis due to connection error.");
    } finally {
      setAnalyzing(false);
    }
  };

  const downloadPDF = async () => {
    if (!window.jspdf || !window.html2canvas) return;
    const element = reportRef.current;
    
    const canvas = await window.html2canvas(element, { 
        scale: 2,
        useCORS: true,
        logging: false
    });
    
    const imgData = canvas.toDataURL("image/png");
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const imgProps = pdf.getImageProperties(imgData);
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
    
    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`Strategic_Report_${range}.pdf`);
  };

  return (
    <Box sx={{ p: 3, bgcolor: "#f1f5f9", minHeight: "100vh", fontFamily: 'Inter, sans-serif' }}>
      {/* Header Section */}
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ xs: 'flex-start', md: 'center' }} spacing={2} sx={{ mb: 4 }}>
        <Stack direction="row" alignItems="center" spacing={3}>
          {/* Logo Implementation - Using img tag with local path fallback */}
          <Box 
            component="img" 
            src={Logo} 
            alt="Logo" 
            sx={{ height: 40, width: 'auto', borderRadius: 1 }}
            onError={(e) => { 
              // If the local asset isn't available in this environment, show a stylish text logo
              e.target.style.display = 'none';
              const placeholder = document.createElement('div');
              placeholder.style.fontWeight = '900';
              placeholder.style.color = '#0ABE51';
              placeholder.style.fontSize = '24px';
              placeholder.style.letterSpacing = '-1px';
              placeholder.innerText = {Logo};
              e.target.parentNode.appendChild(placeholder);
            }}
          />
          <Box sx={{ borderLeft: '2px solid #cbd5e1', pl: 3 }}>
            <Typography variant="h5" fontWeight="800" color="#0abe51">
              Operational Intelligence
            </Typography>
            <Typography variant="body2" color="text.secondary">Smart Analytics & Strategic Dashboard</Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={2} width={{ xs: '100%', md: 'auto' }}>
          <TextField
            select
            size="small"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            sx={{ width: 140, bgcolor: "white" }}
          >
            <MenuItem value="daily">Daily View</MenuItem>
            <MenuItem value="weekly">Weekly View</MenuItem>
            <MenuItem value="monthly">Monthly View</MenuItem>
          </TextField>
          <Button 
            variant="contained" 
            startIcon={<PictureAsPdf />} 
            onClick={downloadPDF}
            sx={{ bgcolor: "#0abe51", "&:hover": { bgcolor: "#334155" }, textTransform: 'none', px: 3, borderRadius: 2 }}
          >
            Export PDF
          </Button>
          <IconButton onClick={fetchAllData} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
            <Refresh />
          </IconButton>
        </Stack>
      </Stack>

      <Box ref={reportRef} sx={{ p: 1 }}>
        <Grid container spacing={3}>
          {/* AI Strategy Insights */}
          <Grid item xs={12}>
            <Card sx={{ borderRadius: 4, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Box sx={{ bgcolor: '#0abe51', p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Psychology sx={{ color: '#0ABE51' }} />
                  <Typography color="white" fontWeight="600">Strategic AI Recommendations</Typography>
                </Stack>
                {analyzing && <CircularProgress size={20} sx={{ color: '#0ABE51' }} />}
              </Box>
              <CardContent sx={{ bgcolor: '#ffffff' }}>
                {loading ? <Skeleton variant="rectangular" height={100} /> : (
                  <Typography variant="body1" sx={{ whiteSpace: 'pre-line', color: '#334155', lineHeight: 1.7, fontSize: '0.95rem' }}>
                    {aiAnalysis || "Aggregating and analyzing real-time data..."}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Core Metrics */}
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="overline" color="text.secondary" fontWeight="bold">Total Order Volume</Typography>
              <Typography variant="h4" fontWeight="bold" color="#0ABE51">
                {timelineData.reduce((acc, curr) => acc + (curr.orders || 0), 0)}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="overline" color="text.secondary" fontWeight="bold">Top Active Region</Typography>
              <Typography variant="h4" fontWeight="bold" color="#2CA9E3">
                {placesData.length > 0 ? [...placesData].sort((a,b) => b.deliveries - a.deliveries)[0]?.city : "..."}
              </Typography>
            </Paper>
          </Grid>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, borderRadius: 3, textAlign: 'center', border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Typography variant="overline" color="text.secondary" fontWeight="bold">Avg. Daily Performance</Typography>
              <Typography variant="h4" fontWeight="bold" color="#FFBB28">
                {timelineData.length > 0 ? (timelineData.reduce((acc, curr) => acc + curr.orders, 0) / timelineData.length).toFixed(1) : 0}
              </Typography>
            </Paper>
          </Grid>

          {/* Main Visualizations */}
          <Grid item xs={12} lg={8}>
            <Paper sx={{ p: 3, borderRadius: 4, height: 400, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <QueryStats sx={{ color: '#0ABE51' }} />
                <Typography variant="h6" fontWeight="bold">Order Growth Timeline</Typography>
              </Stack>
              <ResponsiveContainer width="100%" height="80%">
                <AreaChart data={timelineData}>
                  <defs>
                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ABE51" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#0ABE51" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="orders" stroke="#0ABE51" strokeWidth={3} fill="url(#colorOrders)" />
                </AreaChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 3, borderRadius: 4, height: 400, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
                <Map sx={{ color: '#2CA9E3' }} />
                <Typography variant="h6" fontWeight="bold">Geographical Density</Typography>
              </Stack>
              <ResponsiveContainer width="100%" height="80%">
                <BarChart data={placesData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="city" type="category" axisLine={false} tickLine={false} width={70} tick={{ fontSize: 12 }} />
                  <Tooltip cursor={{fill: 'transparent'}} />
                  <Bar dataKey="deliveries" radius={[0, 4, 4, 0]} barSize={20}>
                    {placesData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}