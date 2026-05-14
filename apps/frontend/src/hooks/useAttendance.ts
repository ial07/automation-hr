"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AttendanceRecord } from "@/types/attendance";

type AttendanceResponse = {
  today: AttendanceRecord | null;
  history: AttendanceRecord[];
};

type TeamAttendanceResponse = {
  records: AttendanceRecord[];
};

type AttendanceActionInput = {
  action: "check-in" | "check-out";
  notes?: string;
  is_wfh?: boolean;
};

// Fetch user's attendance
async function fetchAttendance(): Promise<AttendanceResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch attendance");
  return res.json();
}

// Fetch team attendance
async function fetchTeamAttendance(): Promise<TeamAttendanceResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance/team`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch team attendance");
  return res.json();
}

// Perform action
async function performAction(
  input: AttendanceActionInput
): Promise<{ record: AttendanceRecord }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/attendance`, { credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to process action");
  }
  return res.json();
}

// Hooks
export function useAttendance() {
  return useQuery({
    queryKey: ["attendance", "me"],
    queryFn: fetchAttendance,
  });
}

export function useTeamAttendance() {
  return useQuery({
    queryKey: ["attendance", "team"],
    queryFn: fetchTeamAttendance,
  });
}

export function useAttendanceAction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: performAction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}
