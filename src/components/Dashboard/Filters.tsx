import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { SOURCES } from '@/lib/types';
import { useTrackerStore } from '@/store/useTrackerStore';

/** View toggle, search box and the source / stale-days selects. State lives in the tracker store. */
export default function Filters() {
  const view = useTrackerStore((s) => s.view);
  const staleDays = useTrackerStore((s) => s.staleDays);
  const source = useTrackerStore((s) => s.source);
  const query = useTrackerStore((s) => s.query);
  const { setView, setQuery, setSource, setStaleDays } = useTrackerStore.getState();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <ToggleGroup
        type="single"
        aria-label="檢視方式"
        value={view}
        // Radix reports an empty string when the active item is clicked again; keep the current view in that case.
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
        <NativeSelect aria-label="幾天沒消息就提醒" value={staleDays} onChange={(e) => setStaleDays(Number(e.target.value))}>
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
