import { FileText, Link2 } from 'lucide-react';
import type { Resume } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  resume: Resume;
  /** 由 useShell().resumeHref 取得；PDF 的簽章網址還沒準備好時是 ''。 */
  href: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * 開啟履歷版本的連結：網址版本開原網址，PDF 開簽章網址。都在新分頁開啟，
 * PDF 不加 download 屬性，瀏覽器會用內建的檢視器預覽而不是下載。
 */
export default function ResumeLink({ resume, href, className, children }: Props) {
  const Icon = resume.kind === 'pdf' ? FileText : Link2;
  const content = children ?? (
    <>
      <Icon aria-hidden className="size-4 shrink-0" />
      <span className="min-w-0 truncate">{resume.name}</span>
    </>
  );
  if (!href) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-muted-foreground', className)} title="PDF 連結準備中">
        {content}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        'inline-flex min-w-0 items-center gap-1.5 font-medium text-primary underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none',
        className,
      )}
    >
      {content}
      <span className="sr-only">（在新分頁開啟{resume.kind === 'pdf' ? ' PDF 預覽' : ''}）</span>
    </a>
  );
}
