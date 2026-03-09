import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  withXSRFToken: true,
  headers: {
    Accept: "application/json",
  },
});

// Auto-set Content-Type: let Axios handle FormData (multipart boundary),
// default to application/json for plain objects.
api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  } else if (!config.headers["Content-Type"]) {
    config.headers["Content-Type"] = "application/json";
  }
  return config;
});

// Get CSRF cookie before making stateful requests
export async function getCsrfCookie() {
  await api.get("/sanctum/csrf-cookie");
}

// Interceptor: on 401, redirect to login
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      typeof window !== "undefined" &&
      !window.location.pathname.startsWith("/login")
    ) {
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
