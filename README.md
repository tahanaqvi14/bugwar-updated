# Competitive Coding Arena (Bug War)

Two players are matched, get coding challenges at their level, and earn 10 points for every solved challenge in a 10-minute match.

- `client/` – React + Vite frontend (Apollo Client, Socket.IO client, Monaco editor)
- `server/Backend/` – Node.js API: Express, Apollo GraphQL, Socket.IO, MongoDB (Mongoose)

## Run locally

Requires Node.js 22 or newer and a MongoDB database (e.g. a free MongoDB Atlas cluster).

```bash
# Backend
cd server/Backend
cp .env.example .env      # then fill in the values (see comments in the file)
npm install
npm run seed              # loads the challenges (replaces existing ones)
npm run dev               # http://localhost:1509

# Frontend (second terminal)
cd client
echo "VITE_API_URL=http://localhost:1509" > .env.local
npm install
npm run dev               # http://localhost:5173
```

Without `EMAIL_USER` / `EMAIL_PASS` the sign-up OTP is printed in the backend console instead of being emailed (local development only).

## Deploying on Render

Backend web service (root directory `server/Backend`):

- Build command: `npm install`
- Start command: `npm start`
- Environment variables: everything listed in `server/Backend/.env.example`
  (`MONGO_URI`, `EXPRESS_SESSION_SECRET`, `JWT_KEY`, `EMAIL_USER`, `EMAIL_PASS`, `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `CLIENT_ORIGINS` if the frontend URL changes).
  `NODE_ENV=production` is recommended (Render is also detected automatically).

Frontend static site (root directory `client`): build command `npm install && npm run build`, publish directory `dist`.
Set `VITE_API_URL` if the backend URL is not `https://bugwarbackend.onrender.com`.

After deploying a new version of the challenge list, run `npm run seed` once against the production database.

## Security notes

- Never commit `.env` files; `.gitignore` excludes them.
- Players' code runs in [isolated-vm](https://github.com/laverdet/isolated-vm) isolates inside a separate worker process, with a time limit (1 s per test) and a memory limit (32 MB).
