import { create } from 'zustand';
import { createJSONStorage, devtools, persist } from 'zustand/middleware';
import type { ThemePref } from '@/lib/ui/theme';
import { PREFS_KEY } from './prefsKey';

export type View = 'board' | 'list';

// 只放要記住的前端偏好。伺服器狀態（投遞資料）放在 TanStack Query，見 src/queries/；
// 投遞頁的篩選條件放在網址，見 src/hooks/useApplicationFilters.ts。
interface UiState {
  // 會持久化的偏好設定。
  /** 上次選的看板／列表；網址沒有 `?view=` 時用它。 */
  view: View;
  staleDays: number;
  samplesDismissed: boolean;
  theme: ThemePref;

  setView: (v: View) => void;
  setStaleDays: (n: number) => void;
  setTheme: (t: ThemePref) => void;
  dismissSamples: () => void;
}

export const useTrackerStore = create<UiState>()(
  devtools(
    persist(
      (set) => ({
        view: 'board',
        staleDays: 14,
        samplesDismissed: false,
        theme: 'system',

        setView: (view) => set({ view }, false, 'setView'),
        setStaleDays: (staleDays) => set({ staleDays }, false, 'setStaleDays'),
        setTheme: (theme) => set({ theme }, false, 'setTheme'),
        dismissSamples: () => set({ samplesDismissed: true }, false, 'dismissSamples'),
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
