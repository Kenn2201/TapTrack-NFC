// API client — base HTTP client for TapTrack backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(endpoint, options = {}) {
  const res = await fetch(API_BASE + endpoint, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ message: res.statusText }));
    const errorMessage = errorData.error || errorData.message || (errorData.errors ? Object.values(errorData.errors).flat().join(', ') : 'Request failed');
    const err = new Error(errorMessage);
    err.status = res.status;
    err.data = errorData;
    throw err;
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
