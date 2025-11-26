import { create } from 'zustand';

export const useStore = create((set) => ({
  data: '',
  setData: (newData) => set({ data: newData }),

  isEnded: false,
  setIsEnded: (endState) => set({ isEnded: endState }),

  clientusername: '',
  setclientusername: (newData) => set({ clientusername: newData }),

  DC: false,
  setDC: (endState) => set({ DC: endState }),

  // ✅ Reset everything to initial state
  resetStore: () =>
    set({
      data: '',
      isEnded: false,
      clientusername: '',
      DC: false
    }),
}));
