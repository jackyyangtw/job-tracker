'use client';

import { MobileTabBar, TopBar } from './Nav';
import { ShellContext, type Shell } from './ShellContext';

/** 正式與試用模式共用的版面：提供 ShellContext，並放上頁首與手機版分頁列。 */
export default function ShellFrame({ shell, banner, children }: { shell: Shell; banner?: React.ReactNode; children: React.ReactNode }) {
  return (
    <ShellContext value={shell}>
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
