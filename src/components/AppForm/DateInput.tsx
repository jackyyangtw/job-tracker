import { CalendarDays } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

/**
 * 日期／日期時間欄位。iOS（含 iPhone 上的 Chrome，一樣是 WebKit）不會畫日曆圖示，
 * 所以只在 iOS 補一個裝飾用的圖示；點欄位任何地方都會開啟系統的選擇器。
 * 其他瀏覽器有自己的日曆按鈕（可以點），不重複顯示。
 */
export default function DateInput({ type = 'date', className, ...props }: React.ComponentProps<'input'> & { type?: 'date' | 'datetime-local' }) {
  return (
    <div className="relative">
      <Input type={type} className={cn('supports-[-webkit-touch-callout:none]:pr-9', className)} {...props} />
      <CalendarDays
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-3 hidden size-4 -translate-y-1/2 text-muted-foreground supports-[-webkit-touch-callout:none]:block"
      />
    </div>
  );
}
