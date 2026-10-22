import type { Metadata } from 'next';
import { DemoShell } from '@/components/AppShell';

// 試用頁的內容是固定的範例資料，不需要被搜尋引擎收錄。
export const metadata: Metadata = { robots: { index: false, follow: false } };

// 試用模式（/demo）：和 (dashboard) 共用同一套頁面元件，只把資料來源換成記憶體裡的範例。
export default function DemoLayout({ children }: { children: React.ReactNode }) {
  return <DemoShell>{children}</DemoShell>;
}
