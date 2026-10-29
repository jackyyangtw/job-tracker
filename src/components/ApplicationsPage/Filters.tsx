import { useState } from 'react';
import { CalendarDays, Columns3, Globe, List, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useApplicationFilters } from '@/hooks/useApplicationFilters';
import { useHydrated } from '@/hooks/useHydrated';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { monthLabel } from '@/lib/dates';
import { SOURCES } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  /** 資料裡出現過的月份，新的在前。 */
  months: string[];
  /** 放在篩選列尾端的動作按鈕（例如桌機版的新增投遞）。 */
  action?: React.ReactNode;
}

/**
 * 篩選列：檢視切換、搜尋框，以及月份與來源的下拉選單。篩選條件存在網址（useApplicationFilters）。
 * 手機版只顯示搜尋框，月份與來源收在「篩選」按鈕裡；看板／列表切換只在桌機版顯示。
 */
export default function Filters({ months, action }: Props) {
  const { view, query, source, month, setView, setQuery, setSource, setMonth } = useApplicationFilters();
  // hydration 前不知道使用者選的檢視，先都不標示選取，免得從「看板」跳到「列表」。
  const hydrated = useHydrated();
  const [open, setOpen] = useState(false);
  const activeCount = (month ? 1 : 0) + (source ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        aria-label="檢視方式"
        className="max-md:hidden"
        value={hydrated ? view : ''}
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
          name="q"
          autoComplete="off"
          className="pl-8"
          placeholder="搜尋公司、職位、備註…"
          aria-label="搜尋"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <Button
        type="button"
        variant={activeCount ? 'secondary' : 'outline'}
        className="relative md:hidden"
        size="icon"
        aria-expanded={open}
        aria-controls="more-filters"
        aria-label={activeCount ? `篩選條件（已套用 ${activeCount} 項）` : '篩選條件'}
        onClick={() => setOpen((v) => !v)}
      >
        <SlidersHorizontal aria-hidden />
        {activeCount ? (
          <span aria-hidden className="absolute -top-1 -right-1 grid size-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">
            {activeCount}
          </span>
        ) : null}
      </Button>

      <div id="more-filters" className={cn('flex flex-wrap gap-2 max-md:w-full', !open && 'max-md:hidden')}>
        <NativeSelect
          icon={<CalendarDays />}
          wrapperClassName="max-md:flex-1"
          aria-label="依月份篩選"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
        >
          <option value="">所有月份</option>
          {/* 網址指定的月份目前沒有資料時，也要能顯示出來，使用者才看得懂為什麼是空的。 */}
          {(month && !months.includes(month) ? [month, ...months] : months).map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </NativeSelect>
        <NativeSelect
          icon={<Globe />}
          wrapperClassName="max-md:flex-1"
          aria-label="依來源篩選"
          value={source}
          onChange={(e) => setSource(e.target.value)}
        >
          <option value="">所有來源</option>
          {SOURCES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </NativeSelect>
      </div>

      {action}
    </div>
  );
}
