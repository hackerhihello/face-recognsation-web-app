# Frontend Phase 1 — Increment 1

Branch: `dev` (local only, not pushed). Backend: **Convex** (existing deployment kept; Firebase is not used — decision recorded 2026-10-16).

## What this increment delivers

| Area | Route / location | Status |
| --- | --- | --- |
| App shell: collapsible navy sidebar, mobile drawer, top bar, breadcrumbs, employee search, notifications, profile menu, skip link | `src/components/shell/*` | Done |
| Role-aware navigation + per-page server guards | `src/lib/auth/*`, `requirePermission()` in each page | Done (preview identity only — see Auth) |
| Client Admin dashboard: 7 metrics, daily + monthly charts (legend, tooltip, keyboard focus, table view), recent activity, date + department filters | `/app/dashboard` | Done on **sample data** |
| Employees: table, search, 3 filters, pagination, add/edit dialog with validation, detail page, activate/deactivate with confirmation, attendance history | `/app/employees`, `/app/employees/[employeeId]` | Done on **sample data** |
| Design system: tokens, Button, Card, StatCard, DataTable, Pagination, Field/Input/Select/Search, Dialog/ConfirmDialog, StatusBadge, Skeleton, Empty/Error states, Toast, BarChart | `src/app/globals.css`, `src/components/ds/*`, `src/components/charts/*` | Done |
| Service layer (typed `DataService`, sample adapter, Convex placeholder) | `src/services/*` | Done; Convex adapter pending |
| `/api/face/*` proxy hardened | `src/app/api/face/*` | Done |
| Face registration, attendance, reports, Super Admin | — | Next increments (shown as "Soon" in nav) |

The original 15 pages still work at their existing URLs (moved into the `src/app/(legacy)` route group with their original layout). The old overview moved to `/legacy-overview`; `/` now redirects to `/app/dashboard`.

### Sample data

Every screen backed by `src/services/sample/*` shows a "Sample data — UI preview only" banner. The figures are computed from a deterministic generated dataset through the same `DataService` interface the Convex adapter will implement — filters genuinely recompute; nothing is a hard-coded result. Writes are kept in the browser tab only.

## Security findings in the existing code (action needed)

1. **Convex public functions trust caller-supplied `clientId` / `actorEmail`.** `clientAdmin.ts`, `attendance.ts`, `superAdmin.ts`, `employees.ts` never read `ctx.auth`. Anyone with the deployment URL can read or write any tenant. *The browser is deliberately not wired to these functions yet.*
2. **`/v1/face/register` and `/v1/face/verify` (convex/http.ts) authenticate nothing** — any `x-client-id` header is accepted and triggers enrollment/recognition with that tenant's Face API key. Register also records the actor as `api-client@rest.system`.
3. **Old Next.js face routes returned fabricated success** (random confidence, fake face IDs) when Convex was unreachable, and defaulted `consentConfirmed` to `true`. **Fixed** in this increment: no fallback, consent must be explicitly `true`, tenant comes from the server session, body is allow-listed.
4. `lib/crypto.ts` "encryption" of tenant Face API keys is XOR obfuscation. Replace with AES-GCM (Web Crypto) keyed from `CREDENTIAL_ENCRYPTION_SECRET`.
5. `backend/.env.local` contains a live Face API key and encryption secret. The backend folder is not a git repo; when it becomes one, keep `.env.local` ignored and rotate the key if it was ever shared.

## Convex integration plan (replaces the Firebase plan)

1. **Authentication.** Add Convex Auth (or Clerk + Convex JWT). Every query/mutation/action resolves identity with `ctx.auth.getUserIdentity()`, then looks up `clientUsers` / `masterAdmins` / `superAdmins` by email to get `{ role, clientId }`. Remove `clientId`, `actorEmail`, `actorRole` from public function args.
2. **Tenant + role enforcement in Convex.** Wrap functions with a helper (e.g. `tenantQuery`, `tenantMutation`) that injects the resolved `clientId` and checks a permission matching `src/lib/auth/roles.ts`. Super Admin functions get a separate `platformQuery` wrapper; client roles never pass it and vice versa.
3. **Make face/attendance actions internal.** Expose them only through authenticated wrappers (session for the dashboard, hashed API token for REST/kiosk). The `/v1/*` HTTP routes must authenticate via `authenticateApiToken` before using any `x-client-id`.
4. **Frontend wiring.** Add `convex` to this app, wrap `/app` in `ConvexProviderWithAuth`, implement `src/services/convex/convexAdapter.ts` against the hardened functions, set `NEXT_PUBLIC_DATA_SOURCE=convex`, and replace `getSession()` with the real identity lookup (server-side, then pass the serializable session to `AppShell` as today).
5. **Missing backend functions needed by the UI:** paginated `listEmployees` (Convex `paginate`), `listEmployeeAttendance`, dashboard daily/monthly series, missing-checkout count, department-scoped metrics.

## Face API integration plan (verified contract only)

Source: https://face-recognition-web-theta.vercel.app/documentation and `backend/convex/lib/faceApiClient.ts`. Only these documented contracts are used:

| Use | Endpoint | Request (multipart) | Response fields used |
| --- | --- | --- | --- |
| Register face | `POST /api/enroll` | `file`, `name`, `region`, `emp_id`, `emp_rank` | `success`, `emp_id`, `person_name`, `face_encoding_id`, `faces_detected`, `processing_time` |
| Verify / punch | `POST /api/recognize` | `file`, `region` | `success`, `total_faces`, `matches[].emp_id/name/match_score/distance` |
| Add more faces (later) | `POST /api/person/{emp_id}/faces` | `faces` (repeated) | `success_count`, `error_count`, `results[]` |
| Health | `GET /api/health` | — | (no auth; fields not documented) |

- `X-API-Key` lives only in Convex env / encrypted tenant record — never in this app or the browser.
- Browser → `POST /api/face/register|verify` (this app, session-checked) → Convex HTTP action → Face API.
- The docs define no JSON error schema; handle 400/401/429/500 by status code. No liveness/anti-spoofing is documented, so the UI must not claim it.
- **Nothing face-related has been tested against the real API yet.** Registration/recognition must not be described as working until an end-to-end test with a real tenant passes.

## Auth in this increment

`getSession()` returns a **preview identity** only when `next dev` is running (or `ENABLE_PREVIEW_SESSION=true`). Its role can be switched in the profile menu to review role-based UI. It unlocks sample data only and is refused by `/api/face/*`. With preview disabled, every `/app` route redirects to `/login`.

## Verification performed

- `next build` (includes TypeScript): passes; all `/app` routes are dynamic (no build-time auth decision).
- ESLint (`eslint-config-next` 16.3.8) on all new code: clean. Pre-existing legacy files still report warnings/errors that were present before this work.
- Browser interaction run (headless Edge via DevTools protocol), 22/22 checks: validation messages + `aria-invalid`, duplicate-ID conflict, create/edit/deactivate flows, toasts, focus trap/return, Escape, pagination, filtered empty state, not-found state, filter recomputation, chart table view, mobile drawer, no horizontal overflow at 390 px.
- HTTP checks: role guards per role, signed-out redirect, forged role cookie cannot sign in, face proxy refuses preview/unauthenticated calls with honest errors.
- Error state verified with `NEXT_PUBLIC_DATA_SOURCE=convex` (adapter not connected).

## Next increments

1. Face registration screen (camera + upload, consent, progress, retry) and employee verification flow on top of the hardened proxy.
2. Attendance (`/app/attendance`) with correction workflow + audit history; Reports (`/app/reports`).
3. Super Admin area under `/super-admin/*` with its own platform guard, reusing the design system; port screens from the existing superadmin project.
4. Convex auth + adapter (above) — prerequisite for any live data.
