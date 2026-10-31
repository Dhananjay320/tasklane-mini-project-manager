# Tasklane: Mini Project Manager

A small project-management web app. Sign up, create projects, break them into tasks with a status and a due date, then filter and sort them.

**Stack:** Next.js 16 (React 19, App Router) · Redux Toolkit + RTK Query · Node.js + Express 5 · MongoDB (Mongoose) · JWT auth · REST API

| | |
|---|---|
| **Live demo** | `TODO: https://<app>.vercel.app` (log in with `demo@tasklane.dev` / `demo12345`) |
| **Designs** | [Claude Design canvas](https://claude.ai/artifact/3EY4yPDHRQg72TB6nUCUxh) (clickable prototype of every screen) |
| **Feature spec** | [`docs/FEATURES.md`](docs/FEATURES.md) |

---

## Features

**Required**
- **Auth:** sign up / log in with email + password (bcrypt), JWT session, log out. API routes and pages are both protected.
- **Projects:** each user sees and manages only their own projects (title, description). Create, edit, delete. Deleting a project also deletes its tasks.
- **Tasks:** belong to a project. Title, description, status (`todo` / `in-progress` / `done`), due date. Create, edit, delete.
- **Filter and sort:** filter by status and sort by due date (soonest or latest first) or creation date. Both are done **in the API** (`?status=&sort=`). Tasks without a due date always come last.

**Extras**
- Progress bar, status counts and an **overdue** count on every project card, plus totals on the dashboard.
- **Overdue** and **due today** highlighting on tasks (done tasks are never late).
- **Quick status change** straight from the task list, without opening the edit form.
- **List and Board** views (columns by status).
- Filter, sort and view are **kept in the URL** (`/projects/:id?status=done&sort=due_desc&view=board`), so refresh and shared links keep the view.
- Project search, empty states, loading skeletons, toasts, confirm dialogs, 404 page.
- Inline validation with per-field messages from the API. Login and sign-up are rate-limited (20 tries / 15 min per IP).
- Responsive down to phone width. Accessible: real buttons and labels, native `<dialog>` with focus handling, visible focus rings, AA colour contrast.

## Project structure

```
mini-project-manager/
├── server/                  Express REST API
│   ├── src/
│   │   ├── app.js           express app (helmet, json, cookies, routes, errors)
│   │   ├── index.js         connects to MongoDB and starts the server
│   │   ├── dev-memory.js    zero-setup dev mode: in-memory MongoDB + demo data
│   │   ├── config.js        env vars
│   │   ├── schemas.js       zod request validation
│   │   ├── models/          User, Project, Task (Mongoose)
│   │   ├── routes/          auth, projects, tasks
│   │   └── middleware/      requireAuth (JWT), validate, error handler
│   └── tests/api.test.js    Vitest + Supertest against a real in-memory MongoDB
├── client/                  Next.js app
│   └── src/
│       ├── app/             pages: /login, /signup, /projects, /projects/[id]
│       ├── proxy.ts         route guard (Next 16's name for middleware)
│       ├── store/           Redux store: RTK Query API slice, authSlice, uiSlice (toasts)
│       ├── components/      dialogs, project card, app shell, icons
│       └── lib/             types, date helpers, error helpers
├── docs/FEATURES.md         functionality doc: features, data model, API, screens
└── render.yaml              Render blueprint for the API
```

## Setup

Requirements: **Node.js 20+** and npm. MongoDB is optional for a local try-out (see option A).

### Option A: quickest (no database to install)

```bash
# terminal 1: API with a throwaway in-memory MongoDB and a demo account
cd server
npm install
npm run dev:memory        # → http://localhost:4000  (demo@tasklane.dev / demo12345)

# terminal 2: web app
cd client
npm install
npm run dev               # → http://localhost:3000
```
The first `dev:memory` run downloads a MongoDB binary (one time, about 1–2 minutes). Data is lost when it stops.

### Option B: with your own MongoDB (Atlas or local)

```bash
cd server
cp .env.example .env      # set MONGODB_URI and JWT_SECRET
npm install
npm run seed              # optional: adds the demo account and sample projects
npm run dev               # → http://localhost:4000

cd ../client
cp .env.example .env.local   # API_URL=http://localhost:4000 (default)
npm install
npm run dev               # → http://localhost:3000
```

**MongoDB Atlas (free):** create an M0 cluster, add a database user, allow your IP under *Network Access* (`0.0.0.0/0` for a hosted API), then copy the connection string into `MONGODB_URI` with `/tasklane` as the database name.

### Environment variables

`server/.env` ([example](server/.env.example))

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | yes | MongoDB connection string |
| `JWT_SECRET` | yes in production | Secret for signing JWTs (a long random string) |
| `JWT_EXPIRES_IN` | no | Session length, default `7d` |
| `PORT` | no | Default `4000` |
| `CORS_ORIGINS` | no | Extra origins allowed to call the API directly (not needed with the proxy) |

`client/.env.local` ([example](client/.env.example))

| Variable | Required | Description |
|---|---|---|
| `API_URL` | yes in production | Where the API runs; `/api/*` is proxied there. Default `http://localhost:4000` |
| `JWT_SECRET` | no | Same value as the API. If set, the route guard also verifies the token signature |

### Tests

```bash
cd server && npm test      # 14 API tests: auth, validation, ownership isolation, filter, sort, cascade delete
cd client && npx tsc --noEmit && npm run lint && npm run build
```

## REST API

All routes are under `/api`. Every route except signup, login, logout and health needs a JWT, sent as the `token` httpOnly cookie (browser) or as `Authorization: Bearer <token>` (API clients). Errors always look like `{ "error": { "code", "message", "fields?" } }`.

| Method | Path | Body / query | Response |
|---|---|---|---|
| POST | `/auth/signup` | `name, email, password` | `201 { user, token }` + cookie · `409` email taken |
| POST | `/auth/login` | `email, password` | `200 { user, token }` + cookie · `401` |
| POST | `/auth/logout` | | `204`, clears the cookie |
| GET | `/auth/me` | | `{ user }` |
| GET | `/projects` | `?q=` title search | `{ projects: [{ …, taskCounts }] }` |
| POST | `/projects` | `title, description?` | `201 { project }` |
| GET | `/projects/:id` | | `{ project }` with `taskCounts { todo, inProgress, done, overdue, total }` |
| PATCH | `/projects/:id` | `title?, description?` | `{ project }` |
| DELETE | `/projects/:id` | | `204` (its tasks are deleted too) |
| GET | `/projects/:id/tasks` | `?status=todo\|in-progress\|done` `&sort=due_asc\|due_desc\|newest\|oldest` | `{ tasks }` |
| POST | `/projects/:id/tasks` | `title, description?, status?, dueDate?` (`YYYY-MM-DD` or null) | `201 { task }` |
| GET / PATCH / DELETE | `/tasks/:id` | any task field | `{ task }` / `204` |
| GET | `/health` | | `{ ok, db }` |

Quick try with curl:
```bash
curl -c jar -H "Content-Type: application/json" -d '{"email":"demo@tasklane.dev","password":"demo12345"}' localhost:4000/api/auth/login
curl -b jar "localhost:4000/api/projects"
```

## Implementation notes

- **Ownership is enforced in every query.** Projects are fetched with `{ _id, owner: userId }`. Tasks store their `owner` too (denormalised on purpose), so a task lookup is one indexed query, `{ _id, owner }`, and can't leak across users even with a guessed id. "Not yours" and "doesn't exist" both return **404**, so ids can't be probed. Tested in `api.test.js` ("never shows or changes another user's projects or tasks").
- **JWT in an httpOnly cookie.** JavaScript can't read the token (XSS can't steal it). It is `SameSite=Lax`, and `Secure` in production. The Bearer header is also accepted for API clients.
- **One origin via the Next.js proxy.** The browser only talks to the Next.js app; `next.config.ts` rewrites `/api/*` to Express. So the cookie is first-party, there's no CORS setup, and the API URL is a server-side setting.
- **Two layers of route protection.** `src/proxy.ts` redirects guests away from `/projects/**` (and signed-in users away from `/login`) before any page renders. The API checks the JWT on every request regardless. If the API returns 401 (expired session), the app clears the cookie and goes to `/login?next=…`.
- **Filtering and sorting happen in MongoDB** (aggregation): status via `$match`, and due-date sorting with a computed `noDue` key, so tasks without a date are last in both directions.
- **Due dates are calendar days.** They are stored at midnight UTC, and the client compares the `YYYY-MM-DD` part with the user's local date. "Due today" is right in every time zone, with no off-by-one from time-zone conversion.
- **State management:** RTK Query (part of Redux Toolkit) for server data with tag-based cache invalidation (a task change refreshes that task list, the project's counts and the dashboard). `authSlice` holds the signed-in user, and `uiSlice` holds toasts. A small middleware signs the user out on any 401.
- **Validation:** zod schemas on the API (field-level messages back to the form) plus light client-side checks for instant feedback.
- **Security basics:** bcrypt (cost 12), helmet headers, 100 kB body limit, login/sign-up rate limit, same error for wrong email and wrong password, no password hash ever returned (`select: false`).

## Deploy (free tiers)

1. **Database:** MongoDB Atlas M0 → copy the connection string.
2. **API on Render:** New → *Blueprint* → this repo (uses `render.yaml`), or a Web Service with root `server`, build `npm ci --omit=dev`, start `npm start`. Set `MONGODB_URI`; `JWT_SECRET` is generated. Optionally run `npm run seed` once from your machine against the same `MONGODB_URI`.
3. **Web on Vercel:** import the repo, set *Root Directory* to `client`, add env `API_URL=https://<your-api>.onrender.com` (and optionally the same `JWT_SECRET`).

Render's free API sleeps after 15 minutes idle, so the first request after a pause can take about 30–50 seconds.
