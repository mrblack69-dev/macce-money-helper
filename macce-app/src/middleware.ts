import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for") || "unknown"

  console.log("Request IP:", ip)

  return NextResponse.next()
}

export const config = {
  matcher: ["/api/:path*"],
}