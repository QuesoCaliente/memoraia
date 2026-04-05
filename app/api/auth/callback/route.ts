import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const API_URL = process.env.API_URL!;
const FRONTEND_URL =
  process.env.NEXT_PUBLIC_FRONTEND_URL || "http://localhost:3000";

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/error", FRONTEND_URL));
  }

  try {
    const res = await fetch(`${API_URL}/auth/me`, {
      headers: { Cookie: `token=${token}` },
    });

    if (!res.ok) {
      return NextResponse.redirect(new URL("/auth/error", FRONTEND_URL));
    }

    return NextResponse.redirect(new URL("/dashboard", FRONTEND_URL));
  } catch {
    return NextResponse.redirect(new URL("/auth/error", FRONTEND_URL));
  }
}
