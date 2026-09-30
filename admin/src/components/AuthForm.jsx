import { useState } from 'react';
import { api, setToken } from '../api.js';

export default function AuthForm({ onAuthed }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { token, user } = await api(`/auth/${mode}`, { method: 'POST', body: { email, password } });
      setToken(token);
      onAuthed(user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto mt-24 bg-white p-6 rounded-lg shadow">
      <h1 className="text-lg font-semibold mb-4">T-World Admin</h1>
      <form onSubmit={submit} className="space-y-3">
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="email" placeholder="Email" value={email}
          onChange={(e) => setEmail(e.target.value)} required
        />
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          type="password" placeholder="Password (min 8 chars)" value={password}
          onChange={(e) => setPassword(e.target.value)} required minLength={8}
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          className="w-full bg-slate-900 text-white rounded py-2 text-sm disabled:opacity-50"
          disabled={loading}
        >
          {loading ? 'Please wait…' : mode === 'login' ? 'Log in' : 'Register'}
        </button>
      </form>
      <button
        className="text-xs text-slate-500 mt-3 underline"
        onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
      >
        {mode === 'login' ? 'Need an account? Register' : 'Have an account? Log in'}
      </button>
    </div>
  );
}
