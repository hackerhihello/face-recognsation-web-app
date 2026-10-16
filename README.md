# Client Admin Dashboard — Face Recognition Attendance SaaS

A dedicated, tenant-isolated **Client Admin Portal** built as a separate micro-frontend service for tenant administrators, HR executives, and department managers.

---

## 🏗️ Architecture Overview

The platform is structured into two completely isolated services running side-by-side:

| Service | Directory | Default Port | Role & Target Audience |
| :--- | :--- | :--- | :--- |
| **Super Admin Portal** | `d:\kslsburagitech compny projects\superadmin face recognistation dashboard` | `http://localhost:3000` | SaaS Platform Owner / Master Ops |
| **Client Admin Dashboard** | `d:\kslsburagitech compny projects\clientadmin face recognistation dashboard` | `http://localhost:3001` | Company HR & Tenant Administrators |

---

## 🚀 How to Run the Client Admin Dashboard

### Option 1: Run Client Admin Individually (Port 3001)

Open PowerShell in the client admin folder:

```powershell
cd "d:\kslsburagitech compny projects\clientadmin face recognistation dashboard"
npm run dev
```

Visit in browser: **[http://localhost:3001](http://localhost:3001)**

---

### Option 2: Run Both Super Admin and Client Admin Together

Open two separate PowerShell terminal windows:

#### Terminal 1 — Super Admin (Port 3000)
```powershell
cd "d:\kslsburagitech compny projects\superadmin face recognistation dashboard"
npm run dev
```
Access at: **`http://localhost:3000`**

#### Terminal 2 — Client Admin (Port 3001)
```powershell
cd "d:\kslsburagitech compny projects\clientadmin face recognistation dashboard"
npm run dev
```
Access at: **`http://localhost:3001`**

---

## 📦 Implemented Modules (15 of 15)

1. **Dashboard Overview (`/`)**: Real-time KPI counters (Present, Late, Absent, Building Occupancy %), live punch ticker, and monthly attendance charts.
2. **Employees Directory (`/employees`)**: Searchable roster, department filtering, face registration status, add employee modal, and face vector purge with compliance confirmation.
3. **Face Registration Studio (`/face-registration`)**: Guided enrollment workflow with biometric consent checkboxes, live camera viewfinder simulation, and 512-d ArcFace vector generation.
4. **Attendance Records (`/attendance`)**: Historical punch records, check-in/out timestamps, compliance correction modal with reason logging, and CSV exports.
5. **Live Attendance Floor Telemetry (`/live-attendance`)**: Real-time staff presence board, active building occupancy metrics, and late arrival alerts.
6. **Shifts & Work Schedules (`/shifts`)**: Configurable work shifts, grace period buffers, half-day deduction thresholds, and shift assignment modals.
7. **Departments (`/departments`)**: Organizational department breakdown, supervisor assignments, and headcount tracking.
8. **Attendance Locations & Geofencing (`/locations`)**: Office location management, GPS coordinates (Latitude/Longitude), and Haversine perimeter radius enforcement.
9. **Reports & Exports (`/reports`)**: Master attendance rolls, punctuality reports, overtime summaries, and payroll CSV exports.
10. **Client Users & Roles (`/users`)**: Tenant-scoped Role-Based Access Control (`PRIMARY_MASTER_ADMIN`, `HR_ADMIN`, `DEPARTMENT_MANAGER`) and admin invite modal.
11. **System Notifications (`/notifications`)**: Real-time alerts for geofence breaches, anomalous face verification failures, and unread toggles.
12. **API Usage & Telemetry (`/api-usage`)**: Tenant-scoped Railway Face API request ledger, latency metrics, and Request ID tracing.
13. **Company Settings (`/settings`)**: Company work policy, standard hours, late buffers, timezones, auto-checkout toggles, and biometric purge horizons.
14. **Audit History (`/audit`)**: Tamper-evident chronological audit ledger tracking administrative interventions, biometric updates, and punch adjustments.
15. **Help & Support (`/support`)**: Edge terminal kiosk configuration guides, API documentation links, and 24/7 SLA helpdesk contacts.

---

## 🔒 Security & Biometric Privacy

- **No Raw Biometrics**: Raw camera photos are never stored in the database. Only 512-dimensional vector embeddings are stored in Cloudflare R2 and referenced by opaque `faceId` tokens.
- **Strict Multi-Tenant Isolation**: All queries and mutations in the store strictly enforce `activeClientId` (`ABC001`, `KSL042`, `NOV109`).
- **Backend Face API Proxy**: Secure server-side routes (`/api/face/register` and `/api/face/verify`) proxy requests to the Railway Face API without exposing API keys to the browser.
