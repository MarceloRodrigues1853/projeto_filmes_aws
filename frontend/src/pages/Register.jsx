// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.post('/auth/register', { nome, email, senha }); // <- sem /api
      alert('Conta criada! Faça login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-bold mb-4">Criar Conta</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        <input type="text" placeholder="Nome" value={nome} onChange={(e) => setNome(e.target.value)} required />
        <input type="email" placeholder="E-mail" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input type="password" placeholder="Senha" value={senha} onChange={(e) => setSenha(e.target.value)} required />
        <button type="submit" className="btn" disabled={loading}>{loading ? 'Enviando...' : 'Cadastrar'}</button>
      </form>
      <p className="text-center mt-4 text-sm">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-sky-600 hover:underline">Faça login</Link>
      </p>
    </div>
  );
}
