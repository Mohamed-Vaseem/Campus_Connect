import axios from 'axios';

// Local dev: Vite's proxy forwards '/api' to the backend (see vite.config.js), so the default works as-is.
// Production (e.g. the frontend on Vercel, backend on Render): set VITE_API_BASE_URL to the backend's
// full URL, e.g. https://itech-broadcast-api.onrender.com/api
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api';

export const api = axios.create({ baseURL });

// The backend returns file links (poster images) as relative paths like "/api/files/posters/x.png".
// Locally that resolves fine against the dev server's own proxy. In production, when the frontend
// (Vercel) and backend (Render) are on different domains, it needs to point at the backend directly.
const apiOrigin = baseURL.replace(/\/api\/?$/, '');
export const toAssetUrl = (path) => (!path || /^https?:\/\//.test(path) ? path : `${apiOrigin}${path}`);

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('cc_token');
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const url = err.config?.url || '';
    if (err.response?.status === 401 && !url.startsWith('/auth/') && localStorage.getItem('cc_token')) {
      localStorage.removeItem('cc_token');
      window.dispatchEvent(new Event('cc-logout'));
    }
    return Promise.reject(err);
  }
);

export const errMsg = (e) =>
  e?.response?.data?.message || (e?.code === 'ERR_NETWORK' ? "Can't reach the server. Is the backend running?" : e?.message) || 'Something went wrong';

