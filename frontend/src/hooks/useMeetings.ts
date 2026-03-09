"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Meeting, MeetingNote, FollowUpItem, ApiResponse } from "@/types/api";

export function useMeetings(params?: Record<string, string>) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Meeting[]>>("/api/v1/meetings", { params });
      return data;
    },
  });
}

export function useMeeting(id: number) {
  return useQuery({
    queryKey: ["meetings", id],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<Meeting>>(`/api/v1/meetings/${id}`);
      return data.data;
    },
    enabled: !!id,
  });
}

export function useCreateMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: FormData | Record<string, unknown>) => {
      const { data } = await api.post("/api/v1/meetings", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUpdateMeeting(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.put(`/api/v1/meetings/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["meetings", id] });
    },
  });
}

export function useDeleteMeeting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const { data } = await api.delete(`/api/v1/meetings/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["meetings"] }),
  });
}

export function useUpdateMeetingStatus(id: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (status: string) => {
      const { data } = await api.patch(`/api/v1/meetings/${id}/status`, { status });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings"] });
      qc.invalidateQueries({ queryKey: ["meetings", id] });
    },
  });
}

export function useAddParticipant(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { user_id: number; role: string }) => {
      const { data } = await api.post(`/api/v1/meetings/${meetingId}/participants`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
    },
  });
}

export function useUpdateParticipantRole(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { userId: number; role: string }) => {
      const { data } = await api.patch(`/api/v1/meetings/${meetingId}/participants/${payload.userId}`, {
        role: payload.role,
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
    },
  });
}

export function useRemoveParticipant(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (userId: number) => {
      const { data } = await api.delete(`/api/v1/meetings/${meetingId}/participants/${userId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
    },
  });
}

export function useAddExternalParticipant(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name: string;
      email?: string | null;
      phone?: string | null;
      organization?: string | null;
      position?: string | null;
      role?: string;
      external_contact_id?: number;
    }) => {
      const { data } = await api.post(`/api/v1/meetings/${meetingId}/external-participants`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
    },
  });
}

export function useUpdateExternalParticipant(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      contactId: number;
      name: string;
      email?: string | null;
      phone?: string | null;
      organization?: string | null;
      position?: string | null;
      role?: string;
    }) => {
      const { contactId, ...rest } = payload;
      const { data } = await api.put(`/api/v1/meetings/${meetingId}/external-participants/${contactId}`, rest);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
    },
  });
}

export function useRemoveExternalParticipant(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (contactId: number) => {
      const { data } = await api.delete(`/api/v1/meetings/${meetingId}/external-participants/${contactId}`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
    },
  });
}

export function useMeetingNotes(meetingId: number) {
  return useQuery({
    queryKey: ["meetings", meetingId, "notes"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<MeetingNote[]>>(`/api/v1/meetings/${meetingId}/notes`);
      return data.data;
    },
    enabled: !!meetingId,
  });
}

export function useSaveNote(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { content: unknown; content_html: string; noteId?: number }) => {
      if (payload.noteId) {
        const { data } = await api.put(`/api/v1/meetings/${meetingId}/notes/${payload.noteId}`, payload);
        return data;
      }
      const { data } = await api.post(`/api/v1/meetings/${meetingId}/notes`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId, "notes"] });
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
    },
  });
}

export function useFollowUps(meetingId: number) {
  return useQuery({
    queryKey: ["meetings", meetingId, "follow-ups"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<FollowUpItem[]>>(`/api/v1/meetings/${meetingId}/follow-ups`);
      return data.data;
    },
    enabled: !!meetingId,
  });
}

export function useCreateFollowUp(meetingId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post(`/api/v1/meetings/${meetingId}/follow-ups`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["meetings", meetingId, "follow-ups"] });
      qc.invalidateQueries({ queryKey: ["meetings", meetingId, "notes"] });
      qc.invalidateQueries({ queryKey: ["meetings", meetingId] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
