import axios from "axios";

// Define a baseURL: usa a variável de ambiente do Vite se existir,
// senão, usa o caminho relativo '/api' como padrão para produção.
const baseURL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: baseURL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});

// Interceptor para adicionar o token JWT em todas as requisições
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para tratar erros, especialmente o 401 (Não Autorizado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Se o erro for 401, limpa o localStorage e redireciona para a página de login
    if (error.response?.status === 401) {
      localStorage.clear();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export default api;