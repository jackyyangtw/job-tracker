'use client';

import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NativeSelect } from '@/components/ui/native-select';
import { shortDate } from '@/lib/dates';
import { flagsOf } from '@/lib/flags';
import { STATUS_STYLE } from '@/lib/statusStyle';
import { STATUS_LABEL, STATUS_LIST, type Application, type Status } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Common {
  staleDays: number;
  onEdit: (id: string) => void;
  onStatus: (id: string, status: Status) => void;
}

function AppCard({ app, staleDays, onEdit, onStatus }: Common & { app: Application }) {
  const hasFlags = flagsOf(app, staleDays).length > 0;
  return (
    <Card className={cn('rounded-[9px] p-3', app.sample && 'border-dashed opacity-85')}>
      <div className="font-bold wrap-anywhere">
        {app.company} {app.sample && <SampleTag />}
      </div>
      {app.title && <div className="text-muted-foreground wrap-anywhere">{app.title}</div>}
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {app.source && <Badge className="rounded-md">{app.source}</Badge>}
        {app.appliedAt && <span className="font-mono tabular-nums">投 {shortDate(app.appliedAt)}</span>}
        {app.followUpAt && <span className="font-mono tabular-nums">跟進 {shortDate(app.followUpAt)}</span>}
        {app.url && (
          <a className="text-primary underline-offset-2 hover:underline" href={app.url} target="_blank" rel="noopener noreferrer" aria-label="開啟職缺連結">
            連結
          </a>
        )}
      </div>
      {app.resume && <div className="text-xs text-muted-foreground">履歷：{app.resume}</div>}
      {hasFlags && (
        <div className="flex flex-wrap items-center gap-1">
          <FlagBadges app={app} staleDays={staleDays} />
        </div>
      )}
      {app.note && <div className="line-clamp-2 text-xs text-muted-foreground wrap-anywhere">{app.note}</div>}
      <div className="mt-0.5 flex items-center gap-1.5">
        <NativeSelect
          wrapperClassName="flex-1"
          className="min-h-8 text-[13px]"
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
        {!app.sample && (
          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(app.id)}>
            編輯
          </Button>
        )}
      </div>
    </Card>
  );
}

export function Board({ apps, ...common }: Common & { apps: Application[] }) {
  return (
    <div className="grid snap-x snap-proximity auto-cols-[minmax(188px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2" role="list">
      {STATUS_LIST.map((s) => {
        const items = apps.filter((a) => a.status === s.key);
        return (
          <section
            key={s.key}
            role="listitem"
            aria-label={s.label}
            className="flex min-w-0 snap-start flex-col content-start gap-2 rounded-xl bg-secondary p-2.5"
          >
            <div className="flex items-center justify-between gap-2 px-1 py-0.5">
              <span className="inline-flex items-center gap-1.5 font-medium">
                <span className={cn('size-[9px] rounded-full', STATUS_STYLE[s.key].dot)} />
                {s.label}
              </span>
              <span className="font-mono text-xs text-muted-foreground">{items.length}</span>
            </div>
            {items.length ? (
              items.map((a) => <AppCard key={a.id} app={a} {...common} />)
            ) : (
              <div className="px-1.5 py-3.5 text-center text-xs text-muted-foreground">沒有項目</div>
            )}
          </section>
        );
      })}
    </div>
  );
}

export function ListView({ apps, staleDays, onEdit }: Pick<Common, 'staleDays' | 'onEdit'> & { apps: Application[] }) {
  if (!apps.length) return <p className="text-muted-foreground">沒有符合的項目。</p>;
  const th = 'px-3 py-2 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground';
  const td = 'border-t px-3 py-2 align-top';
  return (
    <div className="overflow-x-auto rounded-[10px] border bg-card">
      <table className="w-full min-w-[760px] border-collapse">
        <thead>
          <tr>
            <th className={th}>公司／職位</th>
            <th className={th}>來源</th>
            <th className={th}>狀態</th>
            <th className={th}>投遞日</th>
            <th className={th}>履歷</th>
            <th className={th}>跟進</th>
            <th className={th} />
          </tr>
        </thead>
        <tbody>
          {apps.map((a) => (
            <tr key={a.id}>
              <td className={td}>
                <div className="font-bold">
                  {a.company} {a.sample && <SampleTag />}
                </div>
                <div className="text-muted-foreground">
                  {a.title}
                  {a.url && (
                    <>
                      {' · '}
                      <a className="text-primary underline-offset-2 hover:underline" href={a.url} target="_blank" rel="noopener noreferrer">
                        連結
                      </a>
                    </>
                  )}
                </div>
              </td>
              <td className={td}>{a.source}</td>
              <td className={td}>
                <Badge className={STATUS_STYLE[a.status].pill}>
                  <span className={cn('size-[7px] rounded-full', STATUS_STYLE[a.status].dot)} />
                  {STATUS_LABEL[a.status]}
                </Badge>
              </td>
              <td className={cn(td, 'font-mono whitespace-nowrap tabular-nums')}>{a.appliedAt}</td>
              <td className={td}>{a.resume}</td>
              <td className={cn(td, 'font-mono whitespace-nowrap tabular-nums')}>
                {a.followUpAt} <FlagBadges app={a} staleDays={staleDays} />
              </td>
              <td className={td}>
                {!a.sample && (
                  <Button type="button" variant="outline" size="sm" onClick={() => onEdit(a.id)}>
                    編輯
                  </Button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
