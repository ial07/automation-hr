export const authService = {
  async signOut() {
    await fetch("/api/auth/logout", { method: "POST" });
  },
};
