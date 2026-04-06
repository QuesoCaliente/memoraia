import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const API_URL = process.env.API_URL!;

export async function GET() {
  const cookieStore = await cookies();
  cookieStore.delete("token");

  return NextResponse.redirect(new URL("/auth/twitch", API_URL));
}
