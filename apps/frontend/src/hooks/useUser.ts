"use client";

import { useQuery } from "@tanstack/react-query";
import { userService, UserProfile } from "@/services/user.service";

export function useUser() {
  return useQuery({
    queryKey: ["user", "profile"],
    queryFn: () => userService.getCurrentUserProfile(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
}
