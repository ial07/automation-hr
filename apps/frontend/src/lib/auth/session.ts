import { getSessionFromCookie, SessionPayload } from "@/lib/auth/jwt";
import { UserRole } from "./roles";

export interface UserSession {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
}

/**
 * Get the current user session from JWT cookie (server-side)
 */
export async function getSession(): Promise<UserSession | null> {
  const session = await getSessionFromCookie();

  if (!session) {
    return null;
  }

  return {
    id: session.userId,
    email: session.email,
    fullName: session.fullName,
    role: session.role,
  };
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}
