"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DailyWorkLog, ApiResponse } from "@/types/api";

export function useWorkLogs(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["work-logs", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DailyWorkLog[]>>(
        "/api/v1/work-logs",
        { params }
      );
      return data;
    },
  });
}

export function useWorkLog(id: number) {
  return useQuery({
    queryKey: ["work-logs", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<DailyWorkLog>>(
        `/api/v1/work-logs/${id}`
      );
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Record<string, unknown>) => {
      const { data } = await api.post("/api/v1/work-logs", payload, {
        headers: payload instanceof FormData
          ? { "Content-Type": "multipart/form-data" }
          : undefined,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-logs"] });
    },
  });
}

export function useUpdateWorkLog(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Record<string, unknown>) => {
      // Laravel needs _method=PUT for FormData via POST
      if (payload instanceof FormData) {
        payload.append("_method", "PUT");
        const { data } = await api.post(`/api/v1/work-logs/${id}`, payload, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return data;
      }
      const { data } = await api.put(`/api/v1/work-logs/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-logs"] });
      qc.invalidateQueries({ queryKey: ["work-logs", id] });
    },
  });
}

export function useDeleteWorkLog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/api/v1/work-logs/${id}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-logs"] });
    },
  });
}

export function useSubmitWorkLog(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await api.patch(`/api/v1/work-logs/${id}/submit`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-logs"] });
      qc.invalidateQueries({ queryKey: ["work-logs", id] });
    },
  });
}

export function useReviewWorkLog(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { status: string; review_comment?: string }) => {
      const { data } = await api.patch(
        `/api/v1/work-logs/${id}/review`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["work-logs"] });
      qc.invalidateQueries({ queryKey: ["work-logs", id] });
    },
  });
}
