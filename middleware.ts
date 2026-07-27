import { NextResponse, type NextRequest } from "next/server";
const cookieName = process.env.SESSION_COOKIE_NAME ?? "alpha_session";
export function middleware(request: NextRequest) {
  if (!request.cookies.has(cookieName)) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }
  return NextResponse.next();
}
export const config = { matcher: ["/admin/:path*"] };
