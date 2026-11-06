import { Card, CardDescription, CardTitle } from '@/components/ui/card';
import { funnel } from '@/lib/stats/funnel';
import type { Application } from '@/lib/types';

/** 各階段之間的轉換說明，順序對應 funnel() 回傳的階段。 */
const NEXT_TEXT = ['進到面試', '拿到 Offer'];

/** 轉換漏斗：已投遞 → 面試 → Offer。 */
export default function FunnelPanel({ apps }: { apps: Application[] }) {
  const steps = funnel(apps);
  const sent = steps[0].n;

  return (
    <Card className="rounded-[10px] p-3.5">
      <CardTitle>轉換漏斗</CardTitle>
      <CardDescription className="mb-2.5">「面試」包含目前在面試、等待結果、拿到 Offer，以及有填面試時間的投遞</CardDescription>
      {sent ? (
        <ol className="m-0 flex list-none flex-col gap-2 pl-0">
          {steps.map((s, i) => (
            <li key={s.label} className="flex flex-col gap-1">
              <div className="flex items-baseline justify-between gap-2">
                <span>{s.label}</span>
                <span className="font-mono text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {s.n} 筆{i > 0 ? ` · 占投遞 ${s.ofSent}%` : ''}
                </span>
              </div>
              <div className="h-2.5 overflow-hidden rounded bg-secondary" aria-hidden>
                <div className="h-full rounded bg-primary" style={{ width: `${s.ofSent}%` }} />
              </div>
              {i < steps.length - 1 ? (
                <span className="text-xs text-muted-foreground">
                  ↓ {steps[i + 1].ofPrev === null ? '—' : `${steps[i + 1].ofPrev}% ${NEXT_TEXT[i]}`}
                </span>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-muted-foreground">投遞幾筆之後，這裡會顯示各階段的轉換率。</p>
      )}
    </Card>
  );
}
