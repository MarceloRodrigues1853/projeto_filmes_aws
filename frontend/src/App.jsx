import { Routes, Route, Link, Navigate, Outlet, useNavigate, useLocation } from "react-router-dom";
import Movies from "./pages/Movies";
import MovieDetail from "./pages/MovieDetail";
import Login from "./pages/Login";
import Recs from "./pages/Recs";
import Register from "./pages/Register";
import { useEffect, useState } from "react";
import { initTheme, toggleTheme } from "./theme";
import Layout from "./components/Layout";
import Home from "./pages/Home";

function Nav() {
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const navigate = useNavigate();
  const loc = useLocation();
  const [theme, setTheme] = useState('light');

  useEffect(() => { setTheme(initTheme()); }, []);
  const logout = () => { localStorage.removeItem("user"); localStorage.removeItem("token"); navigate("/login", { replace: true }); };
  const isActive = (path) => loc.pathname === path;
  const onToggleTheme = () => setTheme(toggleTheme());

  return (
    <nav className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 sticky top-0 z-40">
      <div className="container py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold text-zinc-900 dark:text-zinc-100" style={{ fontFamily: "var(--font-display)" }}>🎬 Filmes</Link>
          <Link to="/movies" className={isActive('/movies') ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}>Catálogo</Link>
          <Link to="/recs" className={isActive('/recs') ? "text-zinc-900 dark:text-zinc-100 font-medium" : "text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100"}>Recomendações</Link>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn-outline" type="button" onClick={onToggleTheme} title={theme === 'dark' ? 'Modo claro' : 'Modo escuro'}>
            {theme === 'dark' ? '🌞 Claro' : '🌙 Escuro'}
          </button>
          {user ? (
            <>
              <span className="text-sm text-zinc-600 dark:text-zinc-300">Olá, {user?.nome || user?.name || user?.email}</span>
              <button className="btn-outline" onClick={logout}>Sair</button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login" className="btn">Entrar</Link>
              <Link to="/register" className="btn-outline">Criar conta</Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

function ProtectedRoute() {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <Layout>
      <Nav />
      <div className="container py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/movies" element={<Movies />} />
          <Route path="/movie/:id" element={<MovieDetail />} />
          <Route path="/login" element={<Login onLogin={(u) => { if (u) localStorage.setItem("user", JSON.stringify(u)); }} />} />
          <Route path="/register" element={<Register />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/recs" element={<Recs />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Layout>
  );
}
