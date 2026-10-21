import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SOURCES } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';

/** 檢視切換、搜尋框，以及來源與提醒天數的下拉選單。狀態存在 tracker store；提醒天數另外同步到資料庫。 */
export default function Filters({ onStaleDaysChange }: { onStaleDaysChange: (days: number) => void }) {
  const view = useTrackerStore((s) => s.view);
  const staleDays = useTrackerStore((s) => s.staleDays);
  const source = useTrackerStore((s) => s.source);
  const query = useTrackerStore((s) => s.query);
  const { setView, setQuery, setSource } = useTrackerStore.getState();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        aria-label="檢視方式"
        value={view}
        // 再次點擊已選中的項目時 Radix 會回報空字串；這時維持目前的檢視。
        onValueChange={(v) => v && setView(v as 'board' | 'list')}
      >
        <ToggleGroupItem value="board">看板</ToggleGroupItem>
        <ToggleGroupItem value="list">列表</ToggleGroupItem>
      </ToggleGroup>
      <Input
        type="search"
        className="flex-[1_1_200px]"
        placeholder="搜尋公司、職位、備註"
        aria-label="搜尋"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <NativeSelect aria-label="依來源篩選" value={source} onChange={(e) => setSource(e.target.value)}>
        <option value="">所有來源</option>
        {SOURCES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </NativeSelect>
      <label className="inline-flex items-center gap-1.5 text-[13px] text-muted-foreground">
        超過
        <NativeSelect aria-label="幾天沒消息就提醒" value={staleDays} onChange={(e) => onStaleDaysChange(Number(e.target.value))}>
          {[7, 10, 14, 21, 30].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </NativeSelect>
        天沒消息就提醒
      </label>
    </div>
  );
}
