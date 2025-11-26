// src/components/RateDelivery.jsx
import { useState } from "react";
import { Box, Paper, Typography, Button, Rating } from "@mui/material";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";

export default function RateDelivery() {
  const navigate = useNavigate();
  const location = useLocation();

  // Read ?orderId=123 from URL
  const searchParams = new URLSearchParams(location.search);
  const orderId = searchParams.get("orderId");

  const [value, setValue] = useState(0);

  const handleSubmit = () => {
    console.log(`Submitting rating ${value} stars for Order #${orderId}`);

    alert(
      `Thank you for rating ${value} star${
        value > 1 ? "s" : ""
      } for Order #${orderId}! Returning to new order form.`
    );

    setValue(0);

    navigate("/");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Paper
        elevation={6}
        sx={{
          maxWidth: 400,
          margin: "40px auto",
          padding: 4,
          borderRadius: 3,
          textAlign: "center",
        }}
      >
        <Typography variant="h5" fontWeight={600} mb={1}>
          Rate Your Delivery
        </Typography>

        {orderId && (
          <Typography variant="body2" color="text.secondary" mb={2}>
            Order #{orderId}
          </Typography>
        )}

        <Rating
          name="delivery-rating"
          value={value}
          onChange={(event, newValue) => setValue(newValue)}
          size="large"
        />

        <Box mt={3}>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#0ABE51",
              "&:hover": { backgroundColor: "#079b3a" },
              py: 1.5,
              fontSize: "1rem",
              borderRadius: 2,
              width: "100%",
            }}
            onClick={handleSubmit}
            disabled={value === 0}
          >
            Submit Rating
          </Button>
        </Box>
      </Paper>
    </motion.div>
  );
}


// // src/components/RateDelivery.jsx
// import { useState } from "react";
// import { Box, Paper, Typography, Button, Rating } from "@mui/material";
// import { motion } from "framer-motion";

// export default function RateDelivery() {
//   const [value, setValue] = useState(0);

//   const handleSubmit = () => {
//     alert(`Thank you for rating ${value} star${value > 1 ? "s" : ""}!`);
//     setValue(0); // reset after submit
//   };

//   return (
//     <motion.div
//       initial={{ opacity: 0, y: 25 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.4 }}
//     >
//       <Paper
//         elevation={6}
//         sx={{
//           maxWidth: 400,
//           margin: "40px auto",
//           padding: 4,
//           borderRadius: 3,
//           textAlign: "center",
//         }}
//       >
//         <Typography variant="h5" fontWeight={600} mb={2}>
//           Rate Your Delivery
//         </Typography>

//         <Rating
//           name="delivery-rating"
//           value={value}
//           onChange={(event, newValue) => {
//             setValue(newValue);
//           }}
//           size="large"
//         />

//         <Box mt={3}>
//           <Button
//             variant="contained"
//             sx={{
//               backgroundColor: "#0ABE51",
//               "&:hover": { backgroundColor: "#079b3a" },
//               paddingY: 1.5,
//               fontSize: "1rem",
//               borderRadius: 2,
//               width: "100%",
//             }}
//             onClick={handleSubmit}
//             disabled={value === 0}
//           >
//             Submit Rating
//           </Button>
//         </Box>
//       </Paper>
//     </motion.div>
//   );
// }
