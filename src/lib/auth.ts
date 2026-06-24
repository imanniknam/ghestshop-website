/**
 * GhestShop — Session & Role-Based Access Control (RBAC)
 * ------------------------------------------------------------------
 * Server-only auth primitives backed by the Prisma `Session` model. A signed
 * session token is read from an httpOnly cookie, resolved to its `User`, and
 * checked for expiry / active status. `requireRole` is the guard every Server
 * Action calls before touching financial data.
 */

import 'server-only';
import { cookies } from 'next/headers';
import type { User, UserRole } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const SESSION_COOKIE = 'ghestshop_session';

/** Thrown when authentication or authorization fails. Carries a Persian message. */
export class AuthError extends Error {
  readonly code: 'UNAUTHENTICATED' | 'FORBIDDEN';
  constructor(code: 'UNAUTHENTICATED' | 'FORBIDDEN', message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

/** Resolve the current user from the session cookie, or null if none/expired. */
export async function getSessionUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!session) return null;
  if (session.expiresAt.getTime() < Date.now()) return null;
  if (!session.user.isActive) return null;

  return session.user;
}

/** Require an authenticated, active user. Throws AuthError otherwise. */
export async function requireUser(): Promise<User> {
  const user = await getSessionUser();
  if (!user) {
    throw new AuthError('UNAUTHENTICATED', 'برای انجام این عملیات باید وارد حساب کاربری شوید.');
  }
  return user;
}

/** Require the current user to hold one of the allowed roles. */
export async function requireRole(roles: readonly UserRole[]): Promise<User> {
  const user = await requireUser();
  if (!roles.includes(user.role)) {
    throw new AuthError('FORBIDDEN', 'شما مجوز دسترسی به این بخش را ندارید.');
  }
  return user;
}
