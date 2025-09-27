import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function Register() {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // O nome da coluna no seu DB é `senha_hash`, mas a API deve receber `senha`
    const payload = { nome, email, senha };

    try {
      // Esta chamada POST vai para a rota em `auth.routes.js`
      await api.post('/api/auth/register', payload); 
      alert('Usuário cadastrado com sucesso! Você será redirecionado para o login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao cadastrar. Tente novamente.');
    }
  };

  return (
    <div className="max-w-md mx-auto card">
      <h1 className="text-2xl font-bold mb-4">Criar Conta</h1>
      <form onSubmit={handleSubmit} className="grid gap-4">
        {error && <div className="p-3 bg-red-100 text-red-700 rounded-md">{error}</div>}
        <input
          type="text"
          placeholder="Nome"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required
        />
        <button type="submit" className="btn">Cadastrar</button>
      </form>
      <p className="text-center mt-4 text-sm">
        Já tem uma conta?{' '}
        <Link to="/login" className="text-sky-600 hover:underline">
          Faça login
        </Link>
      </p>
    </div>
  );
}