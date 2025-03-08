import NextAuth from "next-auth";
import { config as authConfig } from "./auth";

export const { auth: middleware } = NextAuth(authConfig);

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
}; 