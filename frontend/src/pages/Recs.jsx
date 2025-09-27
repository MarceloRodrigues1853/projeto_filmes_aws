// Arquivo: Recs.jsx (anteriormente Recommendations.jsx)

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

export default function Recs() { // Nome do componente atualizado para Recs
  const [data, setData] = useState({ genres: [], recommendations: [] });

  useEffect(()=>{
    (async ()=>{
      try {
        const { data } = await api.get("/recommendations"); // Rota ajustada para /recommendations
        setData(data);
      } catch (error) {
        console.error("Erro ao buscar recomendações:", error);
        // Opcional: Adicionar feedback de erro para o usuário
      }
    })();
  },[]);

  return (
    <div className="grid gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-2">Seus gêneros preferidos</h2>
        <div className="flex flex-wrap gap-2">
          {data.genres.length === 0 && <div className="text-sm text-zinc-600">Avalie filmes para ver seus gêneros preferidos.</div>}
          {data.genres.map((g,i)=>(
            <span key={i} className="px-3 py-1 rounded-full bg-zinc-200 text-sm">
              {g.genero} ({Number(g.media).toFixed(1)})
            </span>
          ))}
        </div>
      </div>

      <h2 className="text-xl font-semibold mt-4">Recomendações para você</h2>
      {data.recommendations.length === 0 && <div className="text-zinc-600">Não há recomendações no momento. Assista e avalie mais filmes!</div>}
      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {data.recommendations.map(m=>(
          <Link to={`/movie/${m.id}`} key={m.id} className="card">
            <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden mb-3">
              {m.imagem_s3_url
                ? <img src={m.imagem_s3_url} alt={m.titulo} className="w-full h-full object-cover"/>
                : <div className="w-full h-full grid place-items-center text-zinc-500">Sem capa</div>}
            </div>
            <div className="font-medium">{m.titulo}</div>
            <div className="text-sm text-zinc-600">{m.genero} {m.diretor && <>• {m.diretor}</>}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}