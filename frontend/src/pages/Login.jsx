// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

export default function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState(""); // usar "senha" para a API
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { data } = await api.post("/auth/login", { email, senha }); // <- sem /api
      if (data?.token) localStorage.setItem("token", data.token);
      if (data?.user) localStorage.setItem("user", JSON.stringify(data.user));
      onLogin?.(data.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError("Credenciais inválidas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-100">
      <form onSubmit={handleSubmit} className="card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-bold text-center">🎬 Login</h1>
        {error && <p className="text-red-600 text-sm">{error}</p>}
        <input type="email" placeholder="Email" className="w-full border p-2 rounded"
          value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
        <input type="password" placeholder="Senha" className="w-full border p-2 rounded"
          value={senha} onChange={(e) => setSenha(e.target.value)} required autoComplete="current-password" />
        <button className="btn w-full" type="submit" disabled={loading}>{loading ? 'Entrando...' : 'Entrar'}</button>
      </form>
    </div>
  );
}
