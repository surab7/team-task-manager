# TaskFlow — Team Task Manager

A full-stack collaborative task management application built with React, Node.js/Express, and MongoDB.

## Live Demo
> Add your Railway URL here after deployment

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express |
| Database | MongoDB Atlas |
| Auth | JWT (JSON Web Tokens) |
| Deployment | Railway |

## Features

- **Authentication** — JWT-based signup/login with secure password hashing (bcrypt)
- **Projects** — Create projects, manage members with role-based access (Admin/Member)
- **Tasks** — Create, assign, prioritize, and track tasks (To Do / In Progress / Done)
- **Dashboard** — Live stats: total tasks, status breakdown, overdue tasks, tasks per user
- **Role-Based Access** — Admins manage everything; Members can only update their assigned tasks

## Project Structure

```
team-task-manager/
├── backend/
│   ├── src/
│   │   ├── models/         # Mongoose schemas (User, Project, Task)
│   │   ├── routes/         # Express route handlers
│   │   ├── middleware/      # JWT auth middleware
│   │   └── index.js        # App entry point
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── pages/          # React pages
    │   ├── components/     # Layout components
    │   ├── context/        # Auth context
    │   └── utils/          # Axios instance
    ├── .env.example
    └── package.json
```

## Local Setup

### Prerequisites
- Node.js 18+
- A MongoDB Atlas account (free tier works)

### 1. Clone the repo
```bash
git clone <your-repo-url>
cd team-task-manager
```

### 2. Backend setup
```bash
cd backend
npm install
cp .env.example .env
```
Edit `.env`:
```
PORT=5000
MONGO_URI=<your MongoDB Atlas connection string>
JWT_SECRET=any_random_secret_string
FRONTEND_URL=http://localhost:5173
```
```bash
npm run dev
```

### 3. Frontend setup
```bash
cd frontend
npm install
cp .env.example .env
# .env already points to http://localhost:5000/api for local dev
npm run dev
```

Open http://localhost:5173

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |

### Projects
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List user's projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project |
| PUT | `/api/projects/:id` | Update project (admin) |
| DELETE | `/api/projects/:id` | Delete project (admin) |
| POST | `/api/projects/:id/members` | Add member (admin) |
| DELETE | `/api/projects/:id/members/:userId` | Remove member (admin) |

### Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?project=:id` | List project tasks |
| POST | `/api/tasks` | Create task (admin) |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task (admin) |

### Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get stats (all projects or filtered by ?project=:id) |

## Deployment on Railway

### Step 1 — MongoDB Atlas
1. Create free cluster at https://cloud.mongodb.com
2. Add a database user (username + password)
3. Whitelist `0.0.0.0/0` in Network Access
4. Copy the connection string

### Step 2 — Deploy Backend
1. Go to https://railway.app → New Project → Deploy from GitHub
2. Select the `backend` folder (or root and set root directory to `backend`)
3. Add environment variables:
   - `MONGO_URI` = your Atlas connection string
   - `JWT_SECRET` = a random secret (e.g. openssl rand -hex 32)
   - `FRONTEND_URL` = your frontend Railway URL (set after frontend deploy)
4. Railway auto-detects Node.js and runs `npm start`
5. Copy the generated backend URL

### Step 3 — Deploy Frontend
1. New service → GitHub → select `frontend` folder
2. Add environment variable:
   - `VITE_API_URL` = `https://<your-backend-url>/api`
3. Railway builds with `npm run build` and serves the `dist` folder
4. Copy the frontend URL and update `FRONTEND_URL` in backend env vars

### Step 4 — Done!
Both services should now be live and connected.

## Environment Variables

### Backend
| Variable | Description |
|----------|-------------|
| `PORT` | Server port (Railway sets this automatically) |
| `MONGO_URI` | MongoDB Atlas connection string |
| `JWT_SECRET` | Secret key for JWT signing |
| `FRONTEND_URL` | Frontend URL for CORS |

### Frontend
| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | Backend API base URL |

## Database Schema

### User
```
name, email (unique), password (hashed), timestamps
```

### Project
```
name, description, createdBy (User ref), members: [{ user, role }], timestamps
```

### Task
```
title, description, project (Project ref), assignedTo (User ref),
createdBy (User ref), status, priority, dueDate, timestamps
```
