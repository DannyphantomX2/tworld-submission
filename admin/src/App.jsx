import { useState } from 'react';
import { getToken, setToken } from './api.js';
import AuthForm from './components/AuthForm.jsx';
import ContentPanel from './components/ContentPanel.jsx';
import TokenPanel from './components/TokenPanel.jsx';

export default function App() {
  const [user, setUser] = useState(null);
  const [authed, setAuthed] = useState(Boolean(getToken()));
  const [tokenRefreshKey, setTokenRefreshKey] = useState(0);

  const logout = () => {
    setToken(null);
    setAuthed(false);
    setUser(null);
  };

  if (!authed) {
    return <AuthForm onAuthed={(u) => { setUser(u); setAuthed(true); }} />;
  }

  return (
    <div className="max-w-3xl mx-auto p-4">
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-lg font-semibold">T-World Admin</h1>
        <div className="flex items-center gap-3 text-sm text-slate-500">
          {user?.email && <span>{user.email}</span>}
          <button onClick={logout} className="underline">Log out</button>
        </div>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <ContentPanel onTokensChanged={() => setTokenRefreshKey((k) => k + 1)} />
        <TokenPanel refreshKey={tokenRefreshKey} />
      </div>
    </div>
  );
}
