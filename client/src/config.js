// Backend URL. Set VITE_API_URL in client/.env for local development, e.g. VITE_API_URL=http://localhost:1509
export const API_URL = (import.meta.env.VITE_API_URL || 'https://bugwarbackend.onrender.com').replace(/\/$/, '');

export const TOAST_OPTIONS = {
  position: "top-center",
  autoClose: 3000,
  hideProgressBar: true,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: "colored",
};
