// store.js
import { create } from 'zustand';

export const useStore = create((set) => ({
  data: '',
  setData: (newData) => set({ data: newData }),

  isEnded: false,
  setIsEnded: (endState) => set({ isEnded: endState }),

  DC:false,
  setDC: (endState) => set({ DC: endState }),

}));
