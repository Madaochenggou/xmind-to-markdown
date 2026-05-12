import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import type { UserRole } from "@/types";

const COOKIE_NAME = "lightmall_session";
const MAX_AGE = 60 * 60 * 24 * 7;

export type SessionUser = {
  id: string;
  tenantId: string | null;
  name: string;
  email: string;
  role: UserRole;
};

function getSecret() {
  return process.env.AUTH_SECRET || "lightmall-dev-secret-change-me";
}

function sign(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function encodeSession(user: SessionUser) {
  const payload = Buffer.from(JSON.stringify(user)).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

function decodeSession(value?: string): SessionUser | null {
  if (!value) return null;
  const [payload, signature] = value.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SessionUser;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.status !== "active" || !verifyPassword(password, user.passwordHash)) {
    throw new Error("邮箱或密码不正确");
  }
  const sessionUser: SessionUser = {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role as UserRole
  };
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, encodeSession(sessionUser), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/"
  });
  return sessionUser;
}

export async function logout() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const session = decodeSession(cookieStore.get(COOKIE_NAME)?.value);
  if (!session) return null;
  const user = await prisma.user.findUnique({
    where: { id: session.id },
    select: { id: true, tenantId: true, name: true, email: true, role: true, status: true }
  });
  if (!user || user.status !== "active") return null;
  return {
    id: user.id,
    tenantId: user.tenantId,
    name: user.name,
    email: user.email,
    role: user.role as UserRole
  } satisfies SessionUser;
}

export async function requireUser(roles?: UserRole[]) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  if (roles && !roles.includes(user.role)) redirect("/admin/login");
  return user;
}

export async function requireAdmin() {
  return requireUser(["platform_admin", "merchant_admin"]);
}

export async function requireCustomer() {
  return requireUser(["customer"]);
}
