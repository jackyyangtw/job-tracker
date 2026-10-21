import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { todayStr } from '@/lib/dates';
import { cn } from '@/lib/utils';
import ReminderSettings from './ReminderSettings';

interface Props {
  offline: boolean;
  chip: string;
  onExport: (kind: 'json' | 'csv') => void;
  onImport: () => void;
  onSignOut: () => void;
  onAdd: () => void;
  onStaleDaysChange: (days: number) => void;
}

export default function Header({ offline, chip, onExport, onImport, onSignOut, onAdd, onStaleDaysChange }: Props) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
      <div>
        <h1 className="text-[21px] leading-tight tracking-[0.01em] text-balance sm:text-2xl">投遞追蹤看板</h1>
        <p className="mt-1 text-[13px] text-muted-foreground">
          <span className="font-mono tabular-nums">{todayStr()}</span> · 記錄每一次投遞，看出哪個管道和哪份履歷有回應
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge role="status" className={cn('max-w-full wrap-anywhere', offline && 'bg-warn/15 text-warn')}>
          {chip}
        </Badge>
        <ReminderSettings onChange={onStaleDaysChange} />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="outline" aria-label="資料備份選單">
              資料備份
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => onExport('json')}>匯出 JSON（完整備份）</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onExport('csv')}>匯出 CSV（可用試算表開啟）</DropdownMenuItem>
            <DropdownMenuItem onSelect={onImport}>匯入 JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <Button type="button" variant="outline" onClick={onSignOut}>
          登出
        </Button>
        <Button type="button" onClick={onAdd}>
          ＋ 新增投遞
        </Button>
      </div>
    </header>
  );
}
