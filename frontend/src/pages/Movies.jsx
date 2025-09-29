import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

const PAGE_SIZE = 8;

/* helpers de normalização (aceita PT/EN) */
const normId       = (m) => m.id ?? m.ID ?? m.movie_id ?? m.film_id;
const normTitle    = (m) => m.titulo ?? m.title ?? '';
const normGenre    = (m) => m.genero ?? m.genre ?? '';
const normDirector = (m) => m.diretor ?? m.director ?? '';
const normPoster   = (m) => m.imagem_s3_url ?? m.poster ?? m.capa ?? '';
const normCreated  = (m) => m.criado_em ?? m.created_at ?? m.createdAt ?? 0;

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

  const fetchMovies = async (signal) => {
    try {
      setLoading(true);
      setErr('');
      const { data } = await api.get('/movies', { signal }); // base já é /api
      setList(Array.isArray(data) ? data : []);
    } catch (error) {
      if (error.name === 'CanceledError' || error.name === 'AbortError') return;
      setErr('Falha ao carregar filmes.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const ctrl = new AbortController();
    fetchMovies(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  const genres = useMemo(() => {
    const s = new Set();
    list.forEach(m => {
      const g = normGenre(m);
      if (g) s.add(g);
    });
    return ['Todos', ...Array.from(s)];
  }, [list]);

  const filtered = useMemo(() => {
    let out = [...list];

    if (q.trim()) {
      const qq = q.toLowerCase();
      out = out.filter(m =>
        normTitle(m).toLowerCase().includes(qq) ||
        normDirector(m).toLowerCase().includes(qq) ||
        normGenre(m).toLowerCase().includes(qq)
      );
    }

    if (genreFilter && genreFilter !== 'Todos') {
      out = out.filter(m => normGenre(m) === genreFilter);
    }

    if (sort === 'title') {
      out.sort((a,b)=> normTitle(a).localeCompare(normTitle(b)));
    } else if (sort === 'genre') {
      out.sort((a,b)=> normGenre(a).localeCompare(normGenre(b)));
    } else {
      out.sort((a,b)=> new Date(normCreated(b)) - new Date(normCreated(a)) || (normId(b) - normId(a)));
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
    if (preview) URL.revokeObjectURL(preview);
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : '');
  };

  useEffect(() => {
    return () => { if (preview) URL.revokeObjectURL(preview); };
  }, [preview]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (!form.titulo.trim()) return alert("Informe o título.");
    if (!file) return alert("Selecione uma imagem de capa.");

    const formData = new FormData();
    // nomes PT
    formData.append('titulo', form.titulo);
    formData.append('genero', form.genero);
    formData.append('diretor', form.diretor);
    formData.append('imagem', file);
    // fallback EN
    formData.append('title', form.titulo);
    formData.append('genre', form.genero);
    formData.append('director', form.diretor);
    formData.append('poster', file);

    try {
      await api.post('/movies', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setForm({ titulo: '', genero: '', diretor: '' });
      handleFile(null);
      e.target.reset?.();
      await fetchMovies();
      toast('Filme adicionado com sucesso! ✅');
    } catch (error) {
      console.error(error);
      alert('Erro ao adicionar filme.');
    }
  };

  const onDelete = async (id) => {
    if (!token) return;
    if (!confirm('Tem certeza que deseja excluir este filme?')) return;
    try {
      await api.delete(`/movies/${id}`);
      setList((prev)=> prev.filter(x=> normId(x) !== id));
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

        {!token && (
          <p className="text-sm text-zinc-600 mb-2">
            Faça <Link to="/login" className="underline">login</Link> para adicionar filmes.
          </p>
        )}

        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium">Título</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.titulo}
              onChange={e => setForm({ ...form, titulo: e.target.value })}
              required
              disabled={!token}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Gênero</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.genero}
              onChange={e => setForm({ ...form, genero: e.target.value })}
              placeholder="Ação, Ficção..."
              disabled={!token}
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Diretor</label>
            <input
              className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.diretor}
              onChange={e => setForm({ ...form, diretor: e.target.value })}
              disabled={!token}
            />
          </div>
          <div className="md:col-span-4 flex items-center gap-3 flex-wrap">
            <input
              type="file"
              accept="image/*"
              onChange={e => handleFile(e.target.files?.[0] || null)}
              disabled={!token}
              required={!!token}
            />
            {preview && (
              <div className="flex items-center gap-2">
                <img alt="preview" src={preview} className="h-16 w-12 object-cover rounded" />
                <button type="button" className="btn-outline" onClick={()=>handleFile(null)}>
                  Remover imagem
                </button>
              </div>
            )}

            <div className="ml-auto">
              {token ? (
                <button className="btn" type="submit">Salvar</button>
              ) : (
                <Link className="btn-outline" to="/login">Entrar para adicionar</Link>
              )}
            </div>
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
            {pageItems.map(m => {
              const id = normId(m);
              const titulo = normTitle(m);
              const genero = normGenre(m);
              const diretor = normDirector(m);
              const img = normPoster(m);
              return (
                <div key={id} className="card overflow-hidden group">
                  <Link to={`/movie/${id}`} className="block">
                    <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden mb-3">
                      {img
                        ? <img src={img} alt={titulo} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" />
                        : <div className="w-full h-full grid place-items-center text-zinc-500">Sem capa</div>}
                    </div>
                    <div className="font-medium">{titulo}</div>
                    <div className="text-sm text-zinc-600">
                      {genero} {diretor && <>• {diretor}</>}
                    </div>
                  </Link>
                  {token && (
                    <div className="mt-3">
                      <button className="btn-outline w-full" onClick={()=>onDelete(id)}>Excluir</button>
                    </div>
                  )}
                </div>
              );
            })}
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
