import { create } from "zustand";
import type { User } from "@/types/api";
import api, { getCsrfCookie } from "@/lib/api";

interface AuthState {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  fetchUser: () => Promise<void>;
  hasRole: (role: string) => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,

  login: async (email, password) => {
    await getCsrfCookie();
    const { data } = await api.post("/api/login", { email, password });
    set({ user: data.data.user });
  },

  logout: async () => {
    await api.post("/api/logout");
    set({ user: null });
  },

  fetchUser: async () => {
    try {
      set({ isLoading: true });
      const { data } = await api.get("/api/user");
      set({ user: data.data.user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  hasRole: (role) => {
    const { user } = get();
    return user?.roles?.includes(role) ?? false;
  },

  hasPermission: (permission) => {
    const { user } = get();
    if (user?.roles?.includes("super-admin")) return true;
    return user?.permissions?.includes(permission) ?? false;
  },
}));
