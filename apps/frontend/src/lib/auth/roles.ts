export type UserRole = "employee" | "manager" | "hr" | "owner";

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  owner: 4,
  hr: 3,
  manager: 2,
  employee: 1,
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  hr: "HR",
  manager: "Manager",
  employee: "Employee",
} as const;

/**
 * Check if a user role has at least the required role level
 */
export function hasMinimumRole(
  userRole: UserRole,
  requiredRole: UserRole
): boolean {
  return ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];
}

/**
 * Check if user can approve leave requests (manager, hr, owner)
 */
export function canApproveLeave(role: UserRole): boolean {
  return hasMinimumRole(role, "manager");
}

/**
 * Get accessible routes based on user role
 */
export function getAccessibleRoutes(role: UserRole): string[] {
  const routes = [
    "/dashboard",
    "/dashboard/employee",
    "/dashboard/chat",
    "/dashboard/leave",
  ];

  if (hasMinimumRole(role, "manager")) {
    routes.push("/dashboard/leave/approvals");
  }

  if (hasMinimumRole(role, "hr")) {
    routes.push("/dashboard/hr", "/dashboard/hr/documents");
  }

  if (hasMinimumRole(role, "owner")) {
    routes.push("/dashboard/admin");
  }

  return routes;
}

/**
 * Check if a route is accessible for a given role
 */
export function canAccessRoute(role: UserRole, route: string): boolean {
  const accessibleRoutes = getAccessibleRoutes(role);
  return accessibleRoutes.some((r) => route.startsWith(r));
}
