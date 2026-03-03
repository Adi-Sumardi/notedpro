"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardSummary, ApiResponse } from "@/types/api";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "summary"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardSummary>>("/api/v1/dashboard/summary");
      return data.data;
    },
    refetchInterval: 5000,
  });
}

export function useMyDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard", "my-summary"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DashboardSummary>>("/api/v1/dashboard/my-summary");
      return data.data;
    },
    refetchInterval: 5000,
  });
}
