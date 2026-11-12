'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { InterviewQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ItemProps {
  question: InterviewQuestion;
  /** 題號標籤，例如 `Q1`；不給時只顯示 `Q`。 */
  label?: string;
  /** 回答一開始是否展開。父層要切換「全部顯示／隱藏」時，請連同 key 一起換，讓每題重設。 */
  defaultOpen?: boolean;
  /** 顯示在問題下方的補充資訊（例如「依題目」檢視的公司名稱）。 */
  meta?: React.ReactNode;
  /** 隱藏分類標籤（已經依分類分組時不需要重複顯示）。 */
  hideCategory?: boolean;
}

/** 一題面試問題（唯讀）：Q／A 標籤區分問題與回答，回答可以收合（複習時先自己想再看）。 */
export function QuestionItem({ question: q, label = 'Q', defaultOpen = false, meta, hideCategory = false }: ItemProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <li className="flex flex-col gap-1.5 py-2.5 first:pt-0 last:pb-0">
      <div className="flex items-start gap-2">
        <span
          aria-hidden
          className="mt-px shrink-0 rounded bg-primary/12 px-1.5 py-px font-mono text-[11px] font-semibold text-primary tabular-nums"
        >
          {label}
        </span>
        <p className="m-0 min-w-0 flex-1 text-sm font-medium wrap-anywhere">
          <span className="sr-only">問題：</span>
          {q.question || <span className="text-muted-foreground">（未填問題）</span>}
        </p>
        {q.category && !hideCategory ? <Badge className="shrink-0">{q.category}</Badge> : null}
      </div>
      {meta ? <div className="pl-8 text-xs text-muted-foreground">{meta}</div> : null}
      {q.answer ? (
        <div className="flex flex-col gap-1 pl-8">
          <button
            type="button"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex w-fit items-center gap-1 rounded text-xs text-muted-foreground outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring pointer-coarse:min-h-8"
          >
            <ChevronDown aria-hidden className={cn('size-3.5 transition-transform', open && 'rotate-180')} />
            {open ? '隱藏回答' : '顯示回答'}
          </button>
          {open ? (
            <div className="flex items-start gap-2 rounded-md bg-secondary px-2.5 py-2">
              <span
                aria-hidden
                className="mt-px shrink-0 rounded bg-foreground/10 px-1.5 py-px font-mono text-[11px] font-semibold text-muted-foreground"
              >
                A
              </span>
              <p className="m-0 min-w-0 flex-1 text-sm whitespace-pre-wrap wrap-anywhere">
                <span className="sr-only">回答：</span>
                {q.answer}
              </p>
            </div>
          ) : null}
        </div>
      ) : (
        <p className="m-0 pl-8 text-xs text-muted-foreground/80">尚未記錄回答</p>
      )}
    </li>
  );
}

/** 面試問題清單（唯讀），題號為 Q1、Q2…。投遞詳細內容與「面試題」頁共用。 */
export default function QuestionList({
  questions,
  showAnswers = false,
  className,
}: {
  questions: readonly InterviewQuestion[];
  showAnswers?: boolean;
  className?: string;
}) {
  return (
    <ol className={cn('m-0 flex list-none flex-col divide-y p-0', className)}>
      {questions.map((q, i) => (
        // 清單是唯讀的，同一筆投遞也可能有重複的問題，用索引當 key；showAnswers 改變時重設每題的展開狀態
        <QuestionItem key={`${i}-${showAnswers}`} question={q} label={`Q${i + 1}`} defaultOpen={showAnswers} />
      ))}
    </ol>
  );
}
