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

    if (
      typeof body.status !== "string" ||
      !allowedStatuses.includes(body.status)
    ) {
      return NextResponse.json(
        { message: "Invalid appointment status." },
        { status: 400 },
      );
    }

    const result = await db.query(
      `UPDATE appointments
       SET status = $1
       WHERE id = $2
       RETURNING id`,
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
  } catch (error) {
    console.error("Failed to update appointment:", error);

    return NextResponse.json(
      { message: "Failed to update appointment status." },
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
      `DELETE FROM appointments
       WHERE id = $1
       RETURNING id`,
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