import axios from "axios";

const apiUrl = `${process.env.REACT_APP_API_URL}/api`;

const getToken = () => localStorage.getItem("auth_token");

const axiosInstance = axios.create({
  baseURL: apiUrl,
  withCredentials:true
});

// Attach token to every request
// axiosInstance.interceptors.request.use((config) => {
//   const token = getToken();
//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }
//   return config;
// });

export default axiosInstance;
