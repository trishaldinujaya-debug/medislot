import { NextResponse } from "next/server";
import { db } from "@/lib/db";

const allowedStatuses = ["Scheduled", "Completed", "Cancelled"];

function formatAppointment(row: {
  id: string;
  patient: string;
  appointment_at: Date | string;
  doctor: string;
  type: string;
  status: string;
}) {
  const appointmentDate = new Date(row.appointment_at);

  return {
    id: row.id,
    patient: row.patient,
    initials: row.patient
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0].toUpperCase())
      .join(""),
    doctor: row.doctor,
    specialty: "",
    date: new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Colombo",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(appointmentDate),
    time: new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Colombo",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(appointmentDate),
    type: row.type,
    status: row.status,
    color: "bg-teal-100 text-teal-700",
  };
}

export async function GET() {
  try {
    const result = await db.query(`
      SELECT
        id,
        patient_name AS patient,
        appointment_at,
        doctor_name AS doctor,
        appointment_type AS type,
        status
      FROM appointments
      ORDER BY appointment_at ASC
    `);

    return NextResponse.json(result.rows.map(formatAppointment));
  } catch (error) {
    console.error("Failed to fetch appointments:", error);

    return NextResponse.json(
      { message: "Failed to fetch appointments." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patient, date, time, doctor, type, status = "Scheduled" } = body;

    if (
      typeof patient !== "string" ||
      !patient.trim() ||
      patient.trim().length > 120 ||
      typeof doctor !== "string" ||
      !doctor.trim() ||
      doctor.trim().length > 120 ||
      typeof type !== "string" ||
      !type.trim() ||
      type.trim().length > 80 ||
      typeof date !== "string" ||
      !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
      typeof time !== "string" ||
      !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) ||
      typeof status !== "string" ||
      !allowedStatuses.includes(status)
    ) {
      return NextResponse.json(
        { message: "Please provide valid appointment details." },
        { status: 400 },
      );
    }

    const appointmentDate = new Date(`${date}T${time}:00+05:30`);

    if (
      Number.isNaN(appointmentDate.getTime()) ||
      appointmentDate.toISOString().slice(0, 10) !== date
    ) {
      return NextResponse.json(
        { message: "Invalid appointment date." },
        { status: 400 },
      );
    }

    const result = await db.query(
      `INSERT INTO appointments
        (patient_name, appointment_at, doctor_name, appointment_type, status)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, patient_name AS patient, appointment_at,
                 doctor_name AS doctor, appointment_type AS type, status`,
      [
        patient.trim(),
        appointmentDate.toISOString(),
        doctor.trim(),
        type.trim(),
        status,
      ],
    );

    return NextResponse.json(
      formatAppointment(result.rows[0]),
      { status: 201 },
    );
  } catch (error) {
    console.error("Failed to create appointment:", error);

    return NextResponse.json(
      { message: "Failed to create appointment." },
      { status: 500 },
    );
  }
}