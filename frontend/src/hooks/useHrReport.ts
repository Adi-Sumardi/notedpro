"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, HrReportData } from "@/types/api";

export function useHrReport(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["hr-report", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<HrReportData>>("/api/v1/hr-report", { params });
      return data.data;
    },
  });
}

export function useDepartments() {
  return useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<string[]>>("/api/v1/hr-report/departments");
      return data.data;
    },
  });
}
