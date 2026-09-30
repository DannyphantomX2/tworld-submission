import { useEffect, useState } from 'react';
import { api } from '../api.js';

export default function TokenPanel({ refreshKey }) {
  const [balance, setBalance] = useState(null);
  const [history, setHistory] = useState([]);
  const [asset, setAsset] = useState('MOCK_USDT');
  const [amount, setAmount] = useState(10);
  const [error, setError] = useState('');
  const [lastConversion, setLastConversion] = useState(null); // { conversionId, txHashMock, convertedAmount }
  const [withdrawResult, setWithdrawResult] = useState(null);

  const load = async () => {
    try {
      const [b, h] = await Promise.all([api('/tokens/balance'), api('/tokens/history?limit=10')]);
      setBalance(b.tokenBalance);
      setHistory(h.transactions);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => { load(); }, [refreshKey]);

  const convert = async (e) => {
    e.preventDefault();
    setError('');
    setWithdrawResult(null);
    try {
      const result = await api('/tokens/convert', { method: 'POST', body: { toAsset: asset, amount: Number(amount) } });
      setLastConversion(result);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const withdraw = async () => {
    setError('');
    try {
      const result = await api('/tokens/withdraw', { method: 'POST', body: { conversionId: lastConversion.conversionId } });
      setWithdrawResult(result);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <section className="bg-white rounded-lg shadow p-4">
      <h2 className="font-semibold mb-1">Tokens</h2>
      <p className="text-2xl font-bold mb-4">{balance ?? '…'}</p>

      <form onSubmit={convert} className="flex gap-2 mb-3">
        <select className="border rounded px-2 py-1.5 text-sm" value={asset} onChange={(e) => setAsset(e.target.value)}>
          <option value="MOCK_USDT">MOCK_USDT</option>
          <option value="MOCK_ETH">MOCK_ETH</option>
        </select>
        <input
          type="number" min="1" className="w-24 border rounded px-2 py-1.5 text-sm"
          value={amount} onChange={(e) => setAmount(e.target.value)}
        />
        <button className="bg-slate-900 text-white text-sm rounded px-3 py-1.5">Convert</button>
      </form>

      {error && <p className="text-sm text-red-600 mb-2">{error}</p>}

      {lastConversion && (
        <div className="text-xs bg-slate-50 rounded p-2 mb-4 space-y-1">
          <p>Converted → <span className="font-medium">{lastConversion.convertedAmount}</span></p>
          <p className="text-slate-500 break-all">{lastConversion.txHashMock}</p>
          {!withdrawResult ? (
            <button onClick={withdraw} className="mt-1 text-xs bg-emerald-600 text-white rounded px-2 py-1">
              Simulate withdrawal
            </button>
          ) : (
            <p className="text-emerald-700 font-medium">{withdrawResult.status} on {withdrawResult.network}</p>
          )}
        </div>
      )}

      <h3 className="text-sm font-medium mb-2 text-slate-600">History</h3>
      <ul className="text-xs divide-y">
        {history.map((tx) => (
          <li key={tx._id} className="py-1.5 flex justify-between">
            <span>{tx.type} <span className="text-slate-400">({tx.source})</span></span>
            <span className={tx.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}>
              {tx.amount >= 0 ? '+' : ''}{tx.amount} → {tx.balanceAfter}
            </span>
          </li>
        ))}
        {history.length === 0 && <li className="py-1.5 text-slate-400">No transactions yet.</li>}
      </ul>
    </section>
  );
}
