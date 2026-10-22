'use client';

import { Monitor, Moon, Sun } from 'lucide-react';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { THEME_PREFS, type ThemePref } from '@/lib/theme';
import { useTrackerStore } from '@/store/useTrackerStore';

const OPTIONS: Record<ThemePref, { label: string; icon: typeof Sun }> = {
  system: { label: '跟隨系統', icon: Monitor },
  light: { label: '淺色', icon: Sun },
  dark: { label: '深色', icon: Moon },
};

/** 外觀：跟隨系統／淺色／深色。只存在這台裝置上。 */
export default function AppearanceCard() {
  const theme = useTrackerStore((s) => s.theme);
  const setTheme = useTrackerStore((s) => s.setTheme);

  return (
    <Card className="gap-3 rounded-[10px]">
      <CardTitle>外觀</CardTitle>
      <CardDescription>「跟隨系統」會隨手機或電腦的深淺色設定自動切換。這個設定只存在這台裝置上。</CardDescription>
      <ToggleGroup
        type="single"
        aria-label="外觀"
        className="self-start"
        value={theme}
        // 再次點擊已選中的項目時 Radix 會回報空字串；這時維持目前的設定。
        onValueChange={(v) => v && setTheme(v as ThemePref)}
      >
        {THEME_PREFS.map((pref) => {
          const { label, icon: Icon } = OPTIONS[pref];
          return (
            <ToggleGroupItem key={pref} value={pref} className="inline-flex items-center gap-1.5">
              <Icon aria-hidden className="size-4" />
              {label}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </Card>
  );
}
