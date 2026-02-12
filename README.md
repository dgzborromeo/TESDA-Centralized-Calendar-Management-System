# TESDA Calendar System

A full-stack web-based calendar with user authentication, event creation, month/week/day views, and automatic conflict detection.

## Tech Stack

- **Frontend:** React 18, React Router, Vite, CSS (responsive, dark theme)
- **Backend:** Node.js, Express, JWT auth, bcrypt
- **Database:** MySQL (XAMPP)

## Features

- **Auth:** Login, Register, Remember me, Forgot password link (placeholder), hashed passwords, roles (admin / user)
- **Dashboard:** Summary cards (today/week/month events, conflicts), quick actions, search/filter upcoming events by name/location, upcoming events list with conflict indicators
- **Calendar:** Month / Week / Day view, prev/next navigation, search events (q), event blocks, conflict highlighting (red/warning), **drag & drop to reschedule** (drop on day or time slot), event details modal (Edit/Delete)
- **Events:** Create/Edit form with title, type, date, start/end time, location, participants, description, color; validation (end > start); real-time conflict check; optional "Save anyway" on conflict
- **Conflict detection:** Overlapping events on same date; conflicts table for logging; API endpoint to check before save

## Setup

### 1. Database

1. Start MySQL (XAMPP Control Panel → Start MySQL).
2. Create database and tables:

```bash
# In MySQL (phpMyAdmin or mysql CLI):
mysql -u root -p < database/schema.sql
```

Or run the contents of `database/schema.sql` in phpMyAdmin.

3. (Optional) Create default admin user:

```bash
cd backend
npm install
node scripts/seed-admin.js
```

Default admin: **admin@tesda.gov** / **admin123**
Default OSEC admin: **osec@tesda.gov.ph** / **osec123**

### 2. Backend

```bash
cd backend
npm install
# Edit .env if needed (DB_PASSWORD, JWT_SECRET)
npm run dev
```

API runs at **http://localhost:3001**

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at **http://localhost:5174** (proxies `/api` to backend).

## Project Structure

```
TESDA_CMS/
├── backend/           # Express API
│   ├── config/db.js
│   ├── middleware/auth.js
│   ├── routes/auth.js, events.js, users.js
│   ├── utils/conflictDetection.js
│   ├── scripts/seed-admin.js
│   └── server.js
├── frontend/          # React SPA
│   └── src/
│       ├── api.js, context/AuthContext.jsx
│       ├── components/ Header, Layout, EventModal
│       └── pages/ Login, Register, Dashboard, Calendar, EventForm
├── database/
│   └── schema.sql     # MySQL schema
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register (name, email, password) |
| POST | /api/auth/login | Login (email, password, remember?) |
| GET | /api/auth/me | Current user (Bearer token) |
| GET | /api/events | List events (?start=&end=&date=) |
| GET | /api/events/conflicts | Conflict count |
| GET | /api/events/:id | Event details + attendees + conflicts |
| POST | /api/events | Create event (body) |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |
| POST | /api/events/check-conflict | Check conflict (date, start_time, end_time, exclude_event_id?) |
| GET | /api/users | List users (for attendees) |

## Roles

- **Admin:** Can manage all events and users.
- **User:** Can manage only their own events; sees only own events in list/calendar (except as attendee).

## Conflict Logic

Two events conflict when they share the same date and:

`start_time < other_end_time AND end_time > other_start_time`

Conflicts are stored in the `conflicts` table and returned with events; the UI shows a warning on create/edit and highlights conflicting events on the calendar.
