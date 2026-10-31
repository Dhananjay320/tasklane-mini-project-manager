# Tasklane: Mini Project Manager · Functionality doc

Assignment from **The Web Plant**: a small project-management web app.
Required stack: React + Next.js, Redux Toolkit, Node.js + Express, MongoDB, JWT auth, RESTful API.

Working product name: **Tasklane** (easy to rename).

---

## 1. Features

Priority: **P0** = asked in the brief · **P1** = our upscale, built if time allows (flagged ★ NEW) · **P2** = later.

### A. Authentication
| ID | Feature | Priority |
|---|---|---|
| A1 | Sign up with name, email, password (bcrypt hash, min 8 chars, unique email) | P0 |
| A2 | Log in with email + password → JWT | P0 |
| A3 | Log out (clears the session) | P0 |
| A4 | Protected API: every `/api/projects*` and `/api/tasks*` route needs a valid JWT | P0 |
| A5 | Protected pages: `/projects/**` redirect to `/login` without a session; logged-in users skip `/login` | P0 |
| A6 | `GET /api/auth/me`, so the app restores the session on refresh | P0 |
| A7 | ★ NEW: inline form validation + clear errors ("Email already registered", "Wrong email or password") | P1 |
| A8 | ★ NEW: login rate limit (10 tries / 15 min per IP) | P1 |

### B. Projects
| ID | Feature | Priority |
|---|---|---|
| B1 | List my projects (only mine: every query is scoped by `owner = req.user.id`) | P0 |
| B2 | Create project: title (required, ≤ 80), description (optional, ≤ 500) | P0 |
| B3 | Edit project title / description | P0 |
| B4 | Delete project, which also deletes its tasks (confirm dialog) | P0 |
| B5 | ★ NEW: progress per project card (done / total tasks, progress bar, overdue count) | P1 |
| B6 | ★ NEW: search projects by title | P1 |

### C. Tasks
| ID | Feature | Priority |
|---|---|---|
| C1 | Tasks belong to a project; list a project's tasks | P0 |
| C2 | Create task: title (required), description, status (`todo` / `in-progress` / `done`, default `todo`), dueDate (optional) | P0 |
| C3 | Edit any task field | P0 |
| C4 | Delete task (confirm) | P0 |
| C5 | **Filter** by status (All / To do / In progress / Done), done in the API with `?status=` | P0 |
| C6 | **Sort** by due date ↑ / ↓ (no due date always last) and by newest, done in the API with `?sort=` | P0 |
| C7 | ★ NEW: quick status change from the list (status pill menu) without opening the edit form | P1 |
| C8 | ★ NEW: overdue + "due today" highlighting | P1 |
| C9 | ★ NEW: status counts on the filter chips (To do 4 · In progress 2 · Done 7) | P1 |
| C10 | ★ NEW: Board view (3 columns by status) next to List view | P2 |
| C11 | ★ NEW: filter + sort kept in the URL (`?status=done&sort=due_asc`), so links and refresh keep the view | P1 |

### D. Quality
| ID | Feature | Priority |
|---|---|---|
| D1 | Loading skeletons, empty states, error toasts | P0 |
| D2 | Responsive down to 360 px (sidebar becomes a top bar) | P0 |
| D3 | Accessible: real buttons/labels, focus rings, keyboard-usable dialogs | P1 |
| D4 | API tests (Jest + Supertest): auth, ownership isolation, filter/sort | P1 |
| D5 | Deploy: web on Vercel, API on Render, DB on MongoDB Atlas | P2 (optional in brief) |

---

## 2. Data model (MongoDB / Mongoose)

```
User     { _id, name, email (unique, lowercase), passwordHash, createdAt }
Project  { _id, owner → User (indexed), title, description, createdAt, updatedAt }
Task     { _id, project → Project (indexed), owner → User (indexed),
           title, description, status: 'todo'|'in-progress'|'done',
           dueDate: Date|null, createdAt, updatedAt }
Indexes: Task { owner, project, status, dueDate }
```
`Task.owner` is stored on purpose (denormalised): every task query is `{ _id, owner: req.user.id }`, so a user can never read or edit another user's task even by guessing an id. Not found and not yours both return **404**, so the API doesn't reveal whether an id exists.

## 3. REST API (Express, `/api`)

| Method | Path | Body / query | Returns |
|---|---|---|---|
| POST | `/auth/signup` | name, email, password | 201 `{ user, token }` + cookie |
| POST | `/auth/login` | email, password | 200 `{ user, token }` + cookie |
| POST | `/auth/logout` | – | 204, clears cookie |
| GET | `/auth/me` | – | `{ user }` |
| GET | `/projects` | `?q=` | `[{ ...project, taskCounts }]` |
| POST | `/projects` | title, description | 201 project |
| GET | `/projects/:id` | – | project + taskCounts |
| PATCH | `/projects/:id` | title?, description? | project |
| DELETE | `/projects/:id` | – | 204 (cascades tasks) |
| GET | `/projects/:id/tasks` | `?status=todo|in-progress|done` `&sort=due_asc|due_desc|newest` | tasks |
| POST | `/projects/:id/tasks` | title, description, status, dueDate | 201 task |
| PATCH | `/tasks/:id` | any task field | task |
| DELETE | `/tasks/:id` | – | 204 |

Errors share one shape: `{ error: { code, message, fields? } }`. Validation with **zod** returns 400 with per-field messages.

**JWT:** signed with `JWT_SECRET`, 7-day expiry. It's sent as an **httpOnly, SameSite=Lax cookie**, so JavaScript can't read it, and the Next.js middleware can check it before rendering protected pages. `Authorization: Bearer` also works for API clients like Postman. The Next.js app proxies `/api/*` to Express (rewrite), so browser and API share one origin and no CORS cookie problems.

## 4. Frontend (Next.js App Router + Redux Toolkit)

- **RTK Query** (part of Redux Toolkit) for all API calls: caching, loading states, and tag invalidation (create task → project counts refresh).
- **`authSlice`** for the current user. **`uiSlice`** for toasts and dialogs.
- **Middleware** guards `/projects/**` and redirects logged-in users away from `/login` and `/signup`.

## 5. Screen inventory

| ID | Screen | Route | Access |
|---|---|---|---|
| S1 | Log in | `/login` | guests |
| S2 | Sign up | `/signup` | guests |
| S3 | Projects (dashboard) | `/projects` | user |
| S4 | New / edit project dialog | over S3 | user |
| S5 | Project detail: task list, filter, sort | `/projects/[id]` | owner |
| S6 | New / edit task dialog | over S5 | owner |
| S7 | Delete confirm dialog | over S3/S5 | owner |
| S8 | Empty states (no projects, no tasks, no filter match) | in S3/S5 | user |
| S9 | 404 / not your project | `/projects/[bad-id]` | user |

## 6. Constraints & decisions
- Monorepo: `client/` (Next.js) + `server/` (Express), one README, `.env.example` for each.
- MongoDB Atlas free tier (local MongoDB also works via `MONGODB_URI`).
- No paid services.

## 7. Roadmap
1. Doc (this) → 2. designs (Claude Design canvas) → 3. API + tests → 4. frontend → 5. README + deploy.
