// Base URL of the Flask backend, e.g. https://leaflens-xxxx.onrender.com (set in Vercel as VITE_API_BASE_URL).
// Empty means same origin: Flask serving the built site, or the Vite dev proxy.
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export const apiUrl = (path) => `${API_BASE_URL}${path}`;
