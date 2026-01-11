"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole, hasMinimumRole, ROLE_LABELS } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

interface SidebarProps {
  userRole: UserRole;
  fullName: string | null;
  email: string;
}

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", minRole: "employee" as UserRole },
  {
    href: "/dashboard/chat",
    label: "Asisten HR",
    minRole: "employee" as UserRole,
  },
  {
    href: "/dashboard/leave",
    label: "Pengajuan Cuti",
    minRole: "employee" as UserRole,
  },
  {
    href: "/dashboard/attendance",
    label: "Absensi",
    minRole: "employee" as UserRole,
  },
  {
    href: "/dashboard/overtime",
    label: "Pengajuan Lembur",
    minRole: "employee" as UserRole,
  },
  {
    href: "/dashboard/payroll",
    label: "Slip Gaji",
    minRole: "employee" as UserRole,
  },
  {
    href: "/dashboard/employee",
    label: "My Profile",
    minRole: "employee" as UserRole,
  },
];

const managerNavItems = [
  {
    href: "/dashboard/leave/approvals",
    label: "Persetujuan Cuti",
    minRole: "manager" as UserRole,
  },
  {
    href: "/dashboard/overtime/approvals",
    label: "Persetujuan Lembur",
    minRole: "manager" as UserRole,
  },
];

const hrNavItems = [
  { href: "/dashboard/hr", label: "HR Management", minRole: "hr" as UserRole },
  {
    href: "/dashboard/hr/documents",
    label: "HR Documents",
    minRole: "hr" as UserRole,
  },
  {
    href: "/dashboard/hr/insights",
    label: "HR Insights",
    minRole: "hr" as UserRole,
  },
];

const adminNavItems = [
  {
    href: "/dashboard/admin",
    label: "Admin Panel",
    minRole: "owner" as UserRole,
  },
];

export function Sidebar({ userRole, fullName, email }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();

  const allNavItems = [
    ...baseNavItems,
    ...(hasMinimumRole(userRole, "manager") ? managerNavItems : []),
    ...(hasMinimumRole(userRole, "hr") ? hrNavItems : []),
    ...(hasMinimumRole(userRole, "owner") ? adminNavItems : []),
  ];

  return (
    <aside className="w-64 bg-muted/40 border-r flex flex-col h-screen">
      <div className="p-6 border-b">
        <h1 className="font-bold text-lg">HR Platform</h1>
        <p className="text-xs text-muted-foreground mt-1">
          AI-Powered Automation
        </p>
      </div>

      <nav className="flex-1 p-4">
        <ul className="space-y-1">
          {allNavItems.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "block px-3 py-2 rounded-md text-sm transition-colors",
                  pathname === item.href
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted"
                )}
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <div className="p-4 border-t">
        <div className="mb-3">
          <p className="text-sm font-medium truncate">{fullName || email}</p>
          <p className="text-xs text-muted-foreground">
            {ROLE_LABELS[userRole]}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          {isLoggingOut ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>
    </aside>
  );
}
