// Central place for settings that change between local development and production (Render).
// Everything comes from environment variables, see .env.example for the full list.

// Render sets RENDER=true on every service, so production cookies work there even if NODE_ENV is not set.
export const isProduction = process.env.NODE_ENV === 'production' || process.env.RENDER === 'true';

// Frontends that are allowed to call this API with cookies (CORS + Socket.IO).
// CLIENT_ORIGINS is a comma separated list, e.g. "https://competitivecodingarena.onrender.com,http://localhost:5173"
export const clientOrigins = (process.env.CLIENT_ORIGINS ||
  'https://competitivecodingarena.onrender.com,http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

// One day, used for both the session cookie and the JWT so they expire together.
export const SESSION_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// In production the frontend and backend live on different *.onrender.com sub-domains.
// Browsers treat those as different sites, so cookies must be SameSite=None + Secure to be sent at all.
// Locally (http://localhost) Secure cookies cannot be set, so we use SameSite=Lax instead.
export function cookieOptions(extra = {}) {
  return {
    httpOnly: true, // JavaScript in the browser cannot read the cookie (protects against XSS stealing it)
    secure: isProduction,
    sameSite: isProduction ? 'none' : 'lax',
    path: '/',
    ...extra,
  };
}

export function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable ${name}. See server/Backend/.env.example`);
  }
  return value;
}
