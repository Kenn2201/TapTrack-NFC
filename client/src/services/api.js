// API client — base HTTP client for TapTrack backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const res = await fetch(API_BASE + endpoint, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(error.message || 'Request failed');
  }
  return res.json();
}

export const api = {
  get: (url) => request(url),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  patch: (url, data) => request(url, { method: 'PATCH', body: JSON.stringify(data) }),
  del: (url) => request(url, { method: 'DELETE' }),
};

export default api;
