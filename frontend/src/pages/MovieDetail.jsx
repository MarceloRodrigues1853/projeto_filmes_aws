import React, { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import api from "../services/api";

/* normalização (PT/EN) */
const normTitle    = (m) => m?.titulo ?? m?.title ?? "";
const normGenre    = (m) => m?.genero ?? m?.genre ?? "";
const normDirector = (m) => m?.diretor ?? m?.director ?? "";
const normPoster   = (m) => m?.imagem_s3_url ?? m?.poster ?? m?.capa ?? "";
const normAvg      = (m) => m?.media_nota ?? m?.avg ?? m?.media ?? null;
const normCount    = (m) => m?.qtd_avaliacoes ?? m?.count ?? m?.total ?? 0;
const normMine     = (m) => m?.minha_nota ?? m?.user_rating ?? 0;

export default function MovieDetail() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [nota, setNota] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");
  const token = localStorage.getItem("token");

  const load = async (signal) => {
    try {
      setLoading(true);
      setErr("");
      const { data } = await api.get(`/movies/${id}`, { signal }); // base já é /api
      setM(data);
      setNota(normMine(data) || 0);
    } catch (e) {
      if (e.name === "CanceledError" || e.name === "AbortError") return;
      setErr("Falha ao carregar filme.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal);
    return () => ctrl.abort();
  }, [id]);

  const salvarNota = async () => {
    if (!token) return;
    if (!nota) return;
    try {
      setSaving(true);
      await api.put(`/ratings/${id}`, { nota });
      toast("Avaliação salva! ⭐");
      await load();
    } catch (e) {
      alert("Erro ao salvar nota.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card animate-pulse">
          <div className="aspect-[2/3] bg-zinc-200 rounded-xl" />
        </div>
        <div className="md:col-span-2 card animate-pulse">
          <div className="h-6 bg-zinc-200 rounded w-1/3 mb-3" />
          <div className="h-4 bg-zinc-200 rounded w-1/2 mb-2" />
          <div className="h-4 bg-zinc-200 rounded w-1/4" />
        </div>
      </div>
    );
  }
  if (err) return <div className="card bg-red-50 text-red-700">{err}</div>;
  if (!m) return null;

  const poster = normPoster(m);
  const title = normTitle(m);
  const genre = normGenre(m);
  const director = normDirector(m);
  const media = typeof normAvg(m) === "number" ? normAvg(m) : (normAvg(m) ? Number(normAvg(m)) : null);
  const qtd = Number(normCount(m) || 0);

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card">
        <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden">
          {poster ? (
            <img src={poster} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-zinc-500">Sem capa</div>
          )}
        </div>
      </div>

      <div className="md:col-span-2 card">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-zinc-600">
          {genre} {director && <>• {director}</>}
        </p>

        {/* Média + estrelas */}
        <div className="mt-3 flex items-center gap-3">
          <AverageStars value={media ?? 0} size={22} />
          <div className="text-sm text-zinc-700">
            Média: {media != null ? media.toFixed(1) : "-"} ({qtd} avaliações)
          </div>
        </div>

        {/* Avaliação do usuário */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Minha nota</label>

          {token ? (
            <>
              <StarRating value={nota} onChange={setNota} disabled={saving} />
              <button className="btn mt-3" onClick={salvarNota} disabled={!nota || saving}>
                {saving ? "Salvando..." : "Salvar"}
              </button>
            </>
          ) : (
            <div className="text-sm text-zinc-600">
              Faça <Link to="/login" className="underline">login</Link> para avaliar este filme.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/** Estrelas “médias” (preenchimento proporcional, sem clique) */
function AverageStars({ value = 0, size = 20 }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  const baseStyle = {
    fontSize: `${size}px`,
    lineHeight: 1,
    letterSpacing: "2px",
  };
  return (
    <div style={{ position: "relative", display: "inline-block" }} aria-label={`Média ${value.toFixed?.(1) ?? value} de 5`}>
      {/* fundo (cinza) */}
      <div style={{ ...baseStyle, color: "#d1d5db" }}>★★★★★</div>
      {/* frente (amarelo) com clip pela largura */}
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

/** Estrelas “minhas” (clicável, inteira 1..5) */
function StarRating({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => !disabled && onChange(n)}
          className="text-2xl"
          aria-label={`${n} estrela${n > 1 ? "s" : ""}`}
          disabled={disabled}
        >
          <span className={n <= value ? "text-yellow-500" : "text-zinc-300"}>★</span>
        </button>
      ))}
    </div>
  );
}

function toast(msg) {
  const el = document.createElement("div");
  el.textContent = msg;
  el.className =
    "fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl shadow-lg z-50";
  document.body.appendChild(el);
  setTimeout(() => {
    el.remove();
  }, 2200);
}
