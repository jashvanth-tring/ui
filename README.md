# TATrack UI (Frontend)

Frontend for the TATrack Talent Acquisition Tracker, built with React, TypeScript, Vite, Redux, MUI and Tailwind.

- Folder: `tatrack_ui/`
- Default URL: http://localhost:5173

## Prerequisites

- Node.js 18 or later, with npm
- The TATrack API running (default http://localhost:3008/api). See `README_API.md`.

## Setup

```bash
cd tatrack_ui/
npm install
```

Create a `.env` file in `tatrack_ui/` with the values below.

## Environment variables (`.env`)

```env
VITE_BACKEND_URL =http://localhost:3008/api
VITE_ENCRYPTION_KEY = ta_tracker-creds-key
VITE_PUBLIC_ROUTES = '["/login", "/forgotPassword", "/recover"]'

VITE_FIREBASE_API_KEY=AIzaSyD7f53qpVhLjuBvskMLPYMxRY2rUHVBR5c
VITE_FIREBASE_AUTH_DOMAIN=ta-tracker-e5c39.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=ta-tracker-e5c39
VITE_FIREBASE_SENDER_ID=157739526372
VITE_FIREBASE_APP_ID=1:157739526372:web:025deed39185e9587a64f1
VITE_FIREBASE_VAPID_KEY=BHcSNi0gMuoXXWB7xqq5WINyTb3KGvacKnLlFj80Ys5craqyLKOigtOKGF8w12pqBokpejDrGoEzIc0M_jogREg
```

| Variable | Used for |
|---|---|
| `VITE_BACKEND_URL` | Base URL of the API |
| `VITE_ENCRYPTION_KEY` | Encrypts saved login details in the browser |
| `VITE_PUBLIC_ROUTES` | Pages that open without login |
| `VITE_FIREBASE_*` | Firebase push notifications |

## Run

| Command | Purpose |
|---|---|
| `npm run dev` | Development server at http://localhost:5173 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | Lint and fix |
| `npm run format` | Format code with Prettier |

Open http://localhost:5173 and log in.
