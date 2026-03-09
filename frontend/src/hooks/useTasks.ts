"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Task, ApiResponse } from "@/types/api";

export function useTasks(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Task[]>>("/api/v1/tasks", { params });
      return data;
    },
    refetchInterval: 5000, // Poll setiap 5 detik untuk live dashboard
  });
}

export function useTask(id: number) {
  return useQuery({
    queryKey: ["tasks", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Task>>(`/api/v1/tasks/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/v1/tasks", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useUpdateTaskStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.patch(`/api/v1/tasks/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["tasks", id] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useAddComment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: string; files?: File[] }) => {
      const fd = new FormData();
      fd.append("content", payload.content);
      if (payload.files) {
        payload.files.forEach((f) => fd.append("attachments[]", f));
      }
      const { data } = await api.post(`/api/v1/tasks/${taskId}/comments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

export function useUploadTaskAttachments(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (files: File[]) => {
      const fd = new FormData();
      files.forEach((f) => fd.append("attachments[]", f));
      const { data } = await api.post(`/api/v1/tasks/${taskId}/attachments`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}

export function useDeleteTaskAttachment(taskId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (attachmentId: number) => {
      const { data } = await api.delete(`/api/v1/task-attachments/${attachmentId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", taskId] });
    },
  });
}
