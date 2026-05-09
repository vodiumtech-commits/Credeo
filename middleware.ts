import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const vendorPhone = req.cookies.get("vodium_phone")?.value;
  const adminCookie = req.cookies.get("vodium_admin")?.value;
  const adminSecret = process.env.ADMIN_SECRET;

  if (pathname.startsWith("/dashboard")) {
    if (!vendorPhone) {
      const url = req.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!adminCookie || !adminSecret || adminCookie !== adminSecret) {
      const url = req.nextUrl.clone();
      url.pathname = "/admin/login";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
