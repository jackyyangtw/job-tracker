import * as React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const selectClass =
  'h-full min-h-9 w-full min-w-0 appearance-none rounded-lg border bg-card py-1.5 pr-8 pl-2.5 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40 disabled:opacity-50 sm:text-sm';

/** 套用樣式的原生 <select>：手機上使用系統選單，不需額外 JS。props 會傳給 <select>；`wrapperClassName` 用來設定外框樣式。 */
function NativeSelect({ className, wrapperClassName, children, ...props }: React.ComponentProps<'select'> & { wrapperClassName?: string }) {
  return (
    <div className={cn('relative inline-flex min-w-0', wrapperClassName)} data-slot="native-select">
      <select className={cn(selectClass, className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden className="pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export { NativeSelect };
