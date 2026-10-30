import { STATUS_STYLE } from '@/lib/ui/statusStyle';
import { STATUS_LIST } from '@/lib/types';
import { cn } from '@/lib/utils';

// 每欄的假卡片數，錯開長短看起來比較像真的看板
const CARDS_PER_COLUMN = [2, 3, 1, 2, 1, 1, 1];

function CardSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-[9px] border bg-card p-3">
      <div className="skeleton h-4 w-3/4 rounded" />
      <div className="skeleton h-3 w-1/2 rounded" />
      <div className="skeleton h-3 w-2/5 rounded" />
    </div>
  );
}

/**
 * 看板形狀的骨架畫面，資料回來時版面幾乎不會跳動。
 * 延遲約 200ms 才淡入：快取很快回來時就不會一閃而過。
 * `withFilters` 時連篩選列也畫成灰條（Suspense fallback 用，那時篩選列還沒出現）。
 */
export default function BoardSkeleton({ withFilters = false }: { withFilters?: boolean }) {
  return (
    <div role="status" className="flex flex-col gap-[18px] animate-in fade-in delay-200 duration-300 fill-mode-backwards">
      <span className="sr-only">載入中…</span>

      {withFilters ? (
        <div aria-hidden className="flex items-center gap-2">
          <div className="skeleton h-9 w-[140px] rounded-md max-md:hidden" />
          <div className="skeleton h-9 flex-1 rounded-md" />
          <div className="skeleton size-9 rounded-md md:hidden" />
        </div>
      ) : null}

      <div aria-hidden className="flex flex-col gap-3">
        {/* 手機版：狀態切換列與幾張卡片 */}
        <div className="-mx-4 flex gap-2 overflow-hidden px-4 md:hidden">
          {[56, 72, 64, 72, 56].map((w, i) => (
            <div key={i} className="skeleton h-9 shrink-0 rounded-full" style={{ width: w }} />
          ))}
        </div>
        <div className="flex flex-col gap-2 md:hidden">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>

        {/* 桌機版：每個狀態一欄，欄位標題用真的狀態名稱 */}
        <div className="grid auto-cols-[minmax(188px,1fr)] grid-flow-col gap-3 overflow-hidden pb-2 max-md:hidden">
          {STATUS_LIST.map((s, i) => (
            <div key={s.key} className="flex flex-col gap-2 rounded-xl bg-secondary p-2.5">
              <div className="flex items-center gap-1.5 px-1 py-0.5 font-medium">
                <span className={cn('size-[9px] rounded-full', STATUS_STYLE[s.key].dot)} />
                {s.label}
              </div>
              {Array.from({ length: CARDS_PER_COLUMN[i % CARDS_PER_COLUMN.length] }, (_, j) => (
                <CardSkeleton key={j} />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
