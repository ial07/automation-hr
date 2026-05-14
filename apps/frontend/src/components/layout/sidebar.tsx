"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserRole, hasMinimumRole, ROLE_LABELS } from "@/lib/auth/roles";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { 
  LayoutDashboard, 
  MessageSquare, 
  CalendarDays, 
  Clock, 
  Timer, 
  Receipt, 
  UserCircle, 
  CheckSquare, 
  Building2, 
  Files, 
  PieChart, 
  Settings,
  LogOut
} from "lucide-react";

interface SidebarProps {
  userRole: UserRole;
  fullName: string | null;
  email: string;
}

const baseNavItems = [
  { href: "/dashboard", label: "Dashboard", minRole: "employee" as UserRole, icon: LayoutDashboard },
  { href: "/dashboard/chat", label: "Asisten HR", minRole: "employee" as UserRole, icon: MessageSquare },
  { href: "/dashboard/leave", label: "Pengajuan Cuti", minRole: "employee" as UserRole, icon: CalendarDays },
  { href: "/dashboard/attendance", label: "Absensi", minRole: "employee" as UserRole, icon: Clock },
  { href: "/dashboard/overtime", label: "Pengajuan Lembur", minRole: "employee" as UserRole, icon: Timer },
  { href: "/dashboard/payroll", label: "Slip Gaji", minRole: "employee" as UserRole, icon: Receipt },
  { href: "/dashboard/employee", label: "Profil Saya", minRole: "employee" as UserRole, icon: UserCircle },
];

const managerNavItems = [
  { href: "/dashboard/leave/approvals", label: "Persetujuan Cuti", minRole: "manager" as UserRole, icon: CheckSquare },
  { href: "/dashboard/overtime/approvals", label: "Persetujuan Lembur", minRole: "manager" as UserRole, icon: CheckSquare },
];

const hrNavItems = [
  { href: "/dashboard/hr", label: "HR Management", minRole: "hr" as UserRole, icon: Building2 },
  { href: "/dashboard/hr/documents", label: "HR Documents", minRole: "hr" as UserRole, icon: Files },
  { href: "/dashboard/hr/insights", label: "HR Insights", minRole: "hr" as UserRole, icon: PieChart },
];

const adminNavItems = [
  { href: "/dashboard/admin", label: "Admin Panel", minRole: "owner" as UserRole, icon: Settings },
];

export function Sidebar({ userRole, fullName, email }: SidebarProps) {
  const pathname = usePathname();
  const { logout, isLoggingOut } = useAuth();

  const renderNavGroup = (title: string, items: typeof baseNavItems) => {
    if (items.length === 0) return null;
    return (
      <div className="mb-6">
        <h4 className="px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
          {title}
        </h4>
        <ul className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-4 py-2 text-sm font-medium transition-all relative group",
                    isActive
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  {isActive && (
                    <span className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-md" />
                  )}
                  <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    );
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-64 bg-card border-r flex flex-col h-screen shadow-sm">
      <div className="p-6 border-b flex items-center gap-3">
        <div className="bg-primary/10 p-2 rounded-xl border border-primary/20">
          <Building2 className="w-6 h-6 text-primary" />
        </div>
        <div>
          <h1 className="font-bold text-lg tracking-tight leading-tight">AutomationHR</h1>
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
            Workspace
          </p>
        </div>
      </div>

      <nav className="flex-1 py-6 overflow-y-auto custom-scrollbar">
        {renderNavGroup("Personal", baseNavItems)}
        {hasMinimumRole(userRole, "manager") && renderNavGroup("Team Approvals", managerNavItems)}
        {hasMinimumRole(userRole, "hr") && renderNavGroup("HR Admin", hrNavItems)}
        {hasMinimumRole(userRole, "owner") && renderNavGroup("System", adminNavItems)}
      </nav>

      <div className="p-4 border-t bg-muted/20">
        <div className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-muted/50 transition-colors">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-indigo-400 flex items-center justify-center text-primary-foreground font-bold shadow-md ring-2 ring-background">
            {getInitials(fullName, email)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold truncate text-foreground">{fullName || email.split('@')[0]}</p>
            <p className="text-xs text-muted-foreground truncate font-medium">
              {ROLE_LABELS[userRole]}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 hover:border-destructive/30 transition-colors"
          onClick={() => logout()}
          disabled={isLoggingOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isLoggingOut ? "Signing Out..." : "Sign Out"}
        </Button>
      </div>
    </aside>
  );
}
