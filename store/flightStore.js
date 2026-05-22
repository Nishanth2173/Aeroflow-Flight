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
      selectedSeat: null,
      currentStep: 1,

      // All fields initialized as '' — never undefined (fixes uncontrolled input warning)
      passengerForm: {
        fullName: '',
        passportNo: '',
        nationality: '',
        dob: '',
      },

      optimisticSeatId: null,

      setSearchQuery: (query) =>
        set((state) => ({ searchQuery: { ...state.searchQuery, ...query } })),

      setSelectedFlight: (flight) =>
        set({ selectedFlight: flight, selectedSeat: null, currentStep: 3 }),

      setSelectedSeat: (seat) =>
        set({ selectedSeat: seat, optimisticSeatId: seat?.id ?? null }),

      setCurrentStep: (step) => set({ currentStep: step }),

      setPassengerForm: (data) =>
        set((state) => ({
          passengerForm: {
            // Ensure no field ever becomes undefined
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
          selectedSeat: null,
          currentStep: 1,
          passengerForm: { fullName: '', passportNo: '', nationality: '', dob: '' },
          optimisticSeatId: null,
        }),

      resetAll: () =>
        set({
          searchQuery: { origin: '', destination: '', date: '', passengerCount: 1, class: 'economy' },
          selectedFlight: null,
          selectedSeat: null,
          currentStep: 1,
          passengerForm: { fullName: '', passportNo: '', nationality: '', dob: '' },
          optimisticSeatId: null,
        }),
    }),
    {
      name: 'flight-store',
      storage: createJSONStorage(() => localStorage),
      // Exclude passport from localStorage — sensitive data
      partialize: (state) => ({
        searchQuery: state.searchQuery,
        selectedFlight: state.selectedFlight,
        selectedSeat: state.selectedSeat,
        currentStep: state.currentStep,
        passengerForm: {
          fullName: state.passengerForm.fullName || '',
          nationality: state.passengerForm.nationality || '',
          dob: state.passengerForm.dob || '',
          // passportNo intentionally excluded
        },
      }),
      // Merge persisted state safely — ensure no undefined values leak in
      merge: (persistedState, currentState) => ({
        ...currentState,
        ...persistedState,
        passengerForm: {
          fullName: '',
          passportNo: '',
          nationality: '',
          dob: '',
          ...currentState.passengerForm,
          ...(persistedState?.passengerForm || {}),
        },
      }),
    }
  )
);

export default useFlightStore;