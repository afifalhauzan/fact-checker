import { randomUUID } from "crypto";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    return NextResponse.json(
      {
        id: randomUUID(),
      },
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: "Failed to initialize conversation",
        details: error instanceof Error ? error.message : "Unknown error occurred",
      },
      { status: 500 }
    );
  }
}