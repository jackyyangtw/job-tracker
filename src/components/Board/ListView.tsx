import { FlagBadges, SampleTag } from '@/components/FlagBadges';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { flagsOf } from '@/lib/applications/flags';
import { shortDate } from '@/lib/dates';
import { STATUS_STYLE } from '@/lib/ui/statusStyle';
import { STATUS_LABEL, type Application } from '@/lib/types';
import { cn } from '@/lib/utils';
import type { Common } from './types';

/** 只在手機上顯示的小標籤，因為手機上表格會變成堆疊的卡片。 */
function MobileLabel({ children }: { children: React.ReactNode }) {
  return <span className="mr-1.5 text-xs text-muted-foreground md:hidden">{children}</span>;
}

export default function ListView({ apps, staleDays, onEdit }: Pick<Common, 'staleDays' | 'onEdit'> & { apps: Application[] }) {
  if (!apps.length) return <p className="text-muted-foreground">沒有符合的項目。</p>;
  const th = 'px-3 py-2 text-left text-xs font-medium tracking-wide whitespace-nowrap text-muted-foreground';
  // 手機：每一列變成一張卡片（不需橫向捲動）。md 以上：一般表格。
  const td = 'md:border-t md:px-3 md:py-2 md:align-top max-md:block max-md:py-0.5';
  const pill = 'max-md:inline-block max-md:mr-2';
  return (
    <div className="rounded-[10px] border bg-card md:overflow-x-auto">
      <table className="w-full border-collapse max-md:block md:min-w-[760px]">
        <thead className="max-md:sr-only">
          <tr>
            <th className={th}>公司／職位</th>
            <th className={th}>來源</th>
            <th className={th}>狀態</th>
            <th className={th}>投遞日</th>
            <th className={th}>履歷</th>
            <th className={th}>跟進</th>
            <th className={th}>
              <span className="sr-only">操作</span>
            </th>
          </tr>
        </thead>
        <tbody className="max-md:block">
          {apps.map((a) => (
            <tr key={a.id} className="max-md:block max-md:border-t max-md:p-3 max-md:first:border-t-0">
              <td className={td}>
                <div className="font-bold wrap-anywhere">
                  {a.company} {a.sample && <SampleTag />}
                </div>
                <div className="text-muted-foreground wrap-anywhere">
                  {a.title}
                  {a.url && (
                    <>
                      {a.title && ' · '}
                      <a
                        className="text-primary underline-offset-2 hover:underline"
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`開啟 ${a.company} 的職缺頁面`}
                      >
                        連結
                      </a>
                    </>
                  )}
                </div>
              </td>
              <td className={cn(td, pill, !a.source && 'max-md:hidden')}>{a.source}</td>
              <td className={cn(td, pill)}>
                <Badge className={STATUS_STYLE[a.status].pill}>
                  <span aria-hidden className={cn('size-[7px] rounded-full', STATUS_STYLE[a.status].dot)} />
                  {STATUS_LABEL[a.status]}
                </Badge>
              </td>
              <td className={cn(td, 'font-mono tabular-nums md:whitespace-nowrap', !a.appliedAt && 'max-md:hidden')}>
                <MobileLabel>投遞日</MobileLabel>
                {shortDate(a.appliedAt)}
              </td>
              <td className={cn(td, !a.resume && 'max-md:hidden')}>
                <MobileLabel>履歷</MobileLabel>
                {a.resume}
              </td>
              <td className={cn(td, 'font-mono tabular-nums md:whitespace-nowrap', !a.followUpAt && !flagsOf(a, staleDays).length && 'max-md:hidden')}>
                <MobileLabel>跟進</MobileLabel>
                {shortDate(a.followUpAt)} <FlagBadges app={a} staleDays={staleDays} />
              </td>
              <td className={cn(td, a.sample && 'max-md:hidden', 'max-md:pt-2')}>
                {!a.sample && (
                  <Button type="button" variant="outline" size="sm" className="max-md:h-10 max-md:px-4" aria-label={`編輯 ${a.company}`} onClick={() => onEdit(a.id)}>
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
