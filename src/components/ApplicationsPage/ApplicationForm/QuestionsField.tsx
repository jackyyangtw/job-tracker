import { useState } from 'react';
import { ChevronDown, Plus, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ANSWER_MAX_LENGTH, CATEGORY_MAX_LENGTH, MAX_QUESTIONS, QUESTION_MAX_LENGTH } from '@/lib/applications/interviewQuestions';
import type { InterviewQuestion } from '@/lib/types';
import { cn } from '@/lib/utils';

interface Props {
  value: readonly InterviewQuestion[];
  onChange: (value: readonly InterviewQuestion[]) => void;
  /** 分類的輸入建議：預設分類加上用過的自訂分類。 */
  categories: readonly string[];
}

const CATEGORY_LIST_ID = 'f-q-categories';

/**
 * 面試問題：每題可以收合（題目多時表單不會太長），展開後編輯問題、分類與回答。
 * 新增的題目預設展開；既有的題目預設收合，標題列顯示問題、分類與是否已回答。
 * 項目只有在刪除時會改變順序，輸入框都是受控元件，所以用索引當 key 不會錯置內容。
 */
export default function QuestionsField({ value, onChange, categories }: Props) {
  const [open, setOpen] = useState<ReadonlySet<number>>(() => new Set());
  // 剛新增的那一題，掛載時自動聚焦問題欄位
  const [added, setAdded] = useState(-1);
  const allOpen = value.length > 0 && open.size === value.length;

  const update = (i: number, patch: Partial<InterviewQuestion>) => onChange(value.map((q, j) => (j === i ? { ...q, ...patch } : q)));

  function toggle(i: number) {
    setOpen((s) => {
      const next = new Set(s);
      if (!next.delete(i)) next.add(i);
      return next;
    });
  }

  function add() {
    setAdded(value.length);
    setOpen((s) => new Set(s).add(value.length));
    onChange([...value, { question: '', answer: '', category: '' }]);
  }

  function remove(i: number) {
    // 後面的題目往前移一格，展開狀態也跟著移
    setOpen((s) => new Set([...s].filter((j) => j !== i).map((j) => (j > i ? j - 1 : j))));
    setAdded(-1);
    onChange(value.filter((_, j) => j !== i));
  }

  return (
    <fieldset className="flex min-w-0 flex-col gap-2 sm:col-span-2">
      {/* 固定高度（同「全部展開」按鈕），有沒有按鈕時標題與下方的間距都一樣 */}
      <div className="mb-1 flex min-h-7 items-center justify-between gap-2">
        <legend className="text-sm leading-none font-medium">
          面試問題{value.length ? <span className="font-normal text-muted-foreground">（{value.length}）</span> : null}
        </legend>
        {value.length > 1 ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setOpen(allOpen ? new Set() : new Set(value.keys()))}
          >
            {allOpen ? '全部收合' : '全部展開'}
          </Button>
        ) : null}
      </div>
      <datalist id={CATEGORY_LIST_ID}>
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {value.length ? (
        <ol className="m-0 flex list-none flex-col gap-2 p-0">
          {value.map((q, i) => {
            const expanded = open.has(i);
            const panelId = `f-q-panel-${i}`;
            return (
              <li key={i} className="rounded-lg border bg-secondary/40">
                <div className="flex items-center gap-1 pr-1">
                  <button
                    type="button"
                    aria-expanded={expanded}
                    aria-controls={panelId}
                    onClick={() => toggle(i)}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ChevronDown aria-hidden className={cn('size-4 shrink-0 text-muted-foreground transition-transform', expanded && 'rotate-180')} />
                    <span className="shrink-0 font-mono text-xs text-muted-foreground tabular-nums">Q{i + 1}</span>
                    <span className={cn('min-w-0 flex-1 truncate', !q.question && 'text-muted-foreground')}>{q.question || '（未填問題）'}</span>
                    {q.category ? (
                      <Badge className="shrink-0 max-sm:hidden">
                        {q.category}
                      </Badge>
                    ) : null}
                    {q.answer ? <span className="shrink-0 text-xs text-muted-foreground">已回答</span> : null}
                  </button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="shrink-0 text-muted-foreground hover:text-destructive"
                    aria-label={`刪除第 ${i + 1} 題`}
                    title="刪除這題"
                    onClick={() => remove(i)}
                  >
                    <Trash2 aria-hidden />
                  </Button>
                </div>
                {expanded ? (
                  <div id={panelId} className="grid grid-cols-1 gap-2 border-t px-2.5 pt-2 pb-2.5 sm:grid-cols-[1fr_10rem]">
                    <div className="flex min-w-0 flex-col gap-1">
                      <Label htmlFor={`f-q-${i}`} className="text-xs text-muted-foreground">
                        問題
                      </Label>
                      <Input
                        id={`f-q-${i}`}
                        value={q.question}
                        onChange={(e) => update(i, { question: e.target.value })}
                        placeholder="被問到的問題"
                        autoComplete="off"
                        maxLength={QUESTION_MAX_LENGTH}
                        // 按下「新增問題」後直接輸入新的一題
                        autoFocus={i === added}
                      />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1">
                      <Label htmlFor={`f-c-${i}`} className="text-xs text-muted-foreground">
                        分類
                      </Label>
                      <Input
                        id={`f-c-${i}`}
                        list={CATEGORY_LIST_ID}
                        value={q.category}
                        onChange={(e) => update(i, { category: e.target.value })}
                        placeholder="選擇或輸入"
                        autoComplete="off"
                        maxLength={CATEGORY_MAX_LENGTH}
                      />
                    </div>
                    <div className="flex min-w-0 flex-col gap-1 sm:col-span-2">
                      <Label htmlFor={`f-a-${i}`} className="text-xs text-muted-foreground">
                        我的回答（選填）
                      </Label>
                      <Textarea
                        id={`f-a-${i}`}
                        value={q.answer}
                        onChange={(e) => update(i, { answer: e.target.value })}
                        placeholder="當時怎麼回答、下次想怎麼說…"
                        maxLength={ANSWER_MAX_LENGTH}
                        className="min-h-16"
                      />
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ol>
      ) : null}
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={add} disabled={value.length >= MAX_QUESTIONS}>
          <Plus aria-hidden />
          新增問題
        </Button>
        <span className="text-xs text-muted-foreground">
          {value.length >= MAX_QUESTIONS ? `最多 ${MAX_QUESTIONS} 題` : '會整理在「面試題」頁方便複習'}
        </span>
      </div>
    </fieldset>
  );
}
