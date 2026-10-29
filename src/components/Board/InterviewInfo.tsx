import { CalendarCheck, MapPin } from 'lucide-react';
import { interviewTimeLabel, splitInterviewPlace } from '@/lib/applications/interview';
import type { Application } from '@/lib/types';
import { cn } from '@/lib/utils';

/**
 * 面試中的時間與地點；地點裡的連結（地圖、視訊會議）做成按鈕。
 * 只在「面試中」且有填資料時顯示。連結疊在卡片的「點整張卡片編輯」之上（relative z-10）。
 */
export default function InterviewInfo({ app, className }: { app: Application; className?: string }) {
  if (app.status !== 'interview' || (!app.interviewAt && !app.interviewLocation)) return null;
  const time = interviewTimeLabel(app.interviewAt);
  const place = splitInterviewPlace(app.interviewLocation);

  return (
    // 用「面試中」的狀態色（左側色條＋淡底色）讓這塊比一般資訊醒目，深淺色主題都有對應的色票。
    <div
      className={cn(
        'flex flex-col gap-1 rounded-md border-l-[3px] border-status-interview bg-status-interview/12 py-1.5 pr-2 pl-2 text-[13px]',
        className,
      )}
    >
      {time ? (
        <div className="flex items-center gap-1.5 font-semibold text-foreground">
          <CalendarCheck aria-hidden className="size-4 shrink-0 text-status-interview" />
          <span className="sr-only">面試時間：</span>
          <span className="font-mono tabular-nums">{time}</span>
        </div>
      ) : null}
      {place.text || place.url ? (
        <div className="flex min-w-0 items-start gap-1.5 text-foreground">
          <MapPin aria-hidden className="mt-0.5 size-4 shrink-0 text-status-interview" />
          <span className="sr-only">面試地點：</span>
          <span className="min-w-0 wrap-anywhere">
            {place.text}
            {place.url ? (
              <a
                href={place.url}
                target="_blank"
                rel="noopener noreferrer"
                draggable={false}
                className={cn(
                  'relative z-10 font-medium text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none',
                  // 手機版放大觸控範圍，用負邊距抵銷，版面高度不變
                  'pointer-coarse:-my-2 pointer-coarse:inline-block pointer-coarse:py-2',
                  place.text && 'ml-1.5',
                )}
              >
                {place.linkLabel}
              </a>
            ) : null}
          </span>
        </div>
      ) : null}
    </div>
  );
}
