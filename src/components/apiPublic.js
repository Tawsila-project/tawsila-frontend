// apiPublic.js
import axios from "axios";

const apiPublic = axios.create({
  baseURL: "https://tawsila-backend-0shs.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default apiPublic;
