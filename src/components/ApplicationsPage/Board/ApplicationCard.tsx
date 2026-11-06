import { useState } from 'react';
import { ArrowRightLeft, CalendarClock, ExternalLink, Pencil, Send, StickyNote } from 'lucide-react';
import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import InterviewInfo from '@/components/InterviewInfo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { shortDate } from '@/lib/dates';
import { flagsOf } from '@/lib/applications/flags';
import { STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';
import { DRAG_TYPE, type Common } from './types';

/** 圖示＋值的小資訊。圖示只是裝飾，螢幕閱讀器會唸 `label`。 */
function Meta({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <span className="inline-flex min-w-0 items-center gap-1" title={label}>
      <span aria-hidden className="shrink-0 [&_svg]:size-3.5">
        {icon}
      </span>
      <span className="sr-only">{label}：</span>
      <span className="truncate font-mono tabular-nums">{children}</span>
    </span>
  );
}

/** 卡片底部桌機版的圖示按鈕外觀。 */
const iconAction =
  'relative inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-secondary hover:text-primary focus-visible:ring-2 focus-visible:ring-ring [&_svg]:size-3.5';

/** 桌機版的狀態切換：外觀是圖示按鈕，上面疊一個透明的原生 <select>，保留鍵盤與螢幕閱讀器操作。 */
function StatusIconSelect({ app, onStatus }: { app: Application; onStatus: Common['onStatus'] }) {
  return (
    <span title="變更狀態" className={cn(iconAction, 'focus-within:ring-2 focus-within:ring-ring')}>
      <ArrowRightLeft aria-hidden />
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

/**
 * 看板卡片：只放公司、職位、來源與日期、面試資訊與提醒，其餘（履歷、完整備註…）在詳細內容裡。
 * 點卡片開詳細內容；底部是職缺連結、變更狀態與編輯。
 */
export default function ApplicationCard({ app, staleDays, onView, onEdit, onStatus }: Common & { app: Application }) {
  const hasFlags = flagsOf(app, staleDays).length > 0;
  const hasMeta = app.source || app.appliedAt || app.followUpAt || app.note;
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
        'relative gap-2.5 rounded-[9px] p-3 transition-colors hover:border-primary/50',
        app.sample ? 'border-dashed opacity-85' : 'md:cursor-grab md:active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      {/* 公司、職位：公司名稱的按鈕用 ::after 撐滿整張卡片，點卡片任何地方都會開詳細內容 */}
      <div className="min-w-0">
        <div className="leading-snug font-bold wrap-anywhere">
          <button
            type="button"
            onClick={() => onView(app.id)}
            aria-label={`查看 ${app.company} 的詳細內容`}
            className="line-clamp-2 cursor-pointer text-left outline-none after:absolute after:inset-0 after:rounded-[9px] focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {app.company}
          </button>
          {app.sample ? <SampleTag /> : null}
        </div>
        {app.title ? <div className="mt-0.5 line-clamp-2 text-[13px] text-muted-foreground wrap-anywhere">{app.title}</div> : null}
      </div>

      {/* 來源與日期 */}
      {hasMeta ? (
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-muted-foreground">
          {app.source ? <Badge className="rounded-md">{app.source}</Badge> : null}
          {app.appliedAt ? (
            <Meta icon={<Send />} label="投遞日">
              {shortDate(app.appliedAt)}
            </Meta>
          ) : null}
          {app.followUpAt ? (
            <Meta icon={<CalendarClock />} label="下次跟進">
              {shortDate(app.followUpAt)}
            </Meta>
          ) : null}
          {/* 有備註時和日期放在一起當作資訊提示（不是按鈕），內容在詳細內容裡 */}
          {app.note ? (
            <span title="有備註" className="inline-flex items-center">
              <StickyNote aria-hidden className="size-3.5" />
              <span className="sr-only">有備註</span>
            </span>
          ) : null}
        </div>
      ) : null}

      <InterviewInfo app={app} />

      {hasFlags ? (
        <div className="flex flex-wrap items-center gap-1">
          <FlagBadges app={app} staleDays={staleDays} />
        </div>
      ) : null}

      {/* 操作區。疊在撐滿卡片的按鈕之上（relative z-10），才點得到。 */}
      {app.sample && !app.url ? null : (
        <div className="relative z-10 -mx-1 -mb-1 flex items-center gap-1.5 border-t px-1 pt-2 md:gap-0.5">
          <span className="mr-auto max-md:hidden" />
          {app.sample ? null : (
            <NativeSelect
              wrapperClassName="flex-1 md:hidden"
              className="text-[13px]"
              value={app.status}
              aria-label="變更狀態"
              onChange={(e) => onStatus(app.id, e.target.value as Status)}
            >
              {STATUS_LIST.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </NativeSelect>
          )}
          {app.url ? (
            <>
              <Button asChild variant="outline" size="icon" className="md:hidden">
                <a href={app.url} target="_blank" rel="noopener noreferrer" draggable={false} aria-label={`開啟 ${app.company} 的職缺頁面`}>
                  <ExternalLink aria-hidden />
                </a>
              </Button>
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                aria-label={`開啟 ${app.company} 的職缺頁面`}
                title="開啟職缺頁面"
                className={cn(iconAction, 'max-md:hidden')}
              >
                <ExternalLink aria-hidden />
              </a>
            </>
          ) : null}
          {app.sample ? null : (
            <>
              <Button type="button" variant="outline" size="icon" className="md:hidden" aria-label={`編輯 ${app.company}`} onClick={() => onEdit(app.id)}>
                <Pencil aria-hidden />
              </Button>
              <button type="button" aria-label={`編輯 ${app.company}`} title="編輯" className={cn(iconAction, 'max-md:hidden')} onClick={() => onEdit(app.id)}>
                <Pencil aria-hidden />
              </button>
              <span className="max-md:hidden">
                <StatusIconSelect app={app} onStatus={onStatus} />
              </span>
            </>
          )}
        </div>
      )}
    </Card>
  );
}
