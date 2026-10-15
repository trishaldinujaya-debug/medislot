# MediSlot — Appointment Management System

MediSlot is a web-based appointment management application built to simplify appointment scheduling and record management through a user-friendly dashboard.

## Live Demo

- **Live Application:** https://medislot-gilt.vercel.app/
- **GitHub Repository:** https://github.com/trishaldinujaya-debug/medislot

## Features

- **Dashboard:** View appointment statistics and scheduled appointments.
- **Create appointments:** Record patient names, appointment dates and times, doctors, and appointment types.
- **View appointments:** Display appointment records in the application.
- **Edit appointments:** Update existing appointment information.
- **Delete appointments:** Remove appointment records.
- **Search:** Find appointments by patient name, doctor, or appointment type.
- **Filter:** Filter appointments by status.
- **Status management:** Manage Scheduled, Completed, and Cancelled appointments.
- **Database integration:** Store appointment records in PostgreSQL.
- **REST API:** Manage appointment data through Next.js API routes.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Neon — hosted PostgreSQL database
- Node.js and npm
- Git and GitHub
- Vercel — application deployment

## Getting Started

### Prerequisites

- Node.js and npm
- Access to a PostgreSQL database
- Git

### 1. Clone the repository

```bash
git clone https://github.com/trishaldinujaya-debug/medislot.git
cd medislot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the project root:

```env
DATABASE_URL="your_postgresql_connection_string"
```

Replace the placeholder with your own valid PostgreSQL connection string. Keep database credentials private and never commit `.env.local` to GitHub.

### 4. Set up the database

Create a PostgreSQL database and configure the `appointments` table to match the application's schema. For the hosted application, the database is provided by Neon.

### 5. Run the development server

```bash
npm run dev
```

Open http://localhost:3000 in your browser.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check database connectivity |
| GET | `/api/appointments` | Retrieve appointments |
| POST | `/api/appointments` | Create an appointment |
| PATCH | `/api/appointments/[id]` | Update an appointment |
| DELETE | `/api/appointments/[id]` | Delete an appointment |

## Testing

The live application has been manually tested for the following features:

- Creating appointments
- Viewing appointments
- Editing appointments
- Deleting appointments
- Searching appointments
- Filtering appointments

The production database health endpoint has also been verified.

## Production Build

Run the following command to create a production build:

```bash
npm run build
```

## Deployment

The application is deployed on Vercel and uses Neon PostgreSQL for persistent database storage.

- **Production URL:** https://medislot-gilt.vercel.app/

Configure `DATABASE_URL` in the deployment environment before deploying your own instance.

## Future Improvements

- User authentication and role-based access
- Appointment reminders
- Pagination and advanced filtering
- Automated testing

## Author

**Dinujaya Fernando**

GitHub: https://github.com/trishaldinujaya-debug

---

**MediSlot — Simplifying appointment management.**
