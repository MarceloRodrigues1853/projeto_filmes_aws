import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";

export default function MovieDetail() {
  const { id } = useParams();
  const [m, setM] = useState(null);
  const [nota, setNota] = useState(0);
  const token = localStorage.getItem("token");

  const load = async () => {
    const { data } = await api.get(`/api/movies/${id}`);
    setM(data);
    setNota(data.minha_nota || 0);
  };
  useEffect(()=>{ load(); }, [id]);

  const salvarNota = async () => {
    if (!token) return alert("Entre para avaliar.");
    if (!nota) return;
    await api.put(`/api/ratings/${id}`, { nota });
    await load();
  };

  if (!m) return <div>Carregando...</div>;

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="card">
        <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden">
          {m.imagem_s3_url && <img src={m.imagem_s3_url} alt={m.titulo} className="w-full h-full object-cover" />}
        </div>
      </div>
      <div className="md:col-span-2 card">
        <h1 className="text-2xl font-bold">{m.titulo}</h1>
        <p className="text-zinc-600">{m.genero} {m.diretor && <>• {m.diretor}</>}</p>

        <div className="mt-3 text-sm text-zinc-700">
          Média: {m.media_nota ?? "-"} ({m.qtd_avaliacoes} avaliações)
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium">Minha nota</label>
          <div className="flex items-center gap-2 mt-1">
            <select value={nota} onChange={e=>setNota(parseInt(e.target.value))} className="w-24 border rounded-lg px-2 py-1" disabled={!token}>
              <option value={0}>-</option>
              {[1,2,3,4,5].map(n=><option key={n} value={n}>{n}</option>)}
            </select>
            <button className="btn" onClick={salvarNota} disabled={!token || !nota}>Salvar</button>
          </div>
        </div>
      </div>
    </div>
  );
}
