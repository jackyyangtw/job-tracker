'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';

/** 和 App 其他部分一樣，跟隨系統的深淺色設定。 */
function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="system"
      position="bottom-center"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
}

export { Toaster };
