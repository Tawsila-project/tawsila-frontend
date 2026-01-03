import { useState } from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Stack,
} from "@mui/material";

export default function PasswordResetForm({ staff, onSubmit, onClose }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    // Validation checks
    if (newPassword.length < 6) {
      return setFormError("Password must be at least 6 characters.");
    }

    if (newPassword !== confirmPassword) {
      return setFormError("Passwords do not match.");
    }
    
    // Pass the staff ID and the new password to the parent handler
    onSubmit(staff._id, newPassword);
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      p={3}
      sx={{
        width: { xs: "87%", sm: 400 },
        bgcolor: "background.paper",
        mx: "auto",
        mt: { xs: "10vh", sm: "10vh" },
        p: { xs: 2, sm: 3 },
        borderRadius: 2,
      }}
    >
      <Typography variant="h6" mb={2}>
        Reset Password for **{staff.full_name}**
      </Typography>
      <Stack spacing={2}>
        <TextField
          name="newPassword"
          label="New Password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          type="password"
          fullWidth
          required
        />
        <TextField
          name="confirmPassword"
          label="Confirm New Password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          type="password"
          fullWidth
          required
        />
        {formError && <Typography color="error">{formError}</Typography>}
        <Box display="flex" gap={1}>
          <Button variant="contained" type="submit" fullWidth>
            Reset Password
          </Button>
          <Button variant="outlined" onClick={onClose} fullWidth>
            Cancel
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}