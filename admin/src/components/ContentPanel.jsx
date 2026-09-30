import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function ContentPanel({ onTokensChanged }) {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [runResults, setRunResults] = useState({}); // contentId -> last run result

  const load = async () => {
    try {
      const { content } = await api('/content?limit=20');
      setItems(content);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, []);

  const create = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api('/content', { method: 'POST', body: { title, body } });
      setTitle('');
      setBody('');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const summarize = async (id) => {
    setError('');
    setRunResults((r) => ({ ...r, [id]: { loading: true } }));
    try {
      const result = await api(`/content/${id}/ai/summarize`, { method: 'POST', body: { tone: 'neutral', length: 'short' } });
      setRunResults((r) => ({ ...r, [id]: result }));
      onTokensChanged();
    } catch (err) {
      setRunResults((r) => ({ ...r, [id]: { error: err.message } }));
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold mb-3">Content</h2>

      <form onSubmit={create} className="space-y-2 mb-4 border-b pb-4">
        <input
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Title" value={title} onChange={(e) => setTitle(e.target.value)} required
        />
        <textarea
          className="w-full border rounded px-3 py-2 text-sm" rows={2}
          placeholder="Body" value={body} onChange={(e) => setBody(e.target.value)} required
        />
        <button className="bg-slate-900 text-white text-sm rounded px-3 py-1.5">Create</button>
      </form>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      <ul className="space-y-3">
        {items.map((item) => {
          const run = runResults[item._id];
          return (
            <li key={item._id} className="border rounded p-3">
              <div className="flex justify-between items-start gap-3">
                <div>
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-slate-500 line-clamp-2">{item.body}</p>
                </div>
                <button
                  className="shrink-0 text-xs bg-indigo-600 text-white rounded px-2 py-1 disabled:opacity-50"
                  onClick={() => summarize(item._id)}
                  disabled={run?.loading}
                >
                  {run?.loading ? 'Running…' : 'Summarize'}
                </button>
              </div>
              {run && !run.loading && (
                <div className="mt-2 text-xs bg-slate-50 rounded p-2">
                  {run.error ? (
                    <span className="text-red-600">{run.error}</span>
                  ) : (
                    <>
                      <p><span className="font-medium">{run.status}</span> · {run.latencyMs}ms · +{run.tokensAwarded} tokens</p>
                      <p className="mt-1 text-slate-600">{run.output}</p>
                    </>
                  )}
                </div>
              )}
            </li>
          );
        })}
        {items.length === 0 && <p className="text-sm text-slate-400">No content yet.</p>}
      </ul>
    </section>
  );
}
