"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  LeaveRequest,
  LeaveBalance,
  CreateLeaveRequestInput,
} from "@/types/leave";

type LeaveListResponse = {
  requests: LeaveRequest[];
  balance: LeaveBalance;
};

type BalanceResponse = {
  balance: LeaveBalance;
  remaining: { annual: number; sick: number };
};

type ApprovalsResponse = {
  managerPending: LeaveRequest[];
  hrPending: LeaveRequest[];
  total: number;
};

// Fetch user's leave requests
async function fetchLeaveRequests(): Promise<LeaveListResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch leave requests");
  return res.json();
}

// Fetch leave balance
async function fetchBalance(): Promise<BalanceResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave/balance`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch balance");
  return res.json();
}

// Submit leave request
async function submitLeaveRequest(
  input: CreateLeaveRequestInput
): Promise<{ request: LeaveRequest }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave`, { credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to submit request");
  }
  return res.json();
}

// Approve/Reject request
async function updateLeaveRequest(params: {
  id: string;
  action: "approve" | "reject";
  notes?: string;
}): Promise<{ request: LeaveRequest }> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave/${params.id}`, { credentials: "include",
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: params.action, notes: params.notes }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error || "Failed to update request");
  }
  return res.json();
}

// Fetch pending approvals (for managers/HR)
async function fetchApprovals(): Promise<ApprovalsResponse> {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/leave/approvals`, { credentials: "include" });
  if (!res.ok) throw new Error("Failed to fetch approvals");
  return res.json();
}

// Hooks
export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave", "requests"],
    queryFn: fetchLeaveRequests,
  });
}

export function useLeaveBalance() {
  return useQuery({
    queryKey: ["leave", "balance"],
    queryFn: fetchBalance,
  });
}

export function useSubmitLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: submitLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
    },
  });
}

export function useApproveLeave() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateLeaveRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave"] });
    },
  });
}

export function useLeaveApprovals() {
  return useQuery({
    queryKey: ["leave", "approvals"],
    queryFn: fetchApprovals,
  });
}
