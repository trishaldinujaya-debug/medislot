import { NextResponse } from "next/server";
import { db } from "@/lib/db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const allowedStatuses = ["Scheduled", "Completed", "Cancelled"];

export async function PATCH(
  request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Update only the appointment status.
    if (
      Object.keys(body).length === 1 &&
      typeof body.status === "string"
    ) {
      if (!allowedStatuses.includes(body.status)) {
        return NextResponse.json(
          { message: "Invalid appointment status." },
          { status: 400 },
        );
      }

      const result = await db.query(
        "UPDATE appointments SET status = $1 WHERE id = $2 RETURNING id",
        [body.status, id],
      );

      if (result.rowCount === 0) {
        return NextResponse.json(
          { message: "Appointment not found." },
          { status: 404 },
        );
      }

      return NextResponse.json({
        message: "Appointment status updated successfully.",
      });
    }

    // Validate the complete appointment details.
    const { patient, date, time, doctor, type, status } = body;

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

    // Validate the calendar date.
    const dateParts = date.split("-");
    const year = Number(dateParts[0]);
    const month = Number(dateParts[1]);
    const day = Number(dateParts[2]);

    const validDate =
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= new Date(Date.UTC(year, month, 0)).getUTCDate();

    if (!validDate) {
      return NextResponse.json(
        { message: "Invalid appointment date or time." },
        { status: 400 },
      );
    }

    // Interpret the submitted date and time as Sri Lankan local time.
    const appointmentDate = new Date(
      date + "T" + time + ":00+05:30",
    );

    if (Number.isNaN(appointmentDate.getTime())) {
      return NextResponse.json(
        { message: "Invalid appointment date or time." },
        { status: 400 },
      );
    }

    // Save the updated appointment.
    const result = await db.query(
      "UPDATE appointments " +
        "SET patient_name = $1, " +
        "appointment_at = $2, " +
        "doctor_name = $3, " +
        "appointment_type = $4, " +
        "status = $5 " +
        "WHERE id = $6 " +
        "RETURNING id",
      [
        patient.trim(),
        appointmentDate.toISOString(),
        doctor.trim(),
        type.trim(),
        status,
        id,
      ],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Appointment not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Appointment updated successfully.",
    });
  } catch (error) {
    console.error("Failed to update appointment:", error);

    return NextResponse.json(
      { message: "Failed to update appointment." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: RouteContext,
) {
  try {
    const { id } = await params;

    const result = await db.query(
      "DELETE FROM appointments WHERE id = $1 RETURNING id",
      [id],
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { message: "Appointment not found." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      message: "Appointment deleted successfully.",
    });
  } catch (error) {
    console.error("Failed to delete appointment:", error);

    return NextResponse.json(
      { message: "Failed to delete appointment." },
      { status: 500 },
    );
  }
}
