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
      {/* 手機版底部有固定的分頁列，內容要多留底部空間。
          桌機版的頁面標了 data-fill-viewport（投遞頁的看板，高度剛好填滿一個畫面）時，底部留白改成和頂部一樣 20px：
          用負 margin 抵掉 body 底部 48px 留白中多的 28px，上方沒有其他內容時整頁就不會出現捲軸 */}
      <div className="mx-auto flex max-w-[1400px] flex-col gap-[18px] max-md:pb-20 md:has-[main[data-fill-viewport]]:-mb-7">
        <TopBar basePath={shell.basePath} />
        {banner}
        {children}
      </div>
      <MobileTabBar basePath={shell.basePath} />
    </ShellContext>
  );
}
