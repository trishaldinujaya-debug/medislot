
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const result = await db.query(
      "SELECT current_database() AS database"
    );

    return NextResponse.json({
      status: "ok",
      database: result.rows[0].database,
    });
  } catch (error) {
    console.error("Database connection failed:", error);

    return NextResponse.json(
      { status: "error", message: "Database connection failed" },
      { status: 503 }
    );
  }
}
