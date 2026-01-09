"use client";

import { useQuery } from "@tanstack/react-query";
import { ComprehensiveInsights } from "@/services/intelligence.service";

async function fetchInsights(): Promise<ComprehensiveInsights> {
  const res = await fetch("/api/hr/insights");
  if (!res.ok) throw new Error("Failed to fetch insights");
  return res.json();
}

export function useHRInsights() {
  return useQuery({
    queryKey: ["hr", "insights"],
    queryFn: fetchInsights,
  });
}
