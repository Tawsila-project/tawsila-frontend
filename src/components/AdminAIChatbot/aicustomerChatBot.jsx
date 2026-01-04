import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Typography,
  TextField,
  Paper,
  CircularProgress,
  IconButton,
  Drawer,
  Divider,
  Stack,
  Fab,
  Chip,
  Avatar
} from "@mui/material";
import {
  Send,
  Close,
  SupportAgent,
  LocalShipping,
  Map as MapIcon,
  TrackChanges,
  SmartToy
} from "@mui/icons-material";

/**
 * TROUBLESHOOTING YOUR REAL APP:
 * 1. API KEY: In your real app, you MUST replace "" with your actual key from https://aistudio.google.com/
 * 2. CORS: Ensure your browser isn't blocking the request (usually not an issue for this API).
 * 3. QUOTA: Check if your API key has reached its rate limit.
 * 4. NETWORK: Ensure you can reach 'generativelanguage.googleapis.com'.
 */
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

export default function App({ currentOrder = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: "model", 
      parts: [{ text: "Hello! I'm Tawsila's English assistant. How can I help you today?" }] 
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  const suggestions = [
    { label: "How to use the map?", icon: <MapIcon fontSize="small" /> },
    { label: "Track my order", icon: <TrackChanges fontSize="small" /> },
    { label: "Pricing info", icon: <LocalShipping fontSize="small" /> },
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const fetchGeminiResponse = async (history) => {
    // Fallback check for developers
    if (!apiKey && typeof __initial_auth_token === 'undefined') {
      throw new Error("Missing API Key. Please add your Gemini API key to the apiKey constant.");
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    const payload = {
      contents: history,
      systemInstruction: {
        parts: [{
          text: `You are the AI Assistant for Tawsila Logistics. 
          Respond in English only. Professional tone. 
          Help with shipping, map usage, and tracking.`
        }]
      }
    };

    let delay = 1000;
    for (let i = 0; i < 5; i++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok) {
          return data.candidates?.[0]?.content?.parts?.[0]?.text;
        }

        // Handle specific errors
        if (response.status === 403) throw new Error("Invalid API Key or Permission Denied.");
        if (response.status === 404) throw new Error("Model not found or API URL incorrect.");
        
        if (response.status === 429 || response.status >= 500) {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
          continue;
        }

        throw new Error(data.error?.message || "Unknown API Error");
      } catch (err) {
        if (i === 4) throw err;
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      }
    }
  };

  const handleSend = async (textOverride) => {
    const messageText = textOverride || input;
    if (!messageText.trim() || isTyping) return;

    const updatedHistory = [...messages, { role: "user", parts: [{ text: messageText }] }];
    setMessages(updatedHistory);
    setInput("");
    setIsTyping(true);

    try {
      const aiResponse = await fetchGeminiResponse(updatedHistory);
      setMessages(prev => [...prev, { role: "model", parts: [{ text: aiResponse }] }]);
    } catch (error) {
      console.error("Detailed Chat Error:", error);
      setMessages(prev => [...prev, { 
        role: "model", 
        parts: [{ text: `Error: ${error.message}. Please check your API key configuration.` }] 
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" fontWeight="bold">Tawsila Platform</Typography>
      <Typography color="textSecondary">English AI Assistant implementation.</Typography>

      <Fab
        onClick={() => setIsOpen(true)}
        sx={{ position: "fixed", bottom: 24, right: 24, bgcolor: "#2CA9E3", color: "white" }}
      >
        <SupportAgent />
      </Fab>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 400 }, display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{ p: 2, bgcolor: "#2CA9E3", color: "white", display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Avatar sx={{ bgcolor: 'white', color: '#2CA9E3' }}><SmartToy /></Avatar>
            <Typography variant="subtitle1" fontWeight="bold">Tawsila AI</Typography>
          </Stack>
          <IconButton onClick={() => setIsOpen(false)} color="inherit"><Close /></IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto", bgcolor: "#f0f2f5", display: 'flex', flexDirection: 'column', gap: 2 }} ref={scrollRef}>
          {messages.map((msg, i) => (
            <Box key={i} sx={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "85%" }}>
              <Paper sx={{ p: 1.5, bgcolor: msg.role === "user" ? "#2CA9E3" : "white", color: msg.role === "user" ? "white" : "#333", borderRadius: 2 }}>
                <Typography variant="body2">{msg.parts[0].text}</Typography>
              </Paper>
            </Box>
          ))}
          {isTyping && <CircularProgress size={20} sx={{ m: 1 }} />}
        </Box>

        <Box sx={{ p: 1, display: 'flex', gap: 1, overflowX: 'auto' }}>
          {suggestions.map((s) => (
            <Chip key={s.label} label={s.label} onClick={() => handleSend(s.label)} clickable size="small" />
          ))}
        </Box>

        <Box sx={{ p: 2, display: "flex", gap: 1, bgcolor: 'white' }}>
          <TextField
            fullWidth
            size="small"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
            placeholder="Ask me anything..."
          />
          <IconButton color="primary" onClick={() => handleSend()} disabled={!input.trim() || isTyping}>
            <Send />
          </IconButton>
        </Box>
      </Drawer>
    </Box>
  );
}