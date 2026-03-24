# AssetTrack — Bank Office Asset Management System

> **CBU Coding Hackathon 2026 — Team NEWBIES**

A complete web application for managing bank office assets: laptops, printers, network equipment, security cameras, and more. Track asset lifecycles, assignments, status changes, and get AI-powered risk alerts.

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Java Spring Boot REST API
- **Styling**: Tailwind CSS + shadcn/ui
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth (email/password with email confirmation)
- **Charts**: Recharts
- **QR Codes**: qrcode.react

## Architecture

```
┌─────────────────┐       ┌──────────────────┐       ┌──────────────────┐
│   Next.js App   │──────▶│  Java Spring Boot │──────▶│ Supabase Postgres│
│   (Frontend)    │ REST  │  REST API (:8080) │ JDBC  │   (Database)     │
│   port :3000    │       │                    │       │                  │
└────────┬────────┘       └──────────────────┘       └──────────────────┘
         │
         │  Supabase Auth SDK (login/signup only)
         ▼
┌──────────────────┐
│  Supabase Auth   │
└──────────────────┘
```

## Features

- 📊 **Dashboard** — Summary cards, pie/bar charts, recent activity feed
- 📦 **Asset Management** — Full CRUD with search, filters, QR codes
- 👥 **Employee Management** — Track employees and their assigned assets
- 📋 **Audit Log** — Complete history of all status changes, export to CSV
- 📈 **Analytics** — Aging distribution, department breakdown, trend charts
- 🤖 **AI Risk Alerts** — Rule-based risk detection (repair delays, lost assets, aging)
- 🔐 **Authentication** — Supabase Auth with admin invite onboarding and password setup
- 📱 **Responsive** — Mobile-friendly dark UI with gold accent theme

---

## SETUP IN 5 STEPS

### Step 1: Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In the Supabase dashboard, go to **SQL Editor**
3. Paste the contents of `supabase/schema.sql` and click **Run**
4. Paste the contents of `supabase/seed.sql` and click **Run**

### Step 2: Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

- Go to **Supabase Dashboard → Settings → API**
- Copy the **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy the **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Set `NEXT_PUBLIC_API_URL=http://localhost:8080`
- Set `SUPABASE_INVITE_REDIRECT_TO=http://localhost:3000/auth/confirm?next=/auth/set-password` (used by backend invite API)

Set backend environment variables (instead of hardcoding credentials):

- `SPRING_DATASOURCE_URL` → Supabase JDBC Session Pooler URL
- `SPRING_DATASOURCE_USERNAME` → database username
- `SPRING_DATASOURCE_PASSWORD` → database password
- `SUPABASE_URL` → Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` → service role key (required for invite API)
- `SUPABASE_INVITE_REDIRECT_TO` → e.g. `http://localhost:3000/auth/confirm?next=/auth/set-password`
- `APP_BOOTSTRAP_ADMIN_EMAILS` → comma-separated admin emails (default includes `almalimir@proton.me`)

### Step 3: Install & build

```bash
# Frontend
npm install

# Backend (requires Java 17+ and Maven)
cd backend
mvn package -DskipTests
cd ..
```

### Step 4: Run both servers

Terminal 1 — Java Backend:
```bash
cd backend
java -jar target/assettrack-backend-1.0.0.jar
```

Terminal 2 — Next.js Frontend:
```bash
npm run dev
```

### Step 5: Open the app

Open [http://localhost:3000](http://localhost:3000), sign up with your email, confirm via the email link, and sign in.

---

## Prerequisites

- **Node.js** 18+ and npm
- **Java** 17+ (OpenJDK recommended)
- **Maven** 3.8+
- A **Supabase** account (free tier works)

---

## Deploy to Vercel

1. Deploy the Java backend to a cloud service (Railway, Render, or AWS)
2. Push the Next.js app to GitHub
3. Go to [vercel.com](https://vercel.com) → Import Project
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_API_URL` → URL of your deployed Java backend
5. Deploy!

---

## Business Rules

| Current Status | Allowed Transitions |
|---|---|
| REGISTERED | ASSIGNED, IN_REPAIR |
| ASSIGNED | REGISTERED (return), IN_REPAIR, LOST |
| IN_REPAIR | REGISTERED, ASSIGNED, WRITTEN_OFF |
| LOST | WRITTEN_OFF only |
| WRITTEN_OFF | Terminal — no changes allowed |

- Every status change requires a reason
- Every status change is logged to the audit trail
- Only one active assignment per asset at a time
- Assets with status LOST or WRITTEN_OFF cannot be assigned

---

## Project Structure

```
v1/
├── app/
│   ├── layout.tsx            # Root layout with dark theme
│   ├── globals.css           # Tailwind + CSS variables
│   ├── login/page.tsx        # Login/signup with email confirmation
│   ├── auth/confirm/route.ts # Email verification callback
│   ├── dashboard/page.tsx    # Dashboard with charts
│   ├── assets/
│   │   ├── page.tsx          # Assets list with search/filter
│   │   └── [id]/page.tsx     # Asset detail with QR code
│   ├── employees/page.tsx    # Employee management
│   ├── audit/page.tsx        # Audit log with CSV export
│   └── analytics/page.tsx    # Advanced analytics + AI alerts
├── components/
│   ├── ui/                   # shadcn/ui components
│   ├── Navbar.tsx
│   ├── StatusBadge.tsx
│   ├── StatsCard.tsx
│   ├── AssetForm.tsx
│   ├── EmployeeForm.tsx
│   ├── ChangeStatusModal.tsx
│   ├── AssignModal.tsx
│   ├── QRModal.tsx
│   ├── ConfirmDialog.tsx
│   ├── AuditLogRow.tsx
│   └── AIAlerts.tsx
├── lib/
│   ├── api.ts               # REST API client (calls Java backend)
│   ├── supabase.ts          # Supabase client (auth only)
│   ├── supabase-server.ts   # Supabase server client (middleware)
│   ├── types.ts             # TypeScript interfaces
│   ├── constants.ts         # Status colors, transitions
│   └── utils.ts             # Utility functions
├── middleware.ts             # Auth route protection
├── backend/                  # Java Spring Boot REST API
│   ├── pom.xml
│   └── src/main/java/com/assettrack/
│       ├── config/           # CORS configuration
│       ├── controller/       # REST controllers
│       ├── dto/              # Data transfer objects
│       ├── model/            # JPA entities
│       ├── repository/       # Spring Data repositories
│       └── service/          # Business logic
└── supabase/
    ├── schema.sql            # Database schema
    └── seed.sql              # Sample data
```

---

## API Endpoints (Java Backend)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assets` | List all assets (with ?status, ?category, ?search) |
| GET | `/api/assets/{id}` | Get asset by ID |
| POST | `/api/assets` | Create new asset |
| PUT | `/api/assets/{id}` | Update asset |
| PATCH | `/api/assets/{id}/status` | Change asset status |
| GET | `/api/employees` | List all employees |
| POST | `/api/employees` | Create new employee (admin) |
| PUT | `/api/employees/{id}` | Update employee (admin) |
| DELETE | `/api/employees/{id}` | Delete employee (admin) |
| POST | `/api/employees/{id}/invite` | Send Supabase invite email (admin) |
| GET | `/api/assignments` | List assignments (with ?assetId, ?employeeId, ?active) |
| POST | `/api/assignments/{assetId}` | Assign asset to employee |
| PATCH | `/api/assignments/{id}/return` | Return an asset |
| GET | `/api/assignments/counts` | Get assignment counts by employee |
| GET | `/api/asset-history` | List audit history (with ?assetId, ?from, ?to, ?limit) |
| GET | `/api/analytics/summary` | Dashboard summary stats |
| GET | `/api/analytics/aging` | Asset aging breakdown |
| GET | `/api/analytics/departments` | Department asset counts |
| GET | `/api/analytics/trends` | Status change trends |
| GET | `/api/analytics/top-reassigned` | Most reassigned assets |
| GET | `/api/analytics/alerts` | AI-powered risk alerts |

---

*Built with ❤️ by Team NEWBIES for CBU Coding Hackathon 2026*
