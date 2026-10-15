# MediSlot — Appointment Management System

MediSlot is a web-based appointment management application designed to help manage patient appointments through a simple dashboard. It supports creating appointments, viewing schedules, searching records, updating appointment statuses, and deleting appointments.

## Features

- **Dashboard:** View appointment statistics and today's schedule.
- **Create appointments:** Record patient names, appointment dates and times, doctors, and appointment types.
- **Manage appointments:** View and delete appointment records.
- **Update status:** Mark appointments as Scheduled, Completed, or Cancelled.
- **Search:** Find appointments by patient name, doctor, or appointment type.
- **Filter:** Filter appointments by status.
- **Database integration:** Store appointment records in PostgreSQL.
- **REST API:** Manage appointment data through Next.js API routes.

## Technology Stack

- Next.js
- React
- TypeScript
- Tailwind CSS
- PostgreSQL
- Node.js
- Git and GitHub

## Getting Started

### Prerequisites

Install the following tools before running the application:

- Node.js and npm
- PostgreSQL
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

Create a `.env.local` file in the project root and add your PostgreSQL connection string:

```env
DATABASE_URL=your_postgresql_connection_string
```

Replace the placeholder with your own database connection string. Never commit `.env.local` or publish database credentials.

### 4. Set up the database

Create a PostgreSQL database named `medislot` and ensure the `appointments` table has the schema required by the application.

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Check database connectivity |
| GET | `/api/appointments` | Retrieve appointments |
| POST | `/api/appointments` | Create an appointment |
| PATCH | `/api/appointments/[id]` | Update appointment status |
| DELETE | `/api/appointments/[id]` | Delete an appointment |

## Production Build

To check and build the application for production:

```bash
npm run build
```

## Project Repository

[View MediSlot on GitHub](https://github.com/trishaldinujaya-debug/medislot)

## Future Improvements

- User authentication and role-based access
- Appointment reminders
- Pagination and advanced filtering
- Automated testing
- Production deployment

---

**MediSlot** — Simplifying appointment management.
