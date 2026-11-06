import { Info, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { compareVersions, leadingVersion, sampleLevel, type SampleLevel, type VersionStats } from '@/lib/stats/resume';
import type { Application } from '@/lib/types';
import { cn } from '@/lib/utils';

const EMPTY_LABEL = '未填版本';

const SAMPLE_NOTE: Record<SampleLevel, string | null> = {
  'very-few': '樣本極少，結果僅供參考',
  few: '樣本偏少，建議持續觀察',
  enough: null,
};

/** 小字說明，前面加資訊圖示。 */
function Note({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <p className={cn('m-0 flex items-start gap-1.5 text-xs text-muted-foreground', className)}>
      <Info aria-hidden className="mt-px size-3.5 shrink-0" />
      <span>{children}</span>
    </p>
  );
}

/** 「5 筆投遞中有 3 筆進入面試，並獲得 1 筆 Offer。」 */
function summaryOf(r: VersionStats): string {
  const offer = r.offer ? `，並獲得 ${r.offer} 筆 Offer` : '';
  const caution = sampleLevel(r.n) === 'enough' ? '' : '樣本仍少，尚無法判定哪份履歷確實較好。';
  return `${r.n} 筆投遞中有 ${r.interviewed} 筆進入面試${offer}。${caution}`;
}

/** 一個版本的成效卡片：底色比外層卡片深一階（不用邊框）來區分層次；領先的版本加主色外框與主色數字。 */
function VersionCard({ r, leading }: { r: VersionStats; leading: boolean }) {
  const level = sampleLevel(r.n);
  const note = SAMPLE_NOTE[level];
  return (
    <li className={cn('flex flex-col gap-2.5 rounded-lg bg-background/70 p-3.5', leading && 'ring-1 ring-primary/50')}>
      <div className="flex items-start justify-between gap-2">
        <span className="font-medium wrap-anywhere">{r.name}</span>
        <Badge className="tabular-nums">{r.n} 筆投遞</Badge>
      </div>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-1">
        <div>
          <div className={cn('font-mono text-3xl leading-none font-semibold tabular-nums', leading && 'text-primary')}>{r.interviewPct}%</div>
          <div className="mt-1 text-xs text-muted-foreground">面試邀約率</div>
        </div>
        <dl className="m-0 flex gap-3 text-xs text-muted-foreground">
          <div className="flex items-baseline gap-1">
            <dt>面試</dt>
            <dd className="m-0 font-mono text-sm font-medium text-foreground tabular-nums">{r.interviewed}</dd>
          </div>
          <div className="flex items-baseline gap-1">
            <dt>Offer</dt>
            <dd className="m-0 font-mono text-sm font-medium text-foreground tabular-nums">{r.offer}</dd>
          </div>
        </dl>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-secondary" aria-hidden>
        <div
          className={cn(
            'h-full rounded-full',
            // 領先的版本用主色；樣本極少的用灰色，避免一筆就 100% 看起來很亮眼
            leading ? 'bg-primary' : level === 'very-few' ? 'bg-muted-foreground/50' : 'bg-primary/55',
          )}
          style={{ width: `${r.interviewPct}%` }}
        />
      </div>
      {note ? <Note>{note}</Note> : null}
    </li>
  );
}

/**
 * 履歷版本成效：以「面試邀約率」比較各版本，並指出目前表現領先的版本。
 * 為了讓一般使用者看得懂，不顯示信賴區間，改用文字標示樣本是否足夠。
 */
export default function ResumePerformancePanel({ apps }: { apps: Application[] }) {
  const rows = compareVersions(apps, (a) => a.resume, EMPTY_LABEL);
  const total = rows.reduce((sum, r) => sum + r.n, 0);
  const named = rows.filter((r) => r.name !== EMPTY_LABEL).length;
  const leader = leadingVersion(rows, EMPTY_LABEL);

  return (
    <Card className="gap-3 rounded-[10px]">
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-1">
          <CardTitle>履歷版本成效</CardTitle>
          <CardDescription>比較不同履歷獲得面試的表現</CardDescription>
        </div>
        {/* 只有一個版本時和版本卡片上的筆數重複，就不顯示 */}
        {rows.length > 1 ? <Badge className="tabular-nums">共 {total} 筆投遞</Badge> : null}
      </div>

      {rows.length ? (
        <>
          {/* 只有一個版本時沒什麼好比的，就不顯示結論 */}
          {named >= 2 ? (
            <div className="flex flex-col gap-1 rounded-lg bg-primary/10 px-3.5 py-3">
              {leader ? (
                <>
                  <p className="m-0 flex items-center gap-1.5 font-medium">
                    <TrendingUp aria-hidden className="size-4 shrink-0 text-primary" />
                    <span className="wrap-anywhere">目前表現領先：{leader.name}</span>
                  </p>
                  <p className="m-0 text-sm text-muted-foreground">{summaryOf(leader)}</p>
                </>
              ) : (
                <p className="m-0 text-sm text-muted-foreground">各版本的投遞還太少或都還沒有面試，暫時看不出哪份履歷表現較好。</p>
              )}
            </div>
          ) : null}

          {/* auto-fit：卡片平均分攤整列寬度；min(100%, 280px) 讓窄螢幕不會溢出。
              只有一張時限制最大寬度，避免被拉得過寬。 */}
          <ul
            className={cn(
              'm-0 grid list-none grid-cols-[repeat(auto-fit,minmax(min(100%,280px),1fr))] gap-2.5 pl-0',
              rows.length === 1 && 'max-w-md',
            )}
          >
            {rows.map((r) => (
              <VersionCard key={r.name} r={r} leading={r === leader} />
            ))}
          </ul>

          <Note className="border-t pt-3">面試邀約率 = 曾獲得面試邀約的投遞數 ÷ 總投遞數。各版本投遞的職缺不同，結果不代表履歷本身的優劣。</Note>
        </>
      ) : (
        <p className="text-muted-foreground">投遞時選擇履歷版本，這裡就會比較各版本的表現。</p>
      )}
    </Card>
  );
}
