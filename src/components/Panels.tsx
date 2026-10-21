'use client';

import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import { Button } from '@/components/ui/button';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { flagsOf, silenceDays } from '@/lib/flags';
import { groupTally, overall } from '@/lib/stats';
import type { Application } from '@/lib/types';

function Tile({ label, value, hint }: { label: string; value: string | number; hint: string }) {
  return (
    <Card className="gap-0 rounded-[10px] px-3.5 py-3">
      <div className="text-xs tracking-wider text-muted-foreground">{label}</div>
      <div className="font-mono text-2xl leading-tight font-medium tabular-nums sm:text-[28px]">{value}</div>
      <div className="min-h-[1.55em] text-xs text-muted-foreground">{hint}</div>
    </Card>
  );
}

export function Tiles({ apps, staleDays }: { apps: Application[]; staleDays: number }) {
  const o = overall(apps);
  const interviewing = apps.filter((a) => a.status === 'interview').length;
  const pending = apps.filter((a) => flagsOf(a, staleDays).length > 0).length;
  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] gap-2.5" aria-label="摘要">
      <Tile label="已投遞" value={o.n} hint="不含「想投」" />
      <Tile label="面試中" value={interviewing} hint="" />
      <Tile label="回應率" value={o.pct === null ? '—' : `${o.pct}%`} hint={o.n ? `${o.replied} / ${o.n} 筆有回覆` : '投遞後才會計算'} />
      <Tile label="待處理提醒" value={pending} hint={pending ? '見下方清單' : '目前沒有'} />
    </section>
  );
}

export function Reminders({
  apps,
  staleDays,
  onFollowed,
  onCopy,
  onEdit,
}: {
  apps: Application[];
  staleDays: number;
  onFollowed: (id: string) => void;
  onCopy: (id: string) => void;
  onEdit: (id: string) => void;
}) {
  const list = apps
    .filter((a) => flagsOf(a, staleDays).length > 0)
    .sort((x, y) => silenceDays(y) - silenceDays(x));
  if (!list.length) return null;
  return (
    <section className="rounded-[10px] border bg-card" aria-label="待處理提醒">
      <h2 className="px-3.5 pt-3 pb-1 text-sm font-medium">該跟進了（{list.length}）</h2>
      <ul className="m-0 list-none py-1 pl-0">
        {list.slice(0, 8).map((a) => (
          <li key={a.id} className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-t px-3.5 py-2 first:border-t-0">
            <div className="min-w-0 flex-[1_1_240px]">
              <b className="font-medium">{a.company}</b> <span className="text-muted-foreground">{a.title}</span>{' '}
              <FlagBadges app={a} staleDays={staleDays} />
              {a.sample && <SampleTag />}
            </div>
            {!a.sample && (
              <div className="flex flex-wrap gap-1.5">
                <Button type="button" variant="outline" size="sm" onClick={() => onCopy(a.id)}>
                  複製跟進訊息
                </Button>
                <Button type="button" variant="outline" size="sm" onClick={() => onFollowed(a.id)}>
                  已跟進
                </Button>
                <Button type="button" variant="ghost" size="sm" aria-label={`編輯 ${a.company}`} onClick={() => onEdit(a.id)}>
                  編輯
                </Button>
              </div>
            )}
          </li>
        ))}
        {list.length > 8 && (
          <li className="border-t px-3.5 py-2">
            <span className="text-xs text-muted-foreground">還有 {list.length - 8} 筆，請在看板或列表中查看。</span>
          </li>
        )}
      </ul>
    </section>
  );
}

export function StatsPanels({ apps }: { apps: Application[] }) {
  const sent = overall(apps).n;
  const cap = `「有回應」指面試、Offer 或收到婉拒${sent < 10 ? '。目前筆數少，僅供參考' : ''}`;
  return (
    <section className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-3" aria-label="回應率統計">
      <TallyPanel title="各來源回應率" cap={cap} rows={groupTally(apps, (a) => a.source, '未填來源')} />
      <TallyPanel title="各履歷版本回應率" cap={cap} rows={groupTally(apps, (a) => a.resume, '未填版本')} />
    </section>
  );
}

function TallyPanel({ title, cap, rows }: { title: string; cap: string; rows: ReturnType<typeof groupTally> }) {
  return (
    <Card className="rounded-[10px] p-3.5">
      <CardTitle>{title}</CardTitle>
      <CardDescription className="mb-2.5">{cap}</CardDescription>
      {rows.length ? (
        rows.map((r) => (
          <div className="grid grid-cols-[minmax(70px,1.2fr)_3fr_auto] items-center gap-2.5 py-1" key={r.name}>
            <span className="wrap-anywhere">{r.name}</span>
            <div className="h-2 overflow-hidden rounded bg-secondary" role="img" aria-label={`回應率 ${r.pct}%`}>
              <div className="h-full rounded bg-primary" style={{ width: `${r.pct}%` }} />
            </div>
            <span className="font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
              {r.replied}/{r.n} · {r.pct}%
            </span>
          </div>
        ))
      ) : (
        <p className="text-muted-foreground">投遞幾筆之後，這裡會顯示各項的回應率。</p>
      )}
    </Card>
  );
}
