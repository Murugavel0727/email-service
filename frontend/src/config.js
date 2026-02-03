// Use localhost for development, environment variable for production
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
export { API_BASE_URL };
console.log("API URL:", API_BASE_URL);
