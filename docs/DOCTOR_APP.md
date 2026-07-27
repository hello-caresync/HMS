# Nexora Doctor Management Application

Production-grade doctor workstation with PostgreSQL, JWT authentication, real-time updates, and entrepreneur admin console.

## Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 16, React 19, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes (REST) |
| Database | PostgreSQL + Prisma ORM |
| Auth | JWT (jose) + bcrypt password hashing |
| Real-time | Server-Sent Events + Supabase Realtime (optional) |
| State | React Query, Zustand |

## Quick Start

### 1. Environment

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Required variables:

```env
DATABASE_URL="postgresql://nexora:nexora_dev_password@localhost:5432/nexora_doctor"
DIRECT_URL="postgresql://nexora:nexora_dev_password@localhost:5432/nexora_doctor"
JWT_SECRET="your-32-char-minimum-secret"
DOCTOR_DEV_PASSWORD="nexora123"
ADMIN_DEV_PASSWORD="admin123"
```

### 2. Database (Docker)

```bash
docker compose up postgres -d
npm run db:push
npm run db:seed
```

### 3. Run

```bash
npm install
npm run dev
```

Open:
- **Doctor portal:** http://localhost:3000/doctor/auth/login
- **Entrepreneur admin:** http://localhost:3000/entrepreneur/dashboard

### Demo credentials

| Role | Email | Password |
|------|-------|----------|
| Doctor (DB) | dr.aishwarya@nexora.clinical | nexora123 |
| Doctor (dev) | doctor@nexora.com | doctor123 |
| Admin | admin@nexora.com | admin123 |

## Modules

1. **Dashboard** — KPIs, queue, IPD, ER, notifications (`/doctor/dashboard`)
2. **My Schedules** — Calendar with DB-backed appointments (`/doctor/schedule`)
3. **My Patients** — Patient list, search, EMR timeline (`/doctor/patients`)
4. **OPD/IPD Consultation** — Care center with live queue (`/doctor/opd-consultation`)
5. **E-Prescriptions** — SOAP notes, formulary, Rx API (`/doctor/e-prescription`)
6. **Lab/Radiology Orders** — Unified orders from PostgreSQL (`/doctor/lab-orders`)
7. **Communication Centre** — Channels + messages API (`/doctor/communication-center`)
8. **Calendar** — Integrated schedule view (`/doctor/calendar`)
9. **Reports & Analytics** — Prisma-backed metrics (`/doctor/reports-analytics`)
10. **Profile** — Editable doctor profile (`/doctor/profile-settings`)
11. **Entrepreneur Dashboard** — Multi-doctor system overview (`/entrepreneur/dashboard`)

## API Documentation

See [docs/API.md](./docs/API.md)

## Database Schema

See [docs/SCHEMA.md](./docs/SCHEMA.md)

## Tests

```bash
npm test
```

## Full Docker deployment

```bash
docker compose up --build
```

## Patient-initiated appointments

Appointments are created in PostgreSQL via the patient app (or seed data). Doctors see them in schedule, calendar, and OPD queue in real time via SSE (`GET /api/realtime/stream`) and optional Supabase replication.

## Security

- Passwords stored as bcrypt hashes
- JWT Bearer tokens on all authenticated API routes
- Zod validation on write endpoints
- Prisma parameterized queries (SQL injection safe)
- Role-based access: `DOCTOR` vs `ADMIN` JWT roles
