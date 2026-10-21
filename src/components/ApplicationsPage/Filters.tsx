import { CalendarDays, Columns3, Globe, List, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { monthLabel } from '@/lib/dates';
import { SOURCES } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';

interface Props {
  /** 資料裡出現過的月份，新的在前。 */
  months: string[];
}

/** 篩選列：檢視切換、搜尋框，以及月份與來源的下拉選單。狀態存在 tracker store。 */
export default function Filters({ months }: Props) {
  const view = useTrackerStore((s) => s.view);
  const source = useTrackerStore((s) => s.source);
  const query = useTrackerStore((s) => s.query);
  const month = useTrackerStore((s) => s.month);
  const { setView, setQuery, setSource, setMonth } = useTrackerStore.getState();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        aria-label="檢視方式"
        value={view}
        // 再次點擊已選中的項目時 Radix 會回報空字串；這時維持目前的檢視。
        onValueChange={(v) => v && setView(v as 'board' | 'list')}
      >
        <ToggleGroupItem value="board" className="inline-flex items-center gap-1.5">
          <Columns3 aria-hidden className="size-4" />
          看板
        </ToggleGroupItem>
        <ToggleGroupItem value="list" className="inline-flex items-center gap-1.5">
          <List aria-hidden className="size-4" />
          列表
        </ToggleGroupItem>
      </ToggleGroup>
      <div className="relative min-w-0 flex-[1_1_200px]">
        <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          className="pl-8"
          placeholder="搜尋公司、職位、備註"
          aria-label="搜尋"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      <NativeSelect icon={<CalendarDays />} aria-label="依月份篩選" value={month} onChange={(e) => setMonth(e.target.value)}>
        <option value="">所有月份</option>
        {/* 網址指定的月份目前沒有資料時，也要能顯示出來，使用者才看得懂為什麼是空的。 */}
        {(month && !months.includes(month) ? [month, ...months] : months).map((m) => (
          <option key={m} value={m}>
            {monthLabel(m)}
          </option>
        ))}
      </NativeSelect>
      <NativeSelect icon={<Globe />} aria-label="依來源篩選" value={source} onChange={(e) => setSource(e.target.value)}>
        <option value="">所有來源</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </NativeSelect>
    </div>
  );
}
