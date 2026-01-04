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
  Tooltip
} from "@mui/material";
import {
  Send,
  Close,
  SupportAgent,
  LocalShipping,
  HelpOutline
} from "@mui/icons-material";

// API Configuration
const apiKey = ""; 
const GEMINI_MODEL = "gemini-2.5-flash-preview-09-2025";

/**
 * Knowledge Base: Add your company details here
 * This is how you "Train" the bot without actual coding.
 */
const COMPANY_KNOWLEDGE = `
- Business Name: Tawsila Logistics.
- Services: Same-day delivery, International shipping, and Furniture moving.
- Delivery Time: Local deliveries take 2-4 hours. Inter-city takes 24 hours.
- Tracking: Users can track orders using their Order Number in the "Track Order" page.
- How to use the map: Click anywhere on the map to set the pin, or use "Use My Location" for GPS accuracy.
- Support Hours: 24/7.
- Items Not Allowed: Dangerous chemicals, illegal substances, and fragile glass without insurance.
`;

export default function CustomerAIChat({ currentOrder = null }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { 
      role: "assistant", 
      text: "Hello! I'm your Tawsila shatBot assistant. I can help you fill out your delivery request or track an existing order. How can I assist you today?" 
    }
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchWithRetry = async (userPrompt, retries = 5, delay = 1000) => {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
    
    // The "Training" happens here in the System Instruction
    const payload = {
      contents: [{ parts: [{ text: userPrompt }] }],
      systemInstruction: {
        parts: [{ 
          text: `
          You are the official Customer Support AI for SwiftShip Logistics.
          
          OUR BUSINESS CONTEXT:
          ${COMPANY_KNOWLEDGE}

          USER'S CURRENT DATA:
          ${currentOrder ? `The user just submitted an order: ${JSON.stringify(currentOrder)}` : "User hasn't submitted an order yet."}

          GUIDELINES:
          1. Be empathetic and professional.
          2. If the user asks about their order, refer to the Order Number if available.
          3. If the user is struggling with the map, explain: "Just tap on your house on the map or drag the blue marker."
          4. If you don't know an answer, ask them to contact our human support at 1-800-SWIFT.
          5. Keep answers under 3 sentences unless explaining a process.
          6. Always respond in English.
          ` 
        }]
      }
    };

    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (response.ok) return await response.json();
        if (response.status === 429 || response.status >= 500) {
          await new Promise(res => setTimeout(res, delay));
          delay *= 2;
          continue;
        }
        break;
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      }
    }
    throw new Error("Failed to connect.");
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = { role: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    const currentInput = input;
    setInput("");
    setIsTyping(true);

    try {
      const data = await fetchWithRetry(currentInput);
      const aiText = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm here to help, but I didn't catch that. Could you repeat?";
      setMessages((prev) => [...prev, { role: "assistant", text: aiText }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: "assistant", text: "I'm temporarily offline. Please try again in a moment." }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <Tooltip title="Chat with Support" placement="left">
        <Fab
          onClick={() => setIsOpen(true)}
          sx={{ 
            position: "fixed", bottom: 30, right: 30, zIndex: 1000, 
            bgcolor: "#2CA9E3", color: "white",
            '&:hover': { bgcolor: '#1e86b8' }
          }}
        >
          <SupportAgent />
        </Fab>
      </Tooltip>

      <Drawer
        anchor="right"
        open={isOpen}
        onClose={() => setIsOpen(false)}
        PaperProps={{ sx: { width: { xs: "100%", sm: 400 }, display: "flex", flexDirection: "column" } }}
      >
        <Box sx={{ p: 2, bgcolor: "#2CA9E3", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <LocalShipping />
            <Typography variant="subtitle1" fontWeight="bold">TawsilaChatBot Support</Typography>
          </Stack>
          <IconButton onClick={() => setIsOpen(false)} color="inherit"><Close /></IconButton>
        </Box>

        <Box sx={{ flexGrow: 1, p: 2, overflowY: "auto", bgcolor: "#f8fafc", display: 'flex', flexDirection: 'column', gap: 2 }} ref={scrollRef}>
          {messages.map((msg, index) => (
            <Box key={index} sx={{ display: "flex", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
              <Paper sx={{
                p: 1.5, maxWidth: "85%",
                bgcolor: msg.role === "user" ? "#2CA9E3" : "white",
                color: msg.role === "user" ? "white" : "#1e293b",
                borderRadius: 2,
                boxShadow: 1
              }}>
                <Typography variant="body2">{msg.text}</Typography>
              </Paper>
            </Box>
          ))}
          {isTyping && <CircularProgress size={20} sx={{ m: 1 }} />}
        </Box>

        <Divider />
        <Box sx={{ p: 2, display: "flex", gap: 1 }}>
          <TextField
            fullWidth size="small"
            placeholder="How do I track my order?"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSend()}
          />
          <IconButton color="primary" onClick={handleSend} disabled={!input.trim()}><Send /></IconButton>
        </Box>
      </Drawer>
    </>
  );
}