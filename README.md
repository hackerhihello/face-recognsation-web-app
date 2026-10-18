# Face Attendance Platform

One repository for the face-attendance SaaS. The API/docs site lives separately in `../face-attendance-docs`.

| Folder | What it is | Dev command | Port |
| --- | --- | --- | --- |
| `apps/client-admin` | Client (tenant) admin portal: dashboard, employees, face registration | `npm run dev:client` | 3001 |
| `apps/super-admin` | Platform super admin portal | `npm run dev:super` | 3000 |
| `backend` | Convex backend (schema, functions, Face API integration, REST `/v1/*`) | `npm run dev:backend` | Convex cloud |

## Setup

```bash
npm install            # once, at this folder; installs all three projects
```

Run each project in its own terminal with the commands above. Other root scripts: `build`, `build:client`, `build:super`, `start:client`, `start:super`, `lint`, `typecheck:backend`, `test:backend`.

## Environment

- `backend/.env.local` — Convex deployment and Face API secrets. Never commit it (ignored by `.gitignore`).
- `apps/client-admin/.env.local` — copy from `apps/client-admin/.env.example`.

## Notes

- The Face API key stays in Convex; neither web app ever receives it.
- Status, security findings and the integration plan: `apps/client-admin/docs/FRONTEND_PHASE1.md`.
