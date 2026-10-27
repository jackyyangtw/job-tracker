'use client';

import { MobileTabBar, TopBar } from './Nav';
import { ShellContext, type Shell } from './ShellContext';

/** 正式與試用模式共用的版面：提供 ShellContext，並放上頁首與手機版分頁列。 */
export default function ShellFrame({ shell, banner, children }: { shell: Shell; banner?: React.ReactNode; children: React.ReactNode }) {
  return (
    <ShellContext value={shell}>
      {/* 鍵盤使用者按 Tab 第一個會到這裡，可以略過導覽列；平常隱藏 */}
      <a
        href="#main"
        className="sr-only rounded-lg bg-card px-3 py-2 text-sm font-medium shadow-lg outline-none focus-visible:not-sr-only focus-visible:fixed focus-visible:top-[calc(8px+env(safe-area-inset-top))] focus-visible:left-4 focus-visible:z-50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        跳到主要內容
      </a>
      {/* 手機版底部有固定的分頁列，內容要多留底部空間 */}
      <div className="mx-auto flex max-w-[1240px] flex-col gap-[18px] max-md:pb-20">
        <TopBar />
        {banner}
        {children}
      </div>
      <MobileTabBar />
    </ShellContext>
  );
}
