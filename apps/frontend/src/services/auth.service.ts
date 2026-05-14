export const authService = {
  async signOut() {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, { method: "POST" });
  },
};
