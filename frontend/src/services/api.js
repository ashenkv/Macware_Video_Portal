
import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api", 
});


API.interceptors.request.use((req) => {
  const token = localStorage.getItem("token");
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

API.interceptors.response.use(
  (response) => {
    console.log("API Response received:", {
      url: response.config.url,
      status: response.status,
      dataLength: JSON.stringify(response.data).length,
      dataPreview: JSON.stringify(response.data).substring(0, 200),
    });
    return response;
  },
  (error) => {
    console.error("API Error:", error);
    return Promise.reject(error);
  }
);

export default API;
