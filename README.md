# Team Hub — FredoCloud Technical Assessment

A full-stack collaborative workspace application built with a Turborepo monorepo.

## Advanced Features Implemented

### ✅ Feature 2 — Optimistic UI
Actions reflect instantly in the UI before server confirmation, with graceful rollback on error.

**How it works:**
- `goalStore.js`: Creates a temporary goal (UUID prefixed with `temp-`) and inserts it immediately into state. On server success, the temp ID is swapped for the real one. On failure, the item is removed and a toast shows the error.
- `actionItemStore.js`: Kanban drag-and-drop status updates fire `updateItemStatus()` which moves the card instantly — no waiting for the server.
- `workspaceStore.js`: Role changes and member removals update the list immediately, then rollback silently on failure.

**Where to see it:** Drag a card between Kanban columns — it snaps instantly. Create a goal — it appears before the network round-trip completes.

### ✅ Feature 4 — Advanced RBAC
A permission matrix controls which roles can perform which actions across the entire stack.

**How it works:**
- `packages/shared/index.js`: Defines `ROLES`, `PERMISSIONS`, and `ROLE_PERMISSIONS` (the matrix). This is the single source of truth, shared by both frontend and backend.
- `apps/api/src/middleware/auth.js`: `requirePermission(PERMISSION)` middleware looks up the user's role in the workspace and checks the matrix before allowing any write operation.
- Frontend: Components check `ROLE_PERMISSIONS[myRole].includes(PERMISSION)` to conditionally render buttons (e.g. "Post Announcement" only shown to Admins).

**Where to see it:** Log in as `bob@demo.com` (Member) — the "Post Announcement" button is hidden. Log in as `alice@demo.com` (Admin) — full access.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Monorepo | Turborepo + npm workspaces |
| Frontend | Next.js 14 (App Router), Tailwind CSS, Zustand |
| Backend | Node.js + Express |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (httpOnly cookies, refresh token rotation) |
| Real-time | Socket.io |
| File uploads | Cloudinary |
| Charts | Recharts |

---

## Project Structure

```
team-hub/
├── apps/
│   ├── api/               # Express backend
│   │   ├── prisma/        # Schema + seed
│   │   └── src/
│   │       ├── middleware/ # auth.js — RBAC lives here
│   │       ├── routes/    # All API endpoints
│   │       └── utils/     # jwt, prisma, cloudinary
│   └── web/               # Next.js frontend
│       └── src/
│           ├── app/       # App Router pages
│           ├── components/ # Reusable UI + modals
│           ├── hooks/     # useSocket
│           ├── lib/       # axios instance
│           └── store/     # Zustand stores (optimistic UI)
└── packages/
    └── shared/            # Constants, RBAC matrix (shared)
```

---

## Setup & Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL database
- Cloudinary account (free tier works)

### 1. Clone & Install
```bash
git clone <repo-url>
cd team-hub
npm install
```

### 2. Configure environment variables

**Backend** (`apps/api/.env`):
```bash
cp apps/api/.env.example apps/api/.env
# Fill in DATABASE_URL, JWT secrets, Cloudinary credentials
```

**Frontend** (`apps/web/.env.local`):
```bash
cp apps/web/.env.example apps/web/.env.local
# Default: NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 3. Run database migrations & seed
```bash
cd apps/api
npx prisma migrate dev --name init
node prisma/seed.js
```

### 4. Start development servers
```bash
# From root — starts both API and web in parallel
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend:** http://localhost:4000
- **Prisma Studio:** `cd apps/api && npx prisma studio`

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| alice@demo.com | Demo1234! | Admin |
| bob@demo.com | Demo1234! | Member |
| carol@demo.com | Demo1234! | Member |

---

## Key API Endpoints

### Auth
- `POST /api/auth/register` — Register
- `POST /api/auth/login` — Login
- `POST /api/auth/refresh` — Refresh access token
- `POST /api/auth/logout` — Logout

### Workspaces
- `GET /api/workspaces` — List my workspaces
- `POST /api/workspaces` — Create workspace
- `POST /api/workspaces/:id/invite` — Invite member (Admin only)
- `PUT /api/workspaces/:id/members/:userId/role` — Change role (Admin only)
- `GET /api/workspaces/:id/export` — Export CSV

### Goals
- `GET /api/goals/workspace/:id` — List goals
- `POST /api/goals/workspace/:id` — Create (Members+)
- `PUT /api/goals/:id` — Update (Members+)
- `DELETE /api/goals/:id` — Delete (Admin only)
- `POST /api/goals/:id/milestones` — Add milestone
- `PUT /api/goals/:id/milestones/:mid` — Update milestone
- `POST /api/goals/:id/progress` — Post update

### Action Items
- `GET /api/action-items/workspace/:id` — List (filterable)
- `POST /api/action-items/workspace/:id` — Create
- `PUT /api/action-items/:id` — Update (with status change for Kanban)
- `DELETE /api/action-items/:id` — Delete

### Announcements
- `GET /api/announcements/workspace/:id` — List
- `POST /api/announcements/workspace/:id` — Post (Admin only)
- `PUT /api/announcements/:id/pin` — Pin/unpin (Admin only)
- `POST /api/announcements/:id/react` — React with emoji
- `POST /api/announcements/:id/comments` — Comment (@mention support)

### Analytics
- `GET /api/analytics/workspace/:id` — Stats + charts data

---

## Deployment (Railway)

1. Create a new Railway project
2. Add a **PostgreSQL** database service
3. Add the **API** service pointing to `apps/api/`
4. Set all env vars in Railway dashboard
5. Deploy — `railway.json` handles migrations automatically

For the frontend, deploy to **Vercel**:
```bash
cd apps/web
vercel --prod
```

---

## Known Limitations

- Email invitations send a record to DB but don't send actual emails (would need nodemailer + SMTP configured)
- Real-time cursor sharing not implemented (would need Y.js)
- File attachments on action items UI not implemented (backend Cloudinary upload route exists)
- No pagination on long lists (acceptable for demo scale)
