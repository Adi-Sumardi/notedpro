"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";

export function useAuth({ middleware }: { middleware?: "auth" | "guest" } = {}) {
  const router = useRouter();
  const { user, isLoading, fetchUser } = useAuthStore();

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isLoading) return;

    if (middleware === "auth" && !user) {
      router.push("/login");
    }

    if (middleware === "guest" && user) {
      router.push("/dashboard");
    }
  }, [user, isLoading, middleware, router]);

  return { user, isLoading };
}
