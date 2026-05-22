import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useUserStore = create(
  persist(
    (set) => ({
      session: null,
      user: null,
      cachedBookings: [],

      setSession: (session) => set({ session, user: session?.user ?? null }),
      setUser: (user) => set({ user }),
      setCachedBookings: (bookings) => set({ cachedBookings: bookings }),

      clearSession: () =>
        set({ session: null, user: null, cachedBookings: [] }),
    }),
    {
      name: 'user-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist the session token, not full user object or bookings
      partialize: (state) => ({
        session: state.session
          ? { access_token: state.session.access_token, refresh_token: state.session.refresh_token }
          : null,
      }),
    }
  )
);

export default useUserStore;
