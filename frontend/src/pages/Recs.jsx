import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

/* helpers de normalização (aceita PT/EN e números como string) */
const n = {
  id: (m) => m?.id ?? m?.movie_id ?? m?.ID,
  title: (m) => m?.titulo ?? m?.title ?? "",
  genre: (m) => m?.genero ?? m?.genre ?? "",
  director: (m) => m?.diretor ?? m?.director ?? "",
  poster: (m) => m?.imagem_s3_url ?? m?.poster ?? m?.capa ?? "",
  avg: (m) => {
    const v = m?.media_nota ?? m?.avg ?? m?.media ?? 0;
    const num = typeof v === "number" ? v : Number(v);
    return Number.isFinite(num) ? num : 0;
  },
  count: (m) => {
    const v = m?.qtd_avaliacoes ?? m?.count ?? m?.total ?? 0;
    const num = typeof v === "number" ? v : Number(v);
    return Number.isFinite(num) ? num : 0;
  },
};

export default function Recs() {
  const [items, setItems] = useState([]);      // <- começa como array vazio
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // pega userId do localStorage (se logado)
  const rawUser = localStorage.getItem("user");
  const userId = (() => {
    try { return rawUser ? JSON.parse(rawUser)?.id ?? null : null; }
    catch { return null; }
  })();

  async function load(signal) {
    try {
      setLoading(true);
      setErr("");
      const params = { limit: 12 };
      if (userId) params.userId = userId;

      const { data } = await api.get("/recommendations", { params, signal });
      setItems(Array.isArray(data) ? data : []);  // <- garante array
    } catch (e) {
      if (e.name === "CanceledError" || e.name === "AbortError") return;
      console.error(e);
      setErr("Falha ao carregar recomendações.");
      setItems([]);                                // <- nunca deixa indefinido
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const list = useMemo(
    () => (Array.isArray(items) ? items : []).map((m) => ({
      id: n.id(m),
      titulo: n.title(m),
      genero: n.genre(m),
      diretor: n.director(m),
      poster: n.poster(m),
      media: n.avg(m),
      qtd: n.count(m),
    })),
    [items]
  );

  return (
    <div className="grid gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recomendações</h1>
        <button className="btn-outline" onClick={() => load()}>
          Recarregar
        </button>
      </div>

      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="aspect-[2/3] bg-zinc-200 rounded-xl mb-3" />
              <div className="h-4 bg-zinc-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-zinc-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : err ? (
        <div className="card bg-red-50 text-red-700">{err}</div>
      ) : list.length === 0 ? (
        /* <- nunca quebra: list é array */
        (
          <div className="card text-zinc-600">
            Nada por aqui ainda. Adicione notas em alguns filmes e recarregue a página.
          </div>
        )
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {list.map((m) => (
            <div key={m.id} className="card overflow-hidden group">
              <Link to={`/movie/${m.id}`} className="block">
                <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden mb-3">
                  {m.poster ? (
                    <img
                      src={m.poster}
                      alt={m.titulo}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                    />
                  ) : (
                    <div className="w-full h-full grid place-items-center text-zinc-500">
                      Sem capa
                    </div>
                  )}
                </div>

                <div className="font-medium">{m.titulo}</div>
                <div className="text-sm text-zinc-600">
                  {m.genero} {m.diretor && <>• {m.diretor}</>}
                </div>

                <div className="mt-2 flex items-center gap-2 text-sm">
                  <AvgStars value={m.media} />
                  <span className="text-zinc-600">
                    {Number.isFinite(m.media) ? m.media.toFixed(1) : "-"} ({m.qtd})
                  </span>
                </div>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* estrelas médias (visual, sem clique) */
function AvgStars({ value = 0, size = 18 }) {
  const v = Number.isFinite(value) ? value : 0;
  const pct = Math.max(0, Math.min(100, (v / 5) * 100));
  const baseStyle = {
    fontSize: `${size}px`,
    lineHeight: 1,
    letterSpacing: "2px",
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }} aria-label={`média ${v.toFixed(1)} de 5`}>
      <div style={{ ...baseStyle, color: "#d1d5db" }}>★★★★★</div>
      <div
        style={{
          ...baseStyle,
          color: "#f59e0b",
          position: "absolute",
          inset: 0,
          width: `${pct}%`,
          overflow: "hidden",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        ★★★★★
      </div>
    </div>
  );
}
