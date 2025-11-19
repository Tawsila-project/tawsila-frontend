import { Box, Container, Paper } from "@mui/material";

export default function AuthLayout({ children }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #0ABE51 0%, #2CA9E3 100%)",
        p: 2,
      }}
    >
      <Container maxWidth="xs">
        <Paper
          elevation={6}
          sx={{
            p: 4,
            borderRadius: 3,
            animation: "slideUp 0.5s ease",
            bgcolor: "white",
          }}
        >
          {children}
        </Paper>
      </Container>
    </Box>
  );
}
