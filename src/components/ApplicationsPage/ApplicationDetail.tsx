'use client';

import { CalendarClock, ExternalLink, FileText, MessageCircle, Pencil, Send, Tag } from 'lucide-react';
import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import InterviewInfo from '@/components/InterviewInfo';
import ResumeLink from '@/components/ResumeLink';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { NativeSelect } from '@/components/ui/native-select';
import { hostOf } from '@/lib/resumes/resume';
import { STATUS_STYLE } from '@/lib/ui/statusStyle';
import { STATUS_LABEL, STATUS_LIST, type Application, type Resume, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  app: Application;
  /** 投遞選用的履歷版本（履歷頁找得到時）。 */
  resume: Resume | null;
  resumeHref: (resume: Resume) => string;
  staleDays: number;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
  onClose: () => void;
}

/** `2026-10-27` -> `2026/10/27` */
const fullDate = (s: string) => s.replaceAll('-', '/');

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2">
      <dt className="flex w-20 shrink-0 items-center gap-1.5 text-muted-foreground [&_svg]:size-4 [&_svg]:shrink-0">
        <span aria-hidden>{icon}</span>
        {label}
      </dt>
      <dd className="min-w-0 flex-1 wrap-anywhere">{children}</dd>
    </div>
  );
}

/** 點卡片時顯示的投遞詳細內容（唯讀）；要修改請按「編輯」開表單。 */
export default function ApplicationDetail({ app, resume, resumeHref, staleDays, onEdit, onStatus, onClose }: Props) {
  const style = STATUS_STYLE[app.status];

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby="detail-desc"
        className="gap-4"
        // 預設會聚焦第一個可操作元素（狀態選單），看起來像被選取；改為聚焦對話框本身，Tab 再進入內容。
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement).focus();
        }}
      >
        <div className="flex flex-col gap-1 pr-1">
          <DialogTitle className="text-xl font-bold wrap-anywhere">
            {app.company} {app.sample ? <SampleTag /> : null}
          </DialogTitle>
          {app.title ? <p className="text-muted-foreground wrap-anywhere">{app.title}</p> : null}
          <DialogDescription id="detail-desc">投遞的詳細內容</DialogDescription>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <Badge className={style.pill}>
            <span aria-hidden className={cn('size-[7px] rounded-full', style.dot)} />
            {STATUS_LABEL[app.status]}
          </Badge>
          <FlagBadges app={app} staleDays={staleDays} />
        </div>

        <InterviewInfo app={app} />

        <dl className="m-0 divide-y rounded-lg border px-3 text-sm">
          {app.url ? (
            <Row icon={<ExternalLink />} label="職缺連結">
              <a
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                title={app.url}
                className="font-medium text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
              >
                {hostOf(app.url)}
              </a>
            </Row>
          ) : null}
          <Row icon={<Tag />} label="來源">
            {app.source || <Empty />}
          </Row>
          <Row icon={<Send />} label="投遞日">
            {app.appliedAt ? <span className="font-mono tabular-nums">{fullDate(app.appliedAt)}</span> : <Empty />}
          </Row>
          <Row icon={<CalendarClock />} label="下次跟進">
            {app.followUpAt ? <span className="font-mono tabular-nums">{fullDate(app.followUpAt)}</span> : <Empty />}
          </Row>
          {app.lastContact ? (
            <Row icon={<MessageCircle />} label="上次聯絡">
              <span className="font-mono tabular-nums">{fullDate(app.lastContact)}</span>
            </Row>
          ) : null}
          <Row icon={<FileText />} label="履歷版本">
            {resume ? <ResumeLink resume={resume} href={resumeHref(resume)} /> : app.resume || <Empty />}
          </Row>
        </dl>

        <section aria-labelledby="detail-note" className="flex flex-col gap-1.5">
          <h3 id="detail-note" className="text-sm font-medium text-muted-foreground">
            備註
          </h3>
          {app.note ? (
            <p className="m-0 rounded-lg bg-secondary px-3 py-2.5 text-sm whitespace-pre-wrap wrap-anywhere">{app.note}</p>
          ) : (
            <p className="m-0 text-sm text-muted-foreground">沒有備註</p>
          )}
        </section>

        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          {app.sample ? (
            <span />
          ) : (
            <NativeSelect
              wrapperClassName="min-w-32"
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
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              關閉
            </Button>
            {app.sample ? null : (
              <Button type="button" onClick={() => onEdit(app.id)}>
                <Pencil aria-hidden />
                編輯
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Empty() {
  return <span className="text-muted-foreground">—</span>;
}
