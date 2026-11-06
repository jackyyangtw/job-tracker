'use client';

import { useState } from 'react';
import { STATUS_STYLE } from '@/lib/ui/statusStyle';
import { STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useApplicationFilters } from '@/hooks/useApplicationFilters';
import { useDragPan } from '@/hooks/useDragPan';
import ApplicationCard from './ApplicationCard';
import { DRAG_TYPE, type Common } from './types';

export { default as ListView } from './ListView';

/** 拖曳時游標離看板左右邊緣多近就開始自動捲動（px） */
const AUTO_SCROLL_EDGE = 96;
/** 游標貼齊邊緣時每次 dragover 捲動的距離（px）；dragover 約每 50ms 觸發一次，靜止不動也會持續觸發 */
const AUTO_SCROLL_MAX_STEP = 24;

/** 桌機版看板欄位超出畫面時，把卡片拖到左右邊緣就自動橫向捲動，越靠近邊緣捲越快。 */
function autoScrollOnDrag(e: React.DragEvent<HTMLUListElement>) {
  if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
  const el = e.currentTarget;
  if (el.scrollWidth <= el.clientWidth) return;
  const { left, right } = el.getBoundingClientRect();
  const edge = Math.min(AUTO_SCROLL_EDGE, el.clientWidth / 4);
  const depth = e.clientX < left + edge ? e.clientX - (left + edge) : e.clientX > right - edge ? e.clientX - (right - edge) : 0;
  if (depth) el.scrollBy({ left: (depth / edge) * AUTO_SCROLL_MAX_STEP });
}

/**
 * 看板。桌機版每個狀態一欄；手機版上方是可橫向捲動的狀態切換（含「全部」），
 * 「全部」時依狀態分段列出，選了某個狀態就只列那個狀態（存在 tracker store，會同步到網址）。
 */
export default function Board({ apps, ...common }: Common & { apps: Application[] }) {
  const { status: active, setStatus: setActive } = useApplicationFilters();
  // 拖曳中游標所在的欄位，用來顯示放置提示
  const [dropTarget, setDropTarget] = useState<Status | null>(null);
  // 桌機版不顯示橫向捲軸，改成在欄位空白處按住左右拖曳來捲動
  const { panning, panHandlers } = useDragPan<HTMLUListElement>();
  const chips: { key: Status | 'all'; label: string; count: number }[] = [
    { key: 'all', label: '全部', count: apps.length },
    ...STATUS_LIST.map((s) => ({ key: s.key, label: s.label, count: apps.filter((a) => a.status === s.key).length })),
  ];

  return (
    <div className="flex flex-col gap-3 md:min-h-0 md:flex-1">
      <div role="group" aria-label="依狀態顯示" className="scroll-fade-x -mx-4 -my-1 flex gap-2 overflow-x-auto px-4 py-1 md:hidden">
        {chips.map((c) => {
          const on = c.key === active;
          return (
            <button
              key={c.key}
              type="button"
              aria-pressed={on}
              onClick={() => setActive(c.key)}
              className={cn(
                'inline-flex min-h-9 shrink-0 pointer-coarse:min-h-11 items-center gap-1.5 rounded-full border px-3.5 text-[13px] whitespace-nowrap transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring',
                on ? 'border-primary bg-primary/15 font-medium text-foreground' : 'bg-card text-muted-foreground',
              )}
            >
              {c.key === 'all' ? null : <span aria-hidden className={cn('size-2 shrink-0 rounded-full', STATUS_STYLE[c.key].dot)} />}
              {c.label}
              <span className="font-mono text-xs tabular-nums">{c.count}</span>
            </button>
          );
        })}
      </div>

      {active === 'all' && !apps.length ? <p className="py-6 text-center text-sm text-muted-foreground md:hidden">沒有符合的項目。</p> : null}

      <ul
        {...panHandlers}
        onDragOver={autoScrollOnDrag}
        // 桌機版填滿外層剩下的高度（太矮時至少 320px，改由整頁捲動），欄位撐滿這一列、在欄內捲動。
        // 觸控板橫滑到最左／最右時不觸發瀏覽器的上一頁／下一頁手勢；欄位只擋直向，橫滑才會傳到看板。
        // 拖曳卡片或平移中關掉捲動吸附，不然捲動的每一小步都會被吸回欄位邊界
        className={cn(
          'm-0 flex list-none flex-col gap-4 p-0 md:grid md:snap-x md:snap-proximity md:min-h-80 md:flex-1 md:auto-cols-[minmax(240px,1fr)] md:grid-flow-col md:grid-rows-[minmax(0,1fr)] md:gap-3 md:overflow-x-auto md:scrollbar-none md:overscroll-x-contain md:cursor-grab',
          (dropTarget || panning) && 'md:snap-none',
          panning && 'md:cursor-grabbing md:select-none',
        )}
      >
        {STATUS_LIST.map((s) => {
          const items = apps.filter((a) => a.status === s.key);
          // 手機版：選了別的狀態，或「全部」時這個狀態沒有項目，就不顯示這一段。
          const hiddenOnMobile = active === 'all' ? items.length === 0 : s.key !== active;
          return (
            <li
              key={s.key}
              onDragOver={(e) => {
                if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                if (dropTarget !== s.key) setDropTarget(s.key);
              }}
              onDragLeave={(e) => {
                // 移到欄位內的子元素也會觸發 dragleave，真的離開欄位才清掉
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropTarget(null);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDropTarget(null);
                const id = e.dataTransfer.getData(DRAG_TYPE);
                const app = apps.find((a) => a.id === id);
                if (app && app.status !== s.key) common.onStatus(id, s.key);
              }}
              className={cn(
                'flex min-w-0 snap-start flex-col content-start gap-2 md:overflow-hidden md:rounded-xl md:bg-secondary md:px-2.5 md:pt-2.5 md:outline-2 md:-outline-offset-2 md:outline-transparent md:transition-[outline-color,background-color]',
                dropTarget === s.key && 'md:bg-primary/10 md:outline-dashed md:outline-primary',
                hiddenOnMobile && 'max-md:hidden',
              )}
            >
              {/* 欄位標題：桌機版一律顯示；手機版只在「全部」時當作分段標題 */}
              <div className={cn('flex items-center justify-between gap-2 px-1 py-0.5', active !== 'all' && 'max-md:hidden')}>
                <span className="inline-flex items-center gap-1.5 font-medium max-md:text-[13px] max-md:text-muted-foreground">
                  <span aria-hidden className={cn('size-[9px] rounded-full', STATUS_STYLE[s.key].dot)} />
                  {s.label}
                </span>
                <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
              </div>
              {/* 桌機版只有卡片區在欄內捲動，標題留在上方；捲軸貼齊欄位右緣，平常隱藏，滑鼠移到欄位上才顯示。
                  上方多留 2px 給卡片的聚焦外框，不被捲動區裁掉 */}
              <div className="flex flex-col gap-2 md:-mx-2.5 md:-mt-0.5 md:min-h-0 md:flex-1 md:overflow-y-auto md:overscroll-y-contain md:px-2.5 md:pt-0.5 md:pb-2.5 md:scrollbar-thin-hover md:*:shrink-0">
                {items.length ? (
                  items.map((a) => <ApplicationCard key={a.id} app={a} {...common} />)
                ) : (
                  <div className="px-1.5 py-3.5 text-center text-xs text-muted-foreground">沒有項目</div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
