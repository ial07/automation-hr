"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { OvertimeRequest, CreateOvertimeInput } from "@/types/overtime";

type OvertimeResponse = {
  requests: OvertimeRequest[];
  monthlyTotal: number;
};

type ApprovalsResponse = {
  requests: OvertimeRequest[];
};

// Fetch user's overtime
async function fetchOvertime(): Promise<OvertimeResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overtime`);
  if (!res.ok) throw new Error("Failed to fetch overtime");
  return res.json();
}

// Fetch pending approvals
async function fetchApprovals(): Promise<ApprovalsResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overtime/approvals`);
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
}

// Submit overtime
async function submitOvertime(
  input: CreateOvertimeInput
): Promise<{ request: OvertimeRequest }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overtime`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to submit");
  }
  return res.json();
}

// Approve/reject
async function processApproval(params: {
  id: string;
  action: "approve" | "reject";
  notes?: string;
}) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/overtime/${params.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: params.action, notes: params.notes }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to process");
  }
  return res.json();
}

// Hooks
export function useOvertime() {
  return useQuery({
    queryKey: ["overtime", "me"],
    queryFn: fetchOvertime,
  });
}

export function useOvertimeApprovals() {
  return useQuery({
    queryKey: ["overtime", "approvals"],
    queryFn: fetchApprovals,
  });
}

export function useSubmitOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitOvertime,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime"] });
    },
  });
}

export function useApproveOvertime() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: processApproval,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["overtime"] });
    },
  });
}
