import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useTrackerStore } from '@/store/useTrackerStore';

const STALE_DAY_OPTIONS = [7, 10, 14, 21, 30];

/** 提醒設定：超過幾天沒消息就列入「該跟進了」。這是設定而不是篩選，所以放在頁首而不是篩選列。 */
export default function ReminderSettings({ onChange }: { onChange: (days: number) => void }) {
  const staleDays = useTrackerStore((s) => s.staleDays);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button type="button" variant="outline" aria-label={`提醒設定：超過 ${staleDays} 天沒消息就提醒`}>
          <Bell aria-hidden />
          <span className="font-mono tabular-nums">{staleDays}</span> 天
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>超過幾天沒消息就提醒</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={String(staleDays)} onValueChange={(v) => onChange(Number(v))}>
          {STALE_DAY_OPTIONS.map((n) => (
            <DropdownMenuRadioItem key={n} value={String(n)}>
              {n} 天
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
