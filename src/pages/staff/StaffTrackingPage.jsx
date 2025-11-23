// **********************************************
// StaffTrackingPage.jsx — صفحة تتبع السائقين (Staff)
// **********************************************

import { Box, Typography } from "@mui/material";
import DriverTracking from "../../components/staff/DriverTracking"; 
// ⬆️ عدّل المسار حسب موقع ملف DriverTracking

export default function StaffTrackingPage() {
  
  // 🔑 جلب معرف السائق من التخزين المحلي
  const driverId = localStorage.getItem("driverId");

  // يمكنك لاحقاً استبداله بطلب فعلي من الـ API لجلب رقم الطلب النشط
  const currentOrderNumber = null;

  return (
    <Box>
      <Typography variant="h5" mb={3}>
        Tracking Center
      </Typography>

      <DriverTracking 
        orderNumber={currentOrderNumber}
        driverId={driverId}   // 🔑 تمرير معرّف السائق للكومبوننت
      />
    </Box>
  );
}
