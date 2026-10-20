import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export type View = 'board' | 'list';

// Client/UI state only. Server state (applications) lives in TanStack Query, see src/hooks/.
interface UiState {
  // Persisted preferences.
  view: View;
  staleDays: number;
  samplesDismissed: boolean;
  // Ephemeral filters.
  source: string;
  query: string;

  setView: (v: View) => void;
  setStaleDays: (n: number) => void;
  setSource: (s: string) => void;
  setQuery: (q: string) => void;
  dismissSamples: () => void;
  resetFilters: () => void;
}

export const useTrackerStore = create<UiState>()(
  persist(
    (set) => ({
      view: 'board',
      staleDays: 14,
      samplesDismissed: false,
      source: '',
      query: '',

      setView: (view) => set({ view }),
      setStaleDays: (staleDays) => set({ staleDays }),
      setSource: (source) => set({ source }),
      setQuery: (query) => set({ query }),
      dismissSamples: () => set({ samplesDismissed: true }),
      resetFilters: () => set({ source: '', query: '' }),
    }),
    {
      name: 'jobtracker.prefs',
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ view: s.view, staleDays: s.staleDays, samplesDismissed: s.samplesDismissed }),
    },
  ),
);
