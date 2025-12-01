/*
"use server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const PROTECTED_ROUTES = ["/dashboard", "/apps", "/modules", "/formBuilder"];
const PUBLIC_ROUTES = ["/login", "/"];

export async function middleware(request) {
  
  const { pathname } = request.nextUrl;
  const cookieStore = await cookies();
  const cookie = cookieStore.get("session")?.value;

  
  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );
  
  const isPublic = PUBLIC_ROUTES.includes(pathname);

  // Redirect unauthenticated users from protected routes
  if (isProtected && !cookie) {
    console.log(" i m on 23")
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users from public pages to dashboard
  if (isPublic && cookie && !pathname.startsWith("/dashboard")) {
    console.log(" i m on 29")
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Optional: Pass custom headers (if needed in layout)
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
*/









"use server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ADMIN_PATHS, PUBLIC_PATHS } from "@/constants/paths"; // adjust path if needed

const PROTECTED_ROUTES = Object.values(ADMIN_PATHS);
const PUBLIC_ROUTES = Object.values(PUBLIC_PATHS);

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const cookieStore = await cookies(); // await the cookies
  const cookie = cookieStore.get("session")?.value;

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  const isPublic = PUBLIC_ROUTES.includes(pathname);
/*
  // Redirect unauthenticated users from protected routes
  if (isProtected && !cookie) {
    console.log("Redirecting unauthenticated user to login");
    return NextResponse.redirect(new URL(PUBLIC_PATHS.LOGIN, request.url));
  }

  // Redirect authenticated users from public pages to dashboard
  if (isPublic && cookie && pathname !== ADMIN_PATHS.DASHBOARD) {
    console.log("Redirecting authenticated user to dashboard");
    return NextResponse.redirect(new URL(ADMIN_PATHS.DASHBOARD, request.url));
  }
*/
  // Redirect unauthenticated users from protected routes
  if (isProtected && !cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users from public pages to dashboard
  if (isPublic && cookie && !pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }
  // Optional: Pass custom headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}




























/*

ON HOLD

"use server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";


const PUBLIC_ROUTES = ["/login", "/"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  const cookieStore = cookies(); // not async
  const cookie = cookieStore.get("session")?.value;

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isProtected = !isPublic;

  // Redirect unauthenticated users from protected routes
  if (isProtected && !cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from public routes
  if (isPublic && cookie && pathname !== "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Optional: Add custom headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
*/
/*
"use server";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

const PUBLIC_ROUTES = ["/login", "/"];

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  // Ignore static files, API routes, and _next (internal Next.js files)
  const isStatic = pathname.startsWith("/_next") || pathname.startsWith("/static");
  const isFile = pathname.includes("."); // e.g., .css, .js, .png
  const isAPI = pathname.startsWith("/api");

  if (isStatic || isFile || isAPI) {
    return NextResponse.next(); // skip middleware for these
  }

  const cookieStore = cookies();
  const cookie = cookieStore.get("session")?.value;

  const isPublic = PUBLIC_ROUTES.includes(pathname);
  const isProtected = !isPublic;

  // Redirect unauthenticated users from protected routes
  if (isProtected && !cookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect authenticated users away from public routes
  if (isPublic && cookie && pathname !== "/dashboard") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // Optional: Add custom headers
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
*/