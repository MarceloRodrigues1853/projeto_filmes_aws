import axios from "axios";

const normalize = (v) => (v || "").replace(/\/+$/, "");
const PRIMARY_BASE =
  normalize(import.meta.env.VITE_API_URL) || "http://127.0.0.1:8080/api";

const FALLBACKS = ["http://127.0.0.1:8080/api", "http://localhost:8080/api"]
  .map(normalize)
  .filter((b) => b !== PRIMARY_BASE);

const api = axios.create({
  baseURL: PRIMARY_BASE,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) (config.headers ??= {}).Authorization = `Bearer ${token}`;
  if (config.url && !/^https?:\/\//i.test(config.url)) {
    config.url = config.url.startsWith("/") ? config.url : `/${config.url}`;
  }
  return config;
});

api.interceptors.response.use(
  (r) => r,
  async (err) => {
    const { response, config } = err;

    if (response?.status === 401) {
      try { localStorage.clear(); } catch {}
      if (window.location.pathname !== "/login") window.location.href = "/login";
      return Promise.reject(err);
    }

    const isNetwork =
      err.code === "ERR_NETWORK" || !response ||
      err.message?.toLowerCase?.().includes("network") ||
      err.message?.toLowerCase?.().includes("timeout");

    if (isNetwork && config && !config.__triedFallback) {
      const nextBase = FALLBACKS.find(
        (b) => b && b !== (config.baseURL || api.defaults.baseURL)
      );
      if (nextBase) {
        config.__triedFallback = true;
        config.baseURL = nextBase;
        return api(config);
      }
    }

    return Promise.reject(err);
  }
);

export default api;
