// src/pages/MovieDetail.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function MovieDetail() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [nota, setNota] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const token = localStorage.getItem("token");

  const load = async () => {
    try {
      setLoading(true);
      setErr('');
      const { data } = await api.get(`/movies/${id}`); // <- sem /api
      setM(data);
      setNota(data.minha_nota || 0);
    } catch (e) {
      setErr('Falha ao carregar filme.');
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ load(); }, [id]);

  const salvarNota = async () => {
    if (!token) return alert("Entre para avaliar.");
    if (!nota) return;
    try {
      setSaving(true);
      await api.put(`/ratings/${id}`, { nota });
      toast('Avaliação salva! ⭐');
      await load();
    } catch (e) {
      alert('Erro ao salvar nota.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="grid md:grid-cols-3 gap-6">
        <div className="card animate-pulse"><div className="aspect-[2/3] bg-zinc-200 rounded-xl" /></div>
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

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card">
        <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden">
          {m.imagem_s3_url
            ? <img src={m.imagem_s3_url} alt={m.titulo} className="w-full h-full object-cover" />
            : <div className="w-full h-full grid place-items-center text-zinc-500">Sem capa</div>}
        </div>
      </div>
      <div className="md:col-span-2 card">
        <h1 className="text-2xl font-bold">{m.titulo}</h1>
        <p className="text-zinc-600">{m.genero} {m.diretor && <>• {m.diretor}</>}</p>

        <div className="mt-3 text-sm text-zinc-700">
          Média: {m.media_nota ?? "-"} ({m.qtd_avaliacoes} avaliações)
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium mb-1">Minha nota</label>
          <StarRating value={nota} onChange={setNota} disabled={!token || saving} />
          <button className="btn mt-3" onClick={salvarNota} disabled={!token || !nota || saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  );
}

function StarRating({ value, onChange, disabled }) {
  return (
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(n => (
        <button
          key={n}
          type="button"
          onClick={()=>!disabled && onChange(n)}
          className="text-2xl"
          aria-label={`${n} estrela${n>1?'s':''}`}
          disabled={disabled}
        >
          <span className={n <= value ? 'text-yellow-500' : 'text-zinc-300'}>★</span>
        </button>
      ))}
    </div>
  );
}

function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl shadow-lg z-50';
  document.body.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 2200);
}
