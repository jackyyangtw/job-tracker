import { CalendarClock, ExternalLink, FileText, Pencil, Send, StickyNote } from 'lucide-react';
import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { shortDate } from '@/lib/dates';
import { flagsOf } from '@/lib/flags';
import { STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Common } from './types';

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

export default function AppCard({ app, staleDays, onEdit, onStatus }: Common & { app: Application }) {
  const hasFlags = flagsOf(app, staleDays).length > 0;
  const hasMeta = app.source || app.appliedAt || app.followUpAt;

  return (
    <Card className={cn('gap-2 rounded-[9px] p-3', app.sample && 'border-dashed opacity-85')}>
      {/* 公司、職位，連結做成右上角的圖示按鈕 */}
      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <div className="leading-snug font-bold wrap-anywhere">
            {app.company} {app.sample ? <SampleTag /> : null}
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
            className="-mt-1 -mr-1 inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ExternalLink aria-hidden className="size-4" />
          </a>
        ) : null}
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

      {/* 操作區：和內容之間用分隔線區隔 */}
      <div className="mt-0.5 flex items-center gap-1.5 border-t pt-2.5">
        <NativeSelect
          wrapperClassName="flex-1"
          className="min-h-10 text-[13px] md:min-h-8"
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
            className="max-md:size-10 md:size-8"
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
