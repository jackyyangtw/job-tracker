import { CalendarCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { interviewTimeLabel } from '@/lib/applications/interview';
import { STATUS_LABEL, type Application } from '@/lib/types';
import { STATUS_STYLE } from '@/lib/ui/statusStyle';
import { cn } from '@/lib/utils';

/** 投遞的狀態標籤與面試時間；「依公司」的卡片標題與「依題目」的出處都會用到。 */
export function AppMeta({ app }: { app: Application }) {
  const style = STATUS_STYLE[app.status];
  const time = interviewTimeLabel(app.interviewAt);
  return (
    <>
      <Badge className={style.pill}>
        <span aria-hidden className={cn('size-[7px] rounded-full', style.dot)} />
        {STATUS_LABEL[app.status]}
      </Badge>
      {time ? (
        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
          <CalendarCheck aria-hidden className="size-3.5" />
          <span className="sr-only">面試時間：</span>
          <span className="font-mono tabular-nums">{time}</span>
        </span>
      ) : null}
    </>
  );
}
