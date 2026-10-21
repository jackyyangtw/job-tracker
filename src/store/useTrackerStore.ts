import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';

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
  devtools(
    persist(
      (set) => ({
        view: 'board',
        staleDays: 14,
        samplesDismissed: false,
        source: '',
        query: '',

        setView: (view) => set({ view }, false, 'setView'),
        setStaleDays: (staleDays) => set({ staleDays }, false, 'setStaleDays'),
        setSource: (source) => set({ source }, false, 'setSource'),
        setQuery: (query) => set({ query }, false, 'setQuery'),
        dismissSamples: () => set({ samplesDismissed: true }, false, 'dismissSamples'),
        resetFilters: () => set({ source: '', query: '' }, false, 'resetFilters'),
      }),
      {
        name: 'jobtracker.prefs',
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ view: s.view, staleDays: s.staleDays, samplesDismissed: s.samplesDismissed }),
      },
    ),
    { name: 'TrackerStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
