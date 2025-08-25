export const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export const apiUrl = (path: string) => {
  if (path.startsWith('/')) return `${API_BASE}${path}`;
  return `${API_BASE}/${path}`;
};
