// store.js
import { create } from 'zustand';

export const useStore = create((set) => ({
  data: '',
  setData: (newData) => set({ data: newData }),

  isEnded: false,
  setIsEnded: (endState) => set({ isEnded: endState }),

  clientusername:'',
  setclientusername: (newData) => set({ clientusername: newData }),

  DC:false,
  setDC: (endState) => set({ DC: endState }),

}));
