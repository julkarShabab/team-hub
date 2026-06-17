# Team Hub — Collaborative Workspace Platform

A full-stack collaborative workspace application built for the **FredoCloud Technical Assessment**.  
Team Hub helps teams manage workspaces, goals, action items, announcements, members, permissions, and real-time collaboration from one dashboard.

---

## Live Demo

| Service | URL |
|---|---|
| Frontend | https://teamhub-8750.up.railway.app |

---

## Demo Accounts

| Role | Email | Password |
|---|---|---|
| Admin | `alice@demo.com` | `Demo1234!` |
| Member | `bob@demo.com` | `Demo1234!` |
| Member | `carol@demo.com` | `Demo1234!` |

---

## Overview

Team Hub is a modern workspace management system where teams can create workspaces, track goals, manage action items, post announcements, invite members, and control access through role-based permissions.

The project is built as a **Turborepo monorepo** with a Next.js frontend, Express backend, PostgreSQL database, Prisma ORM, Socket.io real-time updates, Cloudinary file handling, Resend email notifications, and JWT authentication.

---

## Core Features

### Workspace Management

- Create and manage collaborative workspaces
- Invite members through email
- View workspace analytics and activity
- Export workspace data as CSV

### Goals & Milestones

- Create workspace goals
- Add milestones under each goal
- Track milestone progress
- Post progress updates
- Cancel, reopen, or complete goals based on permissions

### Action Items

- Kanban-style task management
- Drag-and-drop status updates
- Instant optimistic UI updates
- Real-time task changes with Socket.io

### Announcements

- Post workspace announcements
- Admin-only announcement controls
- Pin important announcements
- Real-time announcement updates

### Members & Permissions

- Role-based access control
- Admin and Member role support
- Permission matrix visible inside the app
- Protected backend routes using RBAC middleware

---

## Advanced Features Implemented

### Optimistic UI

Actions are reflected instantly in the interface before the server response arrives. If the request fails, the UI rolls back safely and displays an error toast.

**Implemented in:**

| File | Behavior |
|---|---|
| `goalStore.js` | Creates temporary goals with `temp-` IDs before server confirmation |
| `actionItemStore.js` | Moves Kanban cards instantly during drag-and-drop |
| `workspaceStore.js` | Updates member roles/removals immediately with rollback support |

**Where to test:**  
Drag an action item between Kanban columns or create a new goal. The UI updates instantly without waiting for the network request to finish.

---

### Advanced RBAC

The application uses a centralized permission matrix to control access across both frontend and backend.

**Implemented in:**

| Layer | File | Purpose |
|---|---|---|
| Shared Constants | `utils/constants.js` | Defines roles, permissions, and permission matrix |
| Backend | `apps/api/src/middleware/auth.js` | Protects routes using `requirePermission()` |
| Frontend | Components + stores | Conditionally renders buttons and actions |

**Where to test:**

- Login as `bob@demo.com`  
  Member users have limited access.
- Login as `alice@demo.com`  
  Admin users can manage members, roles, announcements, and workspace settings.
- Visit the Members page to view the permission matrix.

---

## Permission Matrix

| Permission | Admin | Member |
|---|---:|---:|
| Create Goals | ✅ | ✅ |
| Edit Goals | ✅ | ✅ |
| Delete Goals | ✅ | ❌ |
| Post Announcements | ✅ | ❌ |
| Pin Announcements | ✅ | ❌ |
| Invite Members | ✅ | ❌ |
| Remove Members | ✅ | ❌ |
| Change Roles | ✅ | ❌ |
| Edit Workspace | ✅ | ❌ |
| Export Data | ✅ | ✅ |

---

## Bonus Features

| Feature | Status |
|---|---:|
| Dark / Light Theme | ✅ |
| Email Notifications with Resend | ✅ |
| Keyboard Shortcuts | ✅ |
| Command Palette `Ctrl + K` | ✅ |
| Swagger / OpenAPI Docs | ✅ |
| Real-time Socket.io Updates | ✅ |
| Cloudinary File Uploads | ✅ |
| Unit & Integration Tests | ❌ |
| PWA Support | ❌ |

---

## Tech Stack

| Area | Technology |
|---|---|
| Monorepo | Turborepo |
| Frontend | Next.js 14 App Router |
| Language | JavaScript |
| Styling | Tailwind CSS |
| State Management | Zustand |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| ORM | Prisma |
| Authentication | JWT Access Token + Refresh Token |
| Cookies | httpOnly Secure Cookies |
| Real-time | Socket.io |
| File Storage | Cloudinary |
| Email Service | Resend |
| API Docs | Swagger / OpenAPI |
| Deployment | Railway |

---

## Project Structure

```txt
team-hub/
├── apps/
│   ├── api/                         # Express backend
│   │   ├── prisma/
│   │   │   ├── schema.prisma        # Database schema
│   │   │   └── seed.js              # Demo data seeder
│   │   └── src/
│   │       ├── middleware/
│   │       │   └── auth.js          # JWT + RBAC middleware
│   │       ├── routes/              # API routes
│   │       ├── swagger.js           # Swagger/OpenAPI config
│   │       └── utils/
│   │           ├── email.js         # Resend email integration
│   │           └── constants.js     # RBAC permission matrix
│   │
│   └── web/                         # Next.js frontend
│       └── src/
│           ├── app/                 # App Router pages
│           ├── components/          # Reusable components and modals
│           ├── hooks/
│           │   └── useSocket.js     # Socket.io client hook
│           ├── lib/
│           │   └── constants.js     # Frontend RBAC constants
│           └── store/               # Zustand stores
│
└── packages/
    └── shared/                      # Shared constants package
```

---

## Local Development Setup

### Prerequisites

Make sure you have the following installed or configured:

- Node.js 18+
- PostgreSQL database
- Cloudinary account
- Resend account

---

### 1. Clone the Repository

```bash
git clone https://github.com/julkarShabab/team-hub.git
cd team-hub
```

---

### 2. Install Dependencies

```bash
npm install --legacy-peer-deps
```

---

### 3. Configure Environment Variables

Create a `.env` file inside `apps/api`.

```env
DATABASE_URL=postgresql://...

JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret

CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

CLIENT_URL=http://localhost:3000
PORT=4000
NODE_ENV=development

RESEND_API_KEY=your-resend-api-key
```

Create a `.env.local` file inside `apps/web`.

```env
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SOCKET_URL=http://localhost:4000
```

---

### 4. Set Up the Database

```bash
cd apps/api
npx prisma generate
npx prisma migrate dev --name init
node prisma/seed.js
cd ../..
```

---

### 5. Start the Development Server

```bash
npm run dev
```

Local URLs:

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:4000 |
| API Docs | http://localhost:4000/api/docs |

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login user |
| `POST` | `/api/auth/refresh` | Refresh access token |
| `GET` | `/api/workspaces` | Get user workspaces |
| `POST` | `/api/workspaces` | Create workspace |
| `POST` | `/api/workspaces/:id/invite` | Invite member |
| `GET` | `/api/goals/workspace/:id` | Get workspace goals |
| `POST` | `/api/goals/workspace/:id` | Create goal |
| `GET` | `/api/action-items/workspace/:id` | Get action items |
| `POST` | `/api/announcements/workspace/:id` | Post announcement |
| `GET` | `/api/analytics/workspace/:id` | Get workspace analytics |
| `GET` | `/api/workspaces/:id/export` | Export workspace data |

Full API documentation is available at:

```txt
/api/docs
```

---

## Known Limitations

- Email invitations use Resend free tier, so sending may be limited without a verified domain.
- Socket.io presence tracking resets when the page refreshes.
- Long lists currently do not have pagination.
- PWA support is not implemented.
- Unit and integration tests are not implemented.

---

## Assessment Highlights

This project demonstrates:

- Full-stack monorepo architecture
- Clean REST API design
- JWT authentication with refresh tokens
- Secure httpOnly cookie-based auth
- Role-based access control
- Optimistic UI updates
- Real-time collaboration with Socket.io
- Prisma-based relational database modeling
- Swagger API documentation
- Production deployment on Railway

---

## Author

Developed by **Julkar Niene**  
GitHub: https://github.com/julkarShabab<br>
LinkedIN: https://www.linkedin.com/in/julkar-niene<br>
Portfolio: https://julkar-portfolio.vercel.app
