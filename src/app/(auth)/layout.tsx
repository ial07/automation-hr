// Force dynamic for all auth pages to prevent static prerendering
// (Supabase client requires environment variables at runtime)
export const dynamic = "force-dynamic";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
