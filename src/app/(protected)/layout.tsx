import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { Sidebar } from "@/components/layout/sidebar";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar
        userRole={session.role}
        fullName={session.fullName}
        email={session.email}
      />
      <main className="flex-1 p-6 overflow-auto">{children}</main>
    </div>
  );
}
