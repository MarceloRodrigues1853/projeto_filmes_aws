// src/pages/Movies.jsx
import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const PAGE_SIZE = 8;

export default function Movies() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [form, setForm] = useState({ titulo: '', genero: '', diretor: '' });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const token = localStorage.getItem('token');

  // filtros/ordenação/paginação
  const [q, setQ] = useState('');
  const [genreFilter, setGenreFilter] = useState('');
  const [sort, setSort] = useState('recent'); // recent|title|genre
  const [page, setPage] = useState(1);

  const fetchMovies = async () => {
    try {
      setLoading(true);
      setErr('');
      const { data } = await api.get('/movies'); // <- sem /api
      setList(data || []);
    } catch (error) {
      setErr('Falha ao carregar filmes.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMovies(); }, []);

  const genres = useMemo(() => {
    const s = new Set();
    list.forEach(m => m.genero && s.add(m.genero));
    return ['Todos', ...Array.from(s)];
  }, [list]);

  const filtered = useMemo(() => {
    let out = [...list];
    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter(m =>
        m.titulo?.toLowerCase().includes(qq) ||
        m.diretor?.toLowerCase().includes(qq) ||
        m.genero?.toLowerCase().includes(qq)
      );
    }
    if (genreFilter && genreFilter !== 'Todos') {
      out = out.filter(m => m.genero === genreFilter);
    }
    if (sort === 'title') {
      out.sort((a,b)=> a.titulo.localeCompare(b.titulo));
    } else if (sort === 'genre') {
      out.sort((a,b)=> (a.genero||'').localeCompare(b.genero||''));
    } else {
      // recent: por criado_em desc (ou id desc)
      out.sort((a,b)=> new Date(b.criado_em||0) - new Date(a.criado_em||0) || b.id - a.id);
    }
    return out;
  }, [list, q, genreFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filtered.slice(start, start + PAGE_SIZE);
  }, [filtered, page]);

  useEffect(()=>{ setPage(1); }, [q, genreFilter, sort]);

  const handleFile = (f) => {
    setFile(f);
    if (f) {
      const url = URL.createObjectURL(f);
      setPreview(url);
    } else {
      setPreview('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return alert("Entre para adicionar.");
    if (!form.titulo.trim()) return alert("Informe o título.");
    if (!file) return alert("Selecione uma imagem de capa.");

    const formData = new FormData();
    formData.append('titulo', form.titulo);
    formData.append('genero', form.genero);
    formData.append('diretor', form.diretor);
    formData.append('imagem', file);

    try {
      await api.post('/movies', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ titulo: '', genero: '', diretor: '' });
      handleFile(null);
      e.target.reset();
      await fetchMovies();
      toast('Filme adicionado com sucesso! ✅');
    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar filme.');
    }
  };

  const onDelete = async (id) => {
    if (!token) return alert("Entre para excluir.");
    if (!confirm('Tem certeza que deseja excluir este filme?')) return;
    try {
      await api.delete(`/movies/${id}`);
      setList((prev)=> prev.filter(x=> x.id !== id));
      toast('Filme excluído. 🗑️');
    } catch (e) {
      console.error(e);
      alert('Falha ao excluir.');
    }
  };

  return (
    <div className="grid gap-6">
      {/* Formulário */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Adicionar Filme</h2>
        {!token && <p className="text-sm text-zinc-600 mb-2">Faça login para adicionar filmes.</p>}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium">Título</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required disabled={!token} />
          </div>
          <div>
            <label className="block text-sm font-medium">Gênero</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} placeholder="Ação, Ficção..." disabled={!token} />
          </div>
          <div>
            <label className="block text-sm font-medium">Diretor</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.diretor} onChange={e => setForm({ ...form, diretor: e.target.value })} disabled={!token} />
          </div>
          <div className="md:col-span-4 flex items-center gap-3 flex-wrap">
            <input type="file" accept="image/*" onChange={e => handleFile(e.target.files?.[0] || null)} disabled={!token} required />
            {preview && (
              <div className="flex items-center gap-2">
                <img alt="preview" src={preview} className="h-16 w-12 object-cover rounded" />
                <button type="button" className="btn-outline" onClick={()=>handleFile(null)}>Remover imagem</button>
              </div>
            )}
            <button className="btn ml-auto" type="submit" disabled={!token}>Salvar</button>
          </div>
        </form>
      </div>

      {/* Barra de ferramentas */}
      <div className="card flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
        <div className="flex gap-2">
          <input
            placeholder="Buscar por título, diretor, gênero..."
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            className="border rounded-lg px-3 py-2 w-full md:w-96"
          />
          <select value={genreFilter} onChange={(e)=>setGenreFilter(e.target.value)} className="border rounded-lg px-3 py-2">
            {genres.map(g => <option key={g} value={g}>{g}</option>)}
          </select>
          <select value={sort} onChange={(e)=>setSort(e.target.value)} className="border rounded-lg px-3 py-2">
            <option value="recent">Mais recentes</option>
            <option value="title">Título (A→Z)</option>
            <option value="genre">Gênero (A→Z)</option>
          </select>
        </div>
        <div className="text-sm text-zinc-600">Total: {filtered.length}</div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({length:8}).map((_,i)=>(
            <div key={i} className="card animate-pulse">
              <div className="aspect-[2/3] bg-zinc-200 rounded-xl mb-3" />
              <div className="h-4 bg-zinc-200 rounded w-2/3 mb-2" />
              <div className="h-3 bg-zinc-200 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : err ? (
        <div className="card bg-red-50 text-red-700">{err}</div>
      ) : filtered.length === 0 ? (
        <div className="card text-zinc-600">Nenhum filme encontrado. Tente limpar os filtros ou busque outro termo.</div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {pageItems.map(m => (
              <div key={m.id} className="card overflow-hidden group">
                <Link to={`/movie/${m.id}`} className="block">
                  <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden mb-3">
                    {m.imagem_s3_url
                      ? <img src={m.imagem_s3_url} alt={m.titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                      : <div className="w-full h-full grid place-items-center text-zinc-500">Sem capa</div>}
                  </div>
                  <div className="font-medium">{m.titulo}</div>
                  <div className="text-sm text-zinc-600">
                    {m.genero} {m.diretor && <>• {m.diretor}</>}
                  </div>
                </Link>
                {token && (
                  <div className="mt-3">
                    <button className="btn-outline w-full" onClick={()=>onDelete(m.id)}>Excluir</button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Paginação */}
          <div className="flex items-center justify-center gap-2 mt-4">
            <button className="btn-outline" disabled={page<=1} onClick={()=>setPage(p=>p-1)}>Anterior</button>
            <span className="text-sm">Página {page} de {totalPages}</span>
            <button className="btn-outline" disabled={page>=totalPages} onClick={()=>setPage(p=>p+1)}>Próxima</button>
          </div>
        </>
      )}
    </div>
  );
}

// mini-toast simples (sem lib)
function toast(msg){
  const el = document.createElement('div');
  el.textContent = msg;
  el.className = 'fixed bottom-4 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl shadow-lg z-50';
  document.body.appendChild(el);
  setTimeout(()=>{ el.remove(); }, 2200);
}
