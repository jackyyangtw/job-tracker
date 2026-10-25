import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import type { ThemePref } from '@/lib/ui/theme';
import { PREFS_KEY } from './prefsKey';

export type View = 'board' | 'list';

// 只放前端／UI 狀態。伺服器狀態（投遞資料）放在 TanStack Query，見 src/queries/。
interface UiState {
  // 會持久化的偏好設定。
  view: View;
  staleDays: number;
  samplesDismissed: boolean;
  theme: ThemePref;
  // 暫時性的篩選條件。
  source: string;
  query: string;
  /** `YYYY-MM`，空字串代表所有月份。 */
  month: string;

  setView: (v: View) => void;
  setStaleDays: (n: number) => void;
  setTheme: (t: ThemePref) => void;
  setSource: (s: string) => void;
  setQuery: (q: string) => void;
  setMonth: (m: string) => void;
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
        theme: 'system',
        source: '',
        query: '',
        month: '',

        setView: (view) => set({ view }, false, 'setView'),
        setStaleDays: (staleDays) => set({ staleDays }, false, 'setStaleDays'),
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        setSource: (source) => set({ source }, false, 'setSource'),
        setQuery: (query) => set({ query }, false, 'setQuery'),
        setMonth: (month) => set({ month }, false, 'setMonth'),
        dismissSamples: () => set({ samplesDismissed: true }, false, 'dismissSamples'),
        resetFilters: () => set({ source: '', query: '', month: '' }, false, 'resetFilters'),
      }),
      {
        name: PREFS_KEY,
        storage: createJSONStorage(() => localStorage),
        partialize: (s) => ({ view: s.view, staleDays: s.staleDays, samplesDismissed: s.samplesDismissed, theme: s.theme }),
      },
    ),
    { name: 'TrackerStore', enabled: process.env.NODE_ENV === 'development' },
  ),
);
