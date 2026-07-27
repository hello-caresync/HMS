# API Reference — Nexora Doctor App

Base URL: `http://localhost:3000`

All authenticated doctor endpoints accept:
- `Authorization: Bearer <jwt>`
- Legacy dev headers: `x-doctor-id`, `x-doctor-email`

Admin endpoints require `Authorization: Bearer <admin-jwt>` with role `ADMIN`.

---

## Authentication

### POST `/api/doctor/auth/login`

```json
{ "email": "dr.aishwarya@nexora.clinical", "password": "nexora123" }
```

**200**
```json
{
  "success": true,
  "accessToken": "<jwt>",
  "user": { "doctorId": "...", "fullName": "...", "email": "..." }
}
```

### POST `/api/admin/auth/login`

Same shape; returns admin user + JWT.

---

## Clinical

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/patients` | List assigned patients |
| GET | `/api/patients/:id` | Patient detail |
| GET | `/api/opd/queue` | Live OPD queue |
| PATCH | `/api/opd/queue` | Update appointment status |
| POST | `/api/opd/consultation` | Save encounter / SOAP |
| POST | `/api/prescriptions` | Create e-prescription |
| GET | `/api/lab-orders` | List lab orders |
| POST | `/api/lab-orders` | Create lab order |
| GET | `/api/doctor/orders` | Unified lab + radiology + Rx |
| GET | `/api/messages/channels` | Communication channels |
| GET | `/api/messages?channelId=` | Channel messages |
| POST | `/api/messages` | Send message |
| GET | `/api/calendar` | Calendar events |
| GET | `/api/doctor/schedule` | Schedule + conflict detection |
| POST | `/api/doctor/schedule` | Book appointment slot |
| GET | `/api/doctor/profile` | Doctor profile |
| PUT | `/api/doctor/profile` | Update profile |
| GET | `/api/analytics` | Reports & metrics |
| GET | `/api/notifications` | Notification feed |
| POST | `/api/notifications` | Acknowledge notification |
| GET | `/api/emergency` | Emergency cases |
| GET | `/api/ipd/admissions` | IPD admissions |
| GET | `/api/telemedicine` | Active telemedicine session |
| GET | `/api/formulary` | Drug formulary |
| GET | `/api/realtime/stream` | SSE live updates |

---

## Admin

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/dashboard` | Entrepreneur KPIs, doctor roster, audit feed |

---

## Status codes

| Code | Meaning |
|------|---------|
| 200 | Success |
| 400 | Validation error |
| 401 | Unauthorized |
| 409 | Schedule conflict |
| 500 | Server error |
