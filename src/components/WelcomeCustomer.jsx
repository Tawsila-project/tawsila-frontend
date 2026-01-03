import { Box, Paper, Typography } from "@mui/material";
import { motion } from "framer-motion";
import Logo from "../assets/Logo.png";

export default function WelcomeCustomer() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "#f5f7fa",
          padding: 2,
        }}
      >
        <Paper
          elevation={8}
          sx={{
            width: "100%",
            maxWidth: 430,
            padding: 4,
            borderRadius: 4,
            textAlign: "center",
            background: "white",
          }}
        >
          {/* LOGO */}
          <motion.img
            src={Logo}
            alt="Logo"
            style={{
              width: 120,
              height: 120,
              marginBottom: 20,
              borderRadius: 15,
            }}
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />

          {/* TITLE */}
          <Typography
            variant="h5"
            fontWeight="bold"
            color="primary"
            sx={{ mb: 1 }}
          >
            Welcome!
          </Typography>

          {/* SUBTITLE */}
          <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
            We're getting things ready for your delivery request...
          </Typography>

          {/* Loading Animation */}
          <motion.div
            initial={{ opacity: 0.4 }}
            animate={{
              opacity: [0.4, 1, 0.4],
              scale: [1, 1.05, 1],
            }}
            transition={{
              duration: 1.6,
              repeat: Infinity,
            }}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#1976d2",
              margin: "0 auto",
            }}
          />
        </Paper>
      </Box>
    </motion.div>
  );
}
