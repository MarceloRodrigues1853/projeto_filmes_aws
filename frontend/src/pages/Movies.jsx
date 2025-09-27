import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';

export default function Movies() {
  const [list, setList] = useState([]);
  const [form, setForm] = useState({ titulo: '', genero: '', diretor: '' });
  const [file, setFile] = useState(null);
  const token = localStorage.getItem('token');

  const fetchMovies = async () => {
    try {
      const { data } = await api.get('/api/movies');
      setList(data);
    } catch (error) {
      console.error("Failed to fetch movies:", error);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      alert("Please log in to add a movie.");
      return;
    }
    if (!file) {
      alert("Please select a cover image.");
      return;
    }

    const formData = new FormData();
    formData.append('titulo', form.titulo);
    formData.append('genero', form.genero);
    formData.append('diretor', form.diretor);
    formData.append('imagem', file);

    try {
      await api.post('/api/movies', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      alert('Movie added successfully!');
      setForm({ titulo: '', genero: '', diretor: '' });
      setFile(null);
      e.target.reset(); // Resets the form fields, including the file input
      fetchMovies(); // Reloads the movie list
    } catch (error) {
      console.error('Error adding movie:', error);
      alert('Failed to add movie. Check the console.');
    }
  };

  return (
    <div className="grid gap-6">
      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Adicionar Filme</h2>
        {!token && <p className="text-sm text-zinc-600 mb-2">Log in to add movies.</p>}
        <form onSubmit={handleSubmit} className="grid md:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-sm font-medium">Titulo</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} required disabled={!token} />
          </div>
          <div>
            <label className="block text-sm font-medium">Genero</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.genero} onChange={e => setForm({ ...form, genero: e.target.value })} placeholder="Action, Sci-Fi..." disabled={!token} />
          </div>
          <div>
            <label className="block text-sm font-medium">Diretor</label>
            <input className="mt-1 w-full border rounded-lg px-3 py-2"
              value={form.diretor} onChange={e => setForm({ ...form, diretor: e.target.value })} disabled={!token} />
          </div>
          <div className="md:col-span-4 flex items-center gap-3">
            <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} disabled={!token} required />
            <button className="btn" type="submit" disabled={!token}>Save</button>
          </div>
        </form>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {list.map(m => (
          <Link to={`/movie/${m.id}`} key={m.id} className="card">
            <div className="aspect-[2/3] bg-zinc-200 rounded-xl overflow-hidden mb-3">
              {m.imagem_s3_url
                ? <img src={m.imagem_s3_url} alt={m.titulo} className="w-full h-full object-cover" />
                : <div className="w-full h-full grid place-items-center text-zinc-500">No cover</div>}
            </div>
            <div className="font-medium">{m.titulo}</div>
            <div className="text-sm text-zinc-600">
              {m.genero} {m.diretor && <>• {m.diretor}</>}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}