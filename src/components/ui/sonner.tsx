'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import { useTrackerStore } from '@/store/useTrackerStore';

const TOAST_STYLE: React.CSSProperties = { boxShadow: '0 10px 30px -8px rgb(0 0 0 / 0.45)' };

/**
 * 和 App 其他部分一樣，跟隨設定頁選的外觀。
 * 用反色（前景色當底色）：toast 常疊在卡片上，用卡片同色的底會幾乎看不見。
 * 手機版底部有固定的分頁列（約 56px），所以往上多留空間，避免被擋住。
 */
function Toaster(props: ToasterProps) {
  const theme = useTrackerStore((s) => s.theme);
  return (
    <Sonner
      theme={theme}
      position="bottom-center"
      mobileOffset={{ bottom: 'calc(72px + env(safe-area-inset-bottom))' }}
      style={
        {
          '--normal-bg': 'var(--foreground)',
          '--normal-text': 'var(--background)',
          '--normal-border': 'transparent',
        } as React.CSSProperties
      }
      // sonner 內建的陰影優先權較高，所以陰影用 inline style 覆寫
      toastOptions={{ classNames: { toast: 'font-medium' }, style: TOAST_STYLE }}
      {...props}
    />
  );
}

export { Toaster };
