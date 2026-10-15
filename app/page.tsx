"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type Status = "Scheduled" | "Completed" | "Cancelled";

type Appointment = {
  id: string | number;
  patient: string;
  initials?: string;
  doctor: string;
  specialty?: string;
  date: string;
  time: string;
  type: string;
  status: Status;
  color?: string;
};

type AppointmentForm = {
  patient: string;
  date: string;
  time: string;
  doctor: string;
  type: string;
  status: Status;
};

const emptyForm: AppointmentForm = {
  patient: "",
  date: "",
  time: "09:00",
  doctor: "",
  type: "General Consultation",
  status: "Scheduled",
};

const statusStyles: Record<Status, string> = {
  Scheduled: "bg-blue-50 text-blue-700 ring-blue-100",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-100",
  Cancelled: "bg-rose-50 text-rose-700 ring-rose-100",
};

const appointmentTypes = [
  "General Consultation",
  "Follow-up",
  "Dental",
  "Cardiology",
  "Dermatology",
  "Eye Examination",
  "Laboratory Test",
  "Other",
];

const inputClass =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100";

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatDate(date: string) {
  const parts = date.split("-").map(Number);

  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return date;
  }

  return new Date(parts[0], parts[1] - 1, parts[2], 12).toLocaleDateString(
    "en-GB",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    },
  );
}

function formatTime(time: string) {
  const parts = time.split(":");
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);

  if (
    parts.length !== 2 ||
    !Number.isInteger(hours) ||
    !Number.isInteger(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return time;
  }

  return `${hours % 12 || 12}:${String(minutes).padStart(2, "0")} ${
    hours >= 12 ? "PM" : "AM"
  }`;
}

function getTodayInColombo() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Colombo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const values: Record<string, string> = {};

  for (const part of parts) {
    values[part.type] = part.value;
  }

  return `${values.year}-${values.month}-${values.day}`;
}

async function readError(response: Response, fallback: string) {
  try {
    const data = await response.json();
    return typeof data.message === "string" ? data.message : fallback;
  } catch {
    return fallback;
  }
}

function StatCard({
  label,
  value,
  detail,
  icon,
  accent,
}: {
  label: string;
  value: number;
  detail: string;
  icon: string;
  accent: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            {value}
          </p>
        </div>
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-xl ${accent}`}
        >
          {icon}
        </div>
      </div>
      <p className="mt-4 text-xs text-slate-500">{detail}</p>
    </div>
  );
}

export default function Home() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [today, setToday] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [dateFilter, setDateFilter] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<AppointmentForm>(emptyForm);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadAppointments = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/appointments", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not load appointments."),
        );
      }

      const data: Appointment[] = await response.json();
      setAppointments(data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not connect to the appointments API.",
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    setToday(getTodayInColombo());
    void loadAppointments();
  }, [loadAppointments]);

  const todaysAppointments = useMemo(
    () => appointments.filter((item) => item.date === today),
    [appointments, today],
  );

  const upcomingAppointments = useMemo(
    () =>
      appointments.filter(
        (item) => item.date >= today && item.status === "Scheduled",
      ),
    [appointments, today],
  );

  const completedAppointments = useMemo(
    () => appointments.filter((item) => item.status === "Completed"),
    [appointments],
  );

  const cancelledAppointments = useMemo(
    () => appointments.filter((item) => item.status === "Cancelled"),
    [appointments],
  );

  const scheduledCount = appointments.filter(
    (item) => item.status === "Scheduled",
  ).length;

  const filteredAppointments = useMemo(() => {
    const query = search.trim().toLowerCase();

    return appointments
      .filter((item) => {
        const matchesSearch =
          !query ||
          item.patient.toLowerCase().includes(query) ||
          item.doctor.toLowerCase().includes(query) ||
          item.type.toLowerCase().includes(query);

        const matchesStatus =
          statusFilter === "All" || item.status === statusFilter;

        const matchesDate =
          dateFilter === "All" ||
          (dateFilter === "Today" && item.date === today) ||
          (dateFilter === "Upcoming" &&
            item.date >= today &&
            item.status === "Scheduled");

        return matchesSearch && matchesStatus && matchesDate;
      })
      .sort((a, b) =>
        `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`),
      );
  }, [appointments, search, statusFilter, dateFilter, today]);

  function openCreateModal() {
    setForm({
      ...emptyForm,
      date: today || getTodayInColombo(),
    });
    setError("");
    setNotice("");
    setIsModalOpen(true);
  }

  function closeModal() {
    if (!isSaving) {
      setIsModalOpen(false);
      setError("");
    }
  }

  async function handleCreateAppointment(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setError("");
    setNotice("");

    if (
      !form.patient.trim() ||
      !form.doctor.trim() ||
      !form.date ||
      !form.time ||
      !form.type
    ) {
      setError("Please complete all required fields.");
      return;
    }

    if (form.date < (today || getTodayInColombo())) {
      setError("Appointment date cannot be in the past.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient: form.patient.trim(),
          date: form.date,
          time: form.time,
          doctor: form.doctor.trim(),
          type: form.type,
          status: form.status,
        }),
      });

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not create the appointment."),
        );
      }

      const created: Appointment = await response.json();

      setAppointments((current) => [...current, created]);
      setIsModalOpen(false);
      setForm(emptyForm);
      setNotice("Appointment created successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleStatusChange(
    appointment: Appointment,
    newStatus: Status,
  ) {
    if (appointment.status === newStatus) return;

    setError("");
    setNotice("");

    const previousStatus = appointment.status;

    setAppointments((current) =>
      current.map((item) =>
        item.id === appointment.id ? { ...item, status: newStatus } : item,
      ),
    );

    try {
      const response = await fetch(
        `/api/appointments/${encodeURIComponent(String(appointment.id))}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: newStatus }),
        },
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not update the appointment."),
        );
      }

      setNotice(`Appointment marked ${newStatus.toLowerCase()}.`);
    } catch (err) {
      setAppointments((current) =>
        current.map((item) =>
          item.id === appointment.id
            ? { ...item, status: previousStatus }
            : item,
        ),
      );

      setError(
        err instanceof Error ? err.message : "Could not update the status.",
      );
    }
  }

  async function handleDeleteAppointment(appointment: Appointment) {
    if (
      !window.confirm(
        `Delete the appointment for ${appointment.patient}? This cannot be undone.`,
      )
    ) {
      return;
    }

    setError("");
    setNotice("");

    try {
      const response = await fetch(
        `/api/appointments/${encodeURIComponent(String(appointment.id))}`,
        { method: "DELETE" },
      );

      if (!response.ok) {
        throw new Error(
          await readError(response, "Could not delete the appointment."),
        );
      }

      setAppointments((current) =>
        current.filter((item) => item.id !== appointment.id),
      );

      setNotice("Appointment deleted successfully.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not delete the appointment.",
      );
    }
  }

  const scheduledPercentage = appointments.length
    ? (scheduledCount / appointments.length) * 100
    : 0;

  const completedPercentage = appointments.length
    ? ((scheduledCount + completedAppointments.length) /
        appointments.length) *
      100
    : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col bg-slate-950 text-white lg:flex">
          <div className="flex h-20 items-center gap-3 border-b border-white/10 px-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-400 text-xl font-bold text-slate-950">
              M
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight">MediSlot</p>
              <p className="text-xs text-slate-400">Appointment manager</p>
            </div>
          </div>

          <nav className="flex-1 space-y-2 px-4 py-6">
            <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-widest text-slate-500">
              Workspace
            </p>
            <a
              href="#dashboard"
              className="flex items-center gap-3 rounded-xl bg-teal-400/10 px-4 py-3 text-sm font-semibold text-teal-300 ring-1 ring-teal-400/20"
            >
              <span>▦</span> Dashboard
            </a>
            <a
              href="#appointments"
              className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span>▤</span> Appointments
            </a>
            <button
              onClick={openCreateModal}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm text-slate-300 transition hover:bg-white/5 hover:text-white"
            >
              <span>＋</span> New appointment
            </button>
          </nav>

          <div className="m-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="text-xs font-semibold text-emerald-300">
                Demo environment
              </span>
            </div>
            <p className="text-xs leading-5 text-slate-400">
              Use fictional patient details only. Appointment records are stored
              in your PostgreSQL database.
            </p>
          </div>
        </aside>

        <main id="dashboard" className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-20 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur sm:px-8">
            <div>
              <p className="text-xs font-medium text-slate-500">
                WORKSPACE / OVERVIEW
              </p>
              <h1 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">
                Dashboard
              </h1>
            </div>

            <button
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              <span className="text-lg leading-none">＋</span>
              <span className="hidden sm:inline">New appointment</span>
              <span className="sm:hidden">New</span>
            </button>
          </header>

          <div className="mx-auto max-w-7xl space-y-7 p-4 sm:p-8">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-teal-950 p-6 text-white sm:p-8">
              <div className="relative z-10 max-w-2xl">
                <p className="text-sm font-medium text-teal-300">
                  {today ? formatDate(today) : "Your appointment workspace"}
                </p>
                <h2 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
                  Better scheduling.
                  <br />
                  A clearer day ahead.
                </h2>
                <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">
                  Manage appointments, track statuses, and keep your daily
                  schedule organised in one place.
                </p>
                <button
                  onClick={openCreateModal}
                  className="mt-6 rounded-xl bg-teal-400 px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-teal-300"
                >
                  + Create appointment
                </button>
              </div>
              <div className="pointer-events-none absolute -right-10 -top-20 h-72 w-72 rounded-full border border-teal-300/15" />
              <div className="pointer-events-none absolute -right-1 -top-10 h-56 w-56 rounded-full border border-teal-300/20" />
              <div className="pointer-events-none absolute -bottom-28 right-28 h-64 w-64 rounded-full bg-teal-400/10 blur-3xl" />
            </section>

            {notice && (
              <div
                role="status"
                className="flex items-center justify-between gap-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
              >
                <span>{notice}</span>
                <button
                  onClick={() => setNotice("")}
                  className="font-semibold"
                  aria-label="Dismiss notification"
                >
                  ×
                </button>
              </div>
            )}

            {error && !isModalOpen && (
              <div
                role="alert"
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
              >
                <span>{error}</span>
                <button
                  onClick={() => void loadAppointments()}
                  className="rounded-lg border border-rose-200 px-3 py-1.5 font-semibold hover:bg-rose-100"
                >
                  Retry
                </button>
              </div>
            )}

            <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <StatCard
                label="Total appointments"
                value={appointments.length}
                detail="All records in your workspace"
                icon="▤"
                accent="bg-slate-100 text-slate-700"
              />
              <StatCard
                label="Today's appointments"
                value={todaysAppointments.length}
                detail="Appointments scheduled for today"
                icon="▦"
                accent="bg-teal-50 text-teal-700"
              />
              <StatCard
                label="Upcoming appointments"
                value={upcomingAppointments.length}
                detail="Scheduled today and in the future"
                icon="◷"
                accent="bg-blue-50 text-blue-700"
              />
              <StatCard
                label="Completed"
                value={completedAppointments.length}
                detail={`${cancelledAppointments.length} cancelled`}
                icon="✓"
                accent="bg-emerald-50 text-emerald-700"
              />
            </section>

            <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6 xl:col-span-2">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold">Today&apos;s schedule</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      A quick look at today&apos;s appointments
                    </p>
                  </div>
                  <a
                    href="#appointments"
                    className="text-sm font-semibold text-teal-700 hover:text-teal-900"
                  >
                    View all →
                  </a>
                </div>

                <div className="mt-5 space-y-3">
                  {isLoading ? (
                    [1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-16 animate-pulse rounded-xl bg-slate-100"
                      />
                    ))
                  ) : todaysAppointments.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-slate-300 px-4 py-10 text-center">
                      <div className="text-3xl">▦</div>
                      <p className="mt-3 text-sm font-semibold text-slate-700">
                        No appointments for today
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Create an appointment to start your schedule.
                      </p>
                      <button
                        onClick={openCreateModal}
                        className="mt-4 text-sm font-semibold text-teal-700 hover:text-teal-900"
                      >
                        + Add appointment
                      </button>
                    </div>
                  ) : (
                    todaysAppointments
                      .slice()
                      .sort((a, b) => a.time.localeCompare(b.time))
                      .slice(0, 5)
                      .map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 transition hover:border-teal-100 hover:bg-teal-50/30 sm:gap-4"
                        >
                          <div className="w-16 shrink-0 text-center">
                            <p className="text-sm font-bold text-slate-800">
                              {formatTime(item.time)}
                            </p>
                          </div>
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-800">
                            {item.initials || getInitials(item.patient)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-900">
                              {item.patient}
                            </p>
                            <p className="mt-1 truncate text-xs text-slate-500">
                              {item.doctor} · {item.type}
                            </p>
                          </div>
                          <span
                            className={`hidden rounded-full px-2.5 py-1 text-xs font-semibold ring-1 sm:inline-flex ${statusStyles[item.status]}`}
                          >
                            {item.status}
                          </span>
                        </div>
                      ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
                <h2 className="text-lg font-bold">Appointment overview</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Status distribution across all records
                </p>

                <div className="mt-7 flex items-center justify-center">
                  <div
                    className="relative flex h-44 w-44 items-center justify-center rounded-full"
                    style={{
                      background: `conic-gradient(#0f766e 0% ${scheduledPercentage}%, #2563eb ${scheduledPercentage}% ${completedPercentage}%, #e11d48 ${completedPercentage}% 100%)`,
                    }}
                  >
                    <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
                      <span className="text-3xl font-bold">
                        {appointments.length}
                      </span>
                      <span className="mt-1 text-xs text-slate-500">
                        Total records
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-7 space-y-4">
                  {(
                    [
                      ["Scheduled", scheduledCount, "bg-teal-700"],
                      ["Completed", completedAppointments.length, "bg-blue-600"],
                      ["Cancelled", cancelledAppointments.length, "bg-rose-600"],
                    ] as const
                  ).map(([label, count, color]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className={`h-2.5 w-2.5 rounded-full ${color}`} />
                        <span className="text-sm text-slate-600">{label}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-900">
                        {count}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section
              id="appointments"
              className="scroll-mt-24 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 p-5 sm:p-6">
                <div>
                  <h2 className="text-lg font-bold">All appointments</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Search, filter, and manage appointment records
                  </p>
                </div>
                <button
                  onClick={openCreateModal}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-teal-300 hover:text-teal-800"
                >
                  + Add appointment
                </button>
              </div>

              <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:p-5">
                <div className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    ⌕
                  </span>
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search patient, doctor, or appointment type..."
                    aria-label="Search appointments"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-9 pr-3 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  aria-label="Filter by status"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="All">All statuses</option>
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>

                <select
                  value={dateFilter}
                  onChange={(event) => setDateFilter(event.target.value)}
                  aria-label="Filter by date"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="All">All dates</option>
                  <option value="Today">Today</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[1000px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[22%]" />
                    <col className="w-[18%]" />
                    <col className="w-[17%]" />
                    <col className="w-[19%]" />
                    <col className="w-[14%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <thead className="bg-slate-50">
                    <tr>
                      {[
                        "Patient",
                        "Doctor",
                        "Date & time",
                        "Appointment type",
                        "Status",
                        "Actions",
                      ].map((heading) => (
                        <th
                          key={heading}
                          className="whitespace-nowrap px-5 py-4 text-xs font-semibold uppercase tracking-wider text-slate-500"
                        >
                          {heading}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {isLoading ? (
                      <tr>
                        <td
                          colSpan={6}
                          className="px-5 py-12 text-center text-sm text-slate-500"
                        >
                          Loading appointments...
                        </td>
                      </tr>
                    ) : filteredAppointments.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-14 text-center">
                          <div className="text-3xl">⌕</div>
                          <p className="mt-3 text-sm font-semibold text-slate-800">
                            No appointments found
                          </p>
                          <p className="mt-1 text-sm text-slate-500">
                            Try another search or create a new appointment.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredAppointments.map((item) => (
                        <tr
                          key={item.id}
                          className="transition hover:bg-slate-50/80"
                        >
                          <td className="px-5 py-4 align-middle">
                            <div className="flex min-w-0 items-center gap-3">
                              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-700">
                                {item.initials || getInitials(item.patient)}
                              </div>
                              <span className="break-words text-sm font-semibold text-slate-800">
                                {item.patient}
                              </span>
                            </div>
                          </td>
                          <td className="break-words px-5 py-4 align-middle">
                            <p className="text-sm font-medium text-slate-800">
                              {item.doctor}
                            </p>
                            {item.specialty && (
                              <p className="mt-1 text-xs text-slate-500">
                                {item.specialty}
                              </p>
                            )}
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <p className="whitespace-nowrap text-sm font-medium text-slate-800">
                              {formatDate(item.date)}
                            </p>
                            <p className="mt-1 whitespace-nowrap text-xs text-slate-500">
                              {formatTime(item.time)}
                            </p>
                          </td>
                          <td className="break-words px-5 py-4 align-middle text-sm text-slate-600">
                            {item.type}
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <select
                              value={item.status}
                              onChange={(event) =>
                                void handleStatusChange(
                                  item,
                                  event.target.value as Status,
                                )
                              }
                              aria-label={`Change status for ${item.patient}`}
                              className={`max-w-full rounded-full px-3 py-2 text-xs font-semibold outline-none ring-1 ${statusStyles[item.status]}`}
                            >
                              <option value="Scheduled">Scheduled</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                          </td>
                          <td className="px-5 py-4 align-middle">
                            <button
                              onClick={() => void handleDeleteAppointment(item)}
                              aria-label={`Delete appointment for ${item.patient}`}
                              className="rounded-lg px-3 py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 px-5 py-4">
                <p className="text-xs text-slate-500">
                  Showing {filteredAppointments.length} of {appointments.length}{" "}
                  appointments
                </p>
                <button
                  onClick={() => void loadAppointments()}
                  disabled={isLoading}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-900 disabled:opacity-50"
                >
                  ↻ Refresh records
                </button>
              </div>
            </section>

            <footer className="flex flex-wrap items-center justify-between gap-2 pb-3 text-xs text-slate-400">
              <p>MediSlot · Appointment management demo</p>
              <p>Next.js · TypeScript · PostgreSQL</p>
            </footer>
          </div>
        </main>
      </div>

      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="create-appointment-title"
            className="my-auto w-full max-w-xl rounded-3xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-teal-700">
                  Appointment management
                </p>
                <h2
                  id="create-appointment-title"
                  className="mt-2 text-xl font-bold"
                >
                  Create appointment
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Enter the details to add a new record.
                </p>
              </div>
              <button
                onClick={closeModal}
                disabled={isSaving}
                aria-label="Close form"
                className="rounded-xl px-3 py-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateAppointment} className="space-y-5 p-6">
              {error && (
                <div
                  role="alert"
                  className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800"
                >
                  {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="patient"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Patient name *
                </label>
                <input
                  id="patient"
                  required
                  maxLength={120}
                  autoComplete="off"
                  value={form.patient}
                  onChange={(event) =>
                    setForm({ ...form, patient: event.target.value })
                  }
                  placeholder="e.g. Alex Morgan"
                  className={inputClass}
                />
              </div>

              <div>
                <label
                  htmlFor="doctor"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Doctor name *
                </label>
                <input
                  id="doctor"
                  required
                  maxLength={120}
                  autoComplete="off"
                  value={form.doctor}
                  onChange={(event) =>
                    setForm({ ...form, doctor: event.target.value })
                  }
                  placeholder="e.g. Dr. Jordan Lee"
                  className={inputClass}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="appointment-date"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Appointment date *
                  </label>
                  <input
                    id="appointment-date"
                    type="date"
                    required
                    min={today || getTodayInColombo()}
                    value={form.date}
                    onChange={(event) =>
                      setForm({ ...form, date: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>

                <div>
                  <label
                    htmlFor="appointment-time"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Appointment time *
                  </label>
                  <input
                    id="appointment-time"
                    type="time"
                    required
                    value={form.time}
                    onChange={(event) =>
                      setForm({ ...form, time: event.target.value })
                    }
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="appointment-type"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Appointment type *
                </label>
                <select
                  id="appointment-type"
                  required
                  value={form.type}
                  onChange={(event) =>
                    setForm({ ...form, type: event.target.value })
                  }
                  className={inputClass}
                >
                  {appointmentTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label
                  htmlFor="appointment-status"
                  className="mb-2 block text-sm font-semibold text-slate-700"
                >
                  Initial status
                </label>
                <select
                  id="appointment-status"
                  value={form.status}
                  onChange={(event) =>
                    setForm({
                      ...form,
                      status: event.target.value as Status,
                    })
                  }
                  className={inputClass}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isSaving}
                  className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? "Saving appointment..." : "Create appointment"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}