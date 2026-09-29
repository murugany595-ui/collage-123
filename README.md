# College Management System

Node.js + Express backend with an integrated high-speed in-memory store and interactive React frontend (admin, student, parent, and accountant portals). The application runs with zero external database dependencies.

## 1. Setup

```bash
npm install
npm run dev
```

The system starts immediately with fully pre-seeded academic, student, fees, and accounting records.

## 2. Demo accounts (password for all: `Password123!`)

| Role       | Email                          |
|------------|---------------------------------|
| admin      | admin@brightwood.edu            |
| student    | ava.thompson@brightwood.edu     |
| parent     | mark.t@mail.com                 |
| accountant | accounts@brightwood.edu         |

## 3. Auth flow

Each login page in the UI (`app/login/admin`, `/login/student`,
`/login/parent`, `/login/accountant`) posts to its matching endpoint:

```
POST /api/auth/login/admin        { email, password }
POST /api/auth/login/student      { email, password }
POST /api/auth/login/parent       { email, password }
POST /api/auth/login/accountant   { email, password }
```

Response:

```json
{
  "success": true,
  "data": {
    "token": "<jwt>",
    "user": { "id": 1, "name": "...", "email": "...", "role": "admin" },
    "profile": { "...role-specific row (student/parent/accountant only)" }
  }
}
```

Store the token and send it as `Authorization: Bearer <token>` on every
subsequent request. All `/api/admin/*`, `/api/student/*`, `/api/parent/*`
and `/api/accountant/*` routes require it and are locked to that role.

`GET /api/auth/me` — rehydrate the session (e.g. on page refresh).
`POST /api/auth/logout` — no-op server-side (JWTs are stateless); just discard the token client-side.

## 4. Route map (mirrors the `app/` folder structure)

Every response is wrapped as `{ success, data }` (or `{ success, message }`
for errors/actions).

### `/api/admin/*` (admin role)
| Method | Route | Matches |
|---|---|---|
| GET | `/dashboard` | `app/admin/dashboard` — stat cards, revenue chart, class donut, recent students |
| GET/POST | `/students` | `app/admin/students` |
| GET/PUT/DELETE | `/students/:id` | |
| GET/POST | `/teachers` | `app/admin/teachers` |
| PUT/DELETE | `/teachers/:id` | |
| GET/POST | `/parents` | `app/admin/parents` |
| PUT/DELETE | `/parents/:id` | |
| GET/POST | `/attendance` | `app/admin/attendance` |
| GET | `/fees` | `app/admin/fees` |
| GET | `/reports` | `app/admin/reports` |
| GET | `/timetable` | `app/admin/timetable` |
| GET/PUT | `/settings` | `app/admin/settings` |
| GET | `/profile` | `app/admin/profile` |

### `/api/student/*` (student role — auto-scoped to the logged-in student)
`/dashboard`, `/profile`, `/attendance`, `/fees`, `/assignments` (GET + PATCH
status), `/exams`, `/results`, `/timetable`, `/notifications` (GET + PATCH
`:id/read`) — one per `app/student/*` page.

### `/api/parent/*` (parent role — auto-scoped to the parent's linked child)
`/dashboard`, `/child-details`, `/attendance`, `/fees`, `/results`,
`/homework`, `/timetable`, `/notifications`, `/profile` — one per
`app/parent/*` page.

### `/api/accountant/*` (accountant role)
`/dashboard`, `/student-fees`, `/fee-collection` (GET + POST to record a
payment — auto-creates a receipt and marks the invoice Paid), `/pending-fees`,
`/income` (GET + POST), `/expenses` (GET + POST), `/reports`, `/receipts`,
`/profile` — one per `app/accountant/*` page.

## 5. Database

See `src/db/schema.sql` for the full table layout and `src/db/seed.sql`
for demo data — both translated directly from `lib/mock-data.ts` field
names (`id`, `name`, `grade`, `status`, `due`, `amount`, etc.) so the JSON
the API returns matches what the UI components already expect.

The mock store starts pre-seeded with full operational data and the four demo login users (bcrypt-hashed), linking each to its student/parent/accountant records.

## 6. Project layout

```
server.js                  entrypoint
src/
  app.js                   Express app + route mounting
  config/
    db.js                  Database facade pointing to mockStore
    mockStore.js           In-memory operational store & query engine
  middleware/auth.js       JWT verification + role guard
  middleware/errorHandler.js
  utils/jwt.js             sign/verify helpers
  utils/generateId.js      sequential IDs like STU-1050, INV-8846
  routes/
    auth.routes.js
    admin.routes.js
    student.routes.js
    parent.routes.js
    accountant.routes.js
    database.routes.js
```

## 7. Notes / next steps

- Currency fields (`amount`, `balance`, `total`, `paid`) are formatted as
  `"$1,250"` strings server-side to match the mock data exactly — if you'd
  rather format on the client, drop the `CONCAT('$', FORMAT(...))` wrapping
  in the SQL and return raw `DECIMAL` values instead.
- `assignments`, `results`, and `homework` are seeded only for the demo
  student (`STU-1042`) — add rows for other students as needed.
- Add a `settings` table if you want `/api/admin/settings` to persist
  rather than echo back what's posted.
