import { useState } from 'react';
import { ArrowRightLeft, CalendarClock, ExternalLink, FileText, Pencil, Send, StickyNote } from 'lucide-react';
import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { shortDate } from '@/lib/dates';
import { flagsOf } from '@/lib/flags';
import { STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DRAG_TYPE, type Common } from './types';

/** 圖示＋值的小資訊。圖示只是裝飾，螢幕閱讀器會唸 `label`。 */
function Meta({ icon, label, mono, children }: { icon: React.ReactNode; label: string; mono?: boolean; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1" title={label}>
      <span aria-hidden className="shrink-0 [&_svg]:size-3.5">
        {icon}
      </span>
      <span className="sr-only">{label}：</span>
      <span className={cn('truncate', mono && 'font-mono tabular-nums')}>{children}</span>
    </span>
  );
}

/** 桌機版右上角的狀態切換：外觀是圖示按鈕，上面疊一個透明的原生 <select>，保留鍵盤與螢幕閱讀器操作。 */
function StatusIconSelect({ app, onStatus }: { app: Application; onStatus: Common['onStatus'] }) {
  return (
    <span
      title="變更狀態"
      className="relative z-10 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors focus-within:ring-2 focus-within:ring-ring hover:bg-secondary hover:text-primary"
    >
      <ArrowRightLeft aria-hidden className="size-3.5" />
      <select
        className="absolute inset-0 cursor-pointer appearance-none opacity-0 outline-none"
        value={app.status}
        aria-label="變更狀態"
        onChange={(e) => onStatus(app.id, e.target.value as Status)}
      >
        {STATUS_LIST.map((s) => (
          <option key={s.key} value={s.key}>
            {s.label}
          </option>
        ))}
      </select>
    </span>
  );
}

export default function AppCard({ app, staleDays, onEdit, onStatus }: Common & { app: Application }) {
  const hasFlags = flagsOf(app, staleDays).length > 0;
  const hasMeta = app.source || app.appliedAt || app.followUpAt;
  const [dragging, setDragging] = useState(false);

  return (
    <Card
      // 桌機版可拖到其他欄位變更狀態（原生拖曳在觸控裝置上不會觸發，手機版仍用下方的選單）
      draggable={!app.sample}
      onDragStart={(e) => {
        e.dataTransfer.setData(DRAG_TYPE, app.id);
        e.dataTransfer.effectAllowed = 'move';
        setDragging(true);
      }}
      onDragEnd={() => setDragging(false)}
      className={cn(
        'relative gap-2 rounded-[9px] p-3',
        app.sample ? 'border-dashed opacity-85' : 'md:cursor-grab md:transition-colors md:hover:border-primary/50 md:active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      {/* 公司、職位；桌機版點整張卡片即可編輯，右上角是連結與狀態切換 */}
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1">
          <div className="leading-snug font-bold wrap-anywhere">
            {app.sample ? (
              app.company
            ) : (
              <button
                type="button"
                onClick={() => onEdit(app.id)}
                aria-label={`編輯 ${app.company}`}
                className="text-left outline-none focus-visible:underline md:after:absolute md:after:inset-0 md:after:rounded-[9px] md:focus-visible:after:ring-2 md:focus-visible:after:ring-ring"
              >
                {app.company}
              </button>
            )}{' '}
            {app.sample ? <SampleTag /> : null}
          </div>
          {app.title ? <div className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground wrap-anywhere">{app.title}</div> : null}
        </div>
        {app.url ? (
          <a
            href={app.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`開啟 ${app.company} 的職缺頁面`}
            title="開啟職缺頁面"
            draggable={false}
            className="relative z-10 -mt-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring max-md:-mr-1 md:-mt-0.5 md:size-7 [&_svg]:size-4 md:[&_svg]:size-3.5"
          >
            <ExternalLink aria-hidden />
          </a>
        ) : null}
        {app.sample ? null : (
          <span className="-mt-0.5 -mr-1 hidden md:inline-flex">
            <StatusIconSelect app={app} onStatus={onStatus} />
          </span>
        )}
      </div>

      {/* 來源與日期 */}
      {hasMeta ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {app.source ? <Badge className="rounded-md">{app.source}</Badge> : null}
          {app.appliedAt ? (
            <Meta icon={<Send />} label="投遞日" mono>
              {shortDate(app.appliedAt)}
            </Meta>
          ) : null}
          {app.followUpAt ? (
            <Meta icon={<CalendarClock />} label="下次跟進" mono>
              {shortDate(app.followUpAt)}
            </Meta>
          ) : null}
        </div>
      ) : null}

      {app.resume ? (
        <div className="flex text-xs text-muted-foreground">
          <Meta icon={<FileText />} label="履歷版本">
            {app.resume}
          </Meta>
        </div>
      ) : null}

      {hasFlags ? (
        <div className="flex flex-wrap items-center gap-1">
          <FlagBadges app={app} staleDays={staleDays} />
        </div>
      ) : null}

      {app.note ? (
        <div className="flex gap-1 text-xs text-muted-foreground">
          <StickyNote aria-hidden className="mt-0.5 size-3.5 shrink-0" />
          <span className="sr-only">備註：</span>
          <span className="line-clamp-2 wrap-anywhere">{app.note}</span>
        </div>
      ) : null}

      {/* 操作區（手機版）：桌機版改由點卡片編輯、右上角切換狀態 */}
      <div className="mt-0.5 flex items-center gap-1.5 border-t pt-2.5 md:hidden">
        <NativeSelect
          wrapperClassName="flex-1"
          className="min-h-10 text-[13px]"
          value={app.status}
          disabled={app.sample}
          aria-label="變更狀態"
          onChange={(e) => onStatus(app.id, e.target.value as Status)}
        >
          {STATUS_LIST.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </NativeSelect>
        {app.sample ? null : (
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="size-10"
            aria-label={`編輯 ${app.company}`}
            title="編輯"
            onClick={() => onEdit(app.id)}
          >
            <Pencil aria-hidden />
          </Button>
        )}
      </div>
    </Card>
  );
}
