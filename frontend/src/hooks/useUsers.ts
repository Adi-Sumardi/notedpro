"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { User, ApiResponse } from "@/types/api";

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<User[]>>("/api/v1/users");
      return data.data;
    },
  });
}
