import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Recs() {
  const [data, setData] = useState({ genres: [], recommendations: [] });
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  useEffect(() => {
    // se não tiver token, não chama a API
    if (!token) {
      setLoading(false);
      return;
    }
    (async () => {
      try {
        setLoading(true);
        setErr("");
        const { data } = await api.get("/recommendations");
        setData(data || { genres: [], recommendations: [] });
      } catch (error) {
        // 401 → estado amigável ao invés de “Falha…”
        if (error?.response?.status === 401) {
          setErr("auth"); // flag especial
        } else {
          setErr("generic");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // estado “não logado”
  if (!token) {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Recomendações</h2>
        <p className="text-zinc-600 mb-3">Entre para ver suas recomendações personalizadas.</p>
        <div className="flex gap-2">
          <Link to="/login" className="btn">Entrar</Link>
          <Link to="/register" className="btn-outline">Criar conta</Link>
        </div>
      </div>
    );
  }

  // loading
  if (loading) {
    return (
      <div className="grid gap-6">
        <div className="card">
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <span key={i} className="px-10 py-3 rounded-full bg-zinc-200 animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[2/3] bg-zinc-200 rounded-xl mb-3" />
              <div className="h-4 bg-zinc-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-zinc-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // erro 401 (token inválido/expirado)
  if (err === "auth") {
    return (
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Sessão expirada</h2>
        <p className="text-zinc-600 mb-3">Faça login novamente para ver suas recomendações.</p>
        <Link to="/login" className="btn">Entrar</Link>
      </div>
    );
  }

  // erro genérico
  if (err === "generic") {
    return <div className="card bg-red-50 text-red-700">Não foi possível carregar recomendações.</div>;
  }

  // ok
  return (
    <div className="grid gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Seus gêneros preferidos</h2>
        <div className="flex flex-wrap gap-2">
          {data.genres.length === 0
            ? <div className="text-sm text-zinc-600">Avalie filmes para ver seus gêneros preferidos.</div>
            : data.genres.map((g, i) => (
                <span key={i} className="px-3 py-1 rounded-full bg-zinc-200 text-sm">
                  {g.genero} ({Number(g.media).toFixed(1)})
                </span>
              ))
          }
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-2">Recomendações para você</h2>
      {data.recommendations.length === 0 ? (
        <div className="card text-zinc-600">Sem recomendações por enquanto. Avalie mais filmes!</div>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {data.recommendations.map((m) => (
            <div key={m.id} className="card">
              <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden mb-3">
                {m.imagem_s3_url
                  ? <img src={m.imagem_s3_url} alt={m.titulo} className="w-full h-full object-cover" />
                  : <div className="w-full h-full grid place-items-center text-zinc-500">Sem capa</div>}
              </div>
              <div className="font-medium">{m.titulo}</div>
              <div className="text-sm text-zinc-600">
                {m.genero} {m.diretor && <>• {m.diretor}</>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
