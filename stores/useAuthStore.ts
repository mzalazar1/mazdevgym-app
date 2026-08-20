import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "free_user" | "member";
  avatar: string | null;
  gymId: string | null;
  memberId: string | null;
  gymName: string | null;
  gymLogo: string | null;
  orgType: string | null;
  membershipType: string | null;
  expiresAt: string | null;
}

interface AuthState {
  user: AppUser | null;
  token: string | null;
  refreshToken: string | null;

  setAuth: (data: {
    user: AppUser;
    accessToken: string;
    refreshToken: string;
  }) => void;
  logout: () => void;
  setUser: (user: AppUser) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,

      setAuth: ({ user, accessToken, refreshToken }) =>
        set({ user, token: accessToken, refreshToken }),

      logout: () => set({ user: null, token: null, refreshToken: null }),

      setUser: (user) => set({ user }),
    }),
    {
      name: "mazgym-auth",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
      }),
    },
  ),
);
