import { Routes, Route, Link, Navigate, Outlet, useNavigate } from "react-router-dom";
import Movies from "./Movies";
import MovieDetail from "./MovieDetail";
import Login from "./Login";
import Recs from "./Recs";
import Register from "./Register";

function Nav() {
  const raw = localStorage.getItem("user");
  const user = raw ? JSON.parse(raw) : null;
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <nav className="bg-white border-b">
      <div className="container py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="font-bold">🎬 Filmes</Link>
          <Link to="/recs" className="text-zinc-600 hover:text-zinc-900">Recomendações</Link>
        </div>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="text-sm text-zinc-600">
                Olá, {user?.nome || user?.name || user?.email}
              </span>
              <button className="btn-outline" onClick={logout}>Sair</button>
            </>
          ) : (
            <Link to="/login" className="btn">Entrar</Link>
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
    <div>
      <Nav />
      <div className="container py-6">
        <Routes>
          <Route path="/" element={<Movies />} />
          <Route
            path="/login"
            element={<Login onLogin={(u) => {
              if (u) localStorage.setItem("user", JSON.stringify(u));
            }} />}
          />
          <Route path="/register" element={<Register />} />
          <Route path="/movie/:id" element={<MovieDetail />} />

          <Route element={<ProtectedRoute />}>
            <Route path="/recs" element={<Recs />} />
          </Route>

          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}
