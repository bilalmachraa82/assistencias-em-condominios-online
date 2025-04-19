
import { create } from 'zustand';

interface AppState {
  assistencias: any[];
  setAssistencias: (assistencias: any[]) => void;
  loading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  assistencias: [],
  setAssistencias: (assistencias) => set({ assistencias }),
  loading: false,
  setLoading: (loading) => set({ loading }),
}));
