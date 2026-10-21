'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, LayoutGrid, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const ITEMS = [
  { href: '/applications', label: '投遞', icon: LayoutGrid },
  { href: '/statistics', label: '統計', icon: BarChart3 },
  { href: '/settings', label: '設定', icon: Settings },
] as const;

/** 頁首：品牌名稱；桌機版在右側顯示主要導覽。 */
export function TopBar() {
  const pathname = usePathname();
  return (
    <header className="flex items-center justify-between gap-4">
      <Link href="/applications" className="text-lg leading-tight font-medium tracking-[0.01em] sm:text-xl">
        投遞追蹤看板
      </Link>
      <nav aria-label="主要導覽" className="hidden items-center gap-1 md:flex">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? 'page' : undefined}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                active ? 'bg-secondary font-medium text-foreground' : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
              )}
            >
              <Icon aria-hidden className="size-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}

/** 手機版底部分頁列，避開 iPhone 底部的 Home 指示條。 */
export function MobileTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="主要導覽"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
    >
      <ul className="m-0 grid list-none grid-cols-3 p-0">
        {ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset',
                  active ? 'font-medium text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon aria-hidden className="size-5" />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
