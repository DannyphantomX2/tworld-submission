// Thin fetch wrapper: attaches the JWT, throws on non-2xx with the server's
// error message, and keeps token storage in one place.
const BASE = import.meta.env.VITE_API_BASE || '';

export function getToken() {
  return localStorage.getItem('tworld_token');
}
export function setToken(token) {
  if (token) localStorage.setItem('tworld_token', token);
  else localStorage.removeItem('tworld_token');
}

export async function api(path, { method = 'GET', body, isForm = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body && !isForm) headers['Content-Type'] = 'application/json';

  const res = await fetch(BASE + path, {
    method,
    headers,
    body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
