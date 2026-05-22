import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const useFlightStore = create(
  persist(
    (set) => ({
      searchQuery: {
        origin: '',
        destination: '',
        date: '',
        passengerCount: 1,
        class: 'economy',
      },

      selectedFlight: null,
      selectedSeats: [],        // ← array now (was single seat)
      currentStep: 1,

      passengerForm: {
        fullName: '',
        passportNo: '',         // excluded from localStorage via partialize
        nationality: '',
        dob: '',
      },

      setSearchQuery: (query) =>
        set((state) => ({ searchQuery: { ...state.searchQuery, ...query } })),

      setSelectedFlight: (flight) =>
        set({ selectedFlight: flight, selectedSeats: [], currentStep: 3 }),

      // Toggle seat in/out of selectedSeats array
      toggleSeat: (seat) =>
        set((state) => {
          const exists = state.selectedSeats.find(s => s.id === seat.id);
          if (exists) {
            // Deselect
            return { selectedSeats: state.selectedSeats.filter(s => s.id !== seat.id) };
          } else {
            // Select — enforce max = passengerCount
            const max = state.searchQuery.passengerCount || 1;
            if (state.selectedSeats.length >= max) {
              // Replace the last one if at max
              return { selectedSeats: [...state.selectedSeats.slice(0, max - 1), seat] };
            }
            return { selectedSeats: [...state.selectedSeats, seat] };
          }
        }),

      clearSeats: () => set({ selectedSeats: [] }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setPassengerForm: (data) =>
        set((state) => ({
          passengerForm: {
            fullName: '',
            passportNo: '',
            nationality: '',
            dob: '',
            ...state.passengerForm,
            ...data,
          },
        })),

      resetBookingFlow: () =>
        set({
          selectedFlight: null,
          selectedSeats: [],
          currentStep: 1,
          passengerForm: { fullName: '', passportNo: '', nationality: '', dob: '' },
        }),

      resetAll: () =>
        set({
          searchQuery: { origin: '', destination: '', date: '', passengerCount: 1, class: 'economy' },
          selectedFlight: null,
          selectedSeats: [],
          currentStep: 1,
          passengerForm: { fullName: '', passportNo: '', nationality: '', dob: '' },
        }),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeats: state.selectedSeats,
        currentStep: state.currentStep,
        passengerForm: {
          fullName: state.passengerForm.fullName || '',
          nationality: state.passengerForm.nationality || '',
          dob: state.passengerForm.dob || '',
          // passportNo intentionally excluded
        },
      }),
      merge: (persisted, current) => ({
        ...current,
        ...persisted,
        selectedSeats: persisted?.selectedSeats || [],
        passengerForm: {
          fullName: '', passportNo: '', nationality: '', dob: '',
          ...current.passengerForm,
          ...(persisted?.passengerForm || {}),
        },
      }),
    }
  )
);

export default useFlightStore;