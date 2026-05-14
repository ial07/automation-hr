import { UserRole } from "@/lib/auth/roles";

export type UserProfile = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  created_at?: string;
  updated_at?: string;
};

export const userService = {
  /**
   * Get the current user's profile from session API
   */
  async getCurrentUserProfile(): Promise<UserProfile | null> {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me`, { credentials: "include" });
      if (!res.ok) return null;
      const data = await res.json();
      return data.user;
    } catch {
      return null;
    }
  },
};
