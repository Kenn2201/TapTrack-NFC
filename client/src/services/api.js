// API client — base HTTP client for TapTrack backend
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function withQuery(endpoint, params) {
  if (!params || typeof params !== 'object') return endpoint;

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
    } else {
      search.set(key, String(value));
    }
  }

  const query = search.toString();
  if (!query) return endpoint;
  return `${endpoint}${endpoint.includes('?') ? '&' : '?'}${query}`;
}

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
  get: (url, options = {}) => request(withQuery(url, options.params)),
  post: (url, data) => request(url, { method: 'POST', body: JSON.stringify(data) }),
  patch: (url, data) => request(url, { method: 'PATCH', body: JSON.stringify(data) }),
  del: (url) => request(url, { method: 'DELETE' }),
};

export default api;
