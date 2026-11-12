'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { CATEGORY_MAX_LENGTH, categoryUsage, cleanCategory, renameCategory, UNCATEGORIZED } from '@/lib/applications/interviewQuestions';
import type { Application } from '@/lib/types';

interface Props {
  apps: readonly Application[];
  /** 批次儲存改過分類的投遞，回傳是否全部成功。 */
  saveMany: (apps: Application[]) => Promise<boolean>;
  onClose: () => void;
}

/**
 * 管理分類：改名（所有用到的題目一起改）、改成既有名稱即合併、刪除（題目變成未分類）。
 * 分類存在每一題裡，所以只列出有題目在用的分類；預設分類沒被用到時不會出現在這裡。
 */
export default function CategoryManager({ apps, saveMany, onClose }: Props) {
  const usage = categoryUsage(apps).filter((c) => c.name !== UNCATEGORIZED);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  // 正在等待第二次點擊確認刪除的分類
  const [armed, setArmed] = useState<string | null>(null);

  async function apply(from: string, to: string) {
    const changed = renameCategory(apps, from, to);
    if (!changed.length) return;
    setBusy(from);
    const ok = await saveMany(changed);
    setBusy(null);
    setArmed(null);
    if (!ok) return;
    setDrafts((d) => {
      const next = { ...d };
      delete next[from];
      return next;
    });
    const target = cleanCategory(to);
    toast(!target ? `已刪除分類「${from}」` : usage.some((c) => c.name === target) ? `已將「${from}」合併到「${target}」` : `已將「${from}」改名為「${target}」`);
  }

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent aria-describedby="category-desc">
        <DialogTitle>管理分類</DialogTitle>
        {/* 專案的 DialogDescription 預設只給螢幕閱讀器；這裡的操作說明對所有人都有用，所以顯示出來 */}
        <DialogDescription id="category-desc" className="not-sr-only text-sm text-muted-foreground">
          改名會套用到所有用到這個分類的題目；改成已經有的分類名稱就是合併。刪除分類不會刪除題目，題目會變成未分類。
        </DialogDescription>
        {usage.length ? (
          <ul className="m-0 flex list-none flex-col divide-y rounded-lg border p-0">
            {usage.map(({ name, count }) => {
              const draft = drafts[name] ?? name;
              const target = cleanCategory(draft);
              const changed = !!target && target !== name;
              const merging = changed && usage.some((c) => c.name === target);
              return (
                <li key={name} className="flex flex-col gap-1.5 px-3 py-2.5">
                  <form
                    className="flex items-center gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (changed) void apply(name, target);
                    }}
                  >
                    <Input
                      value={draft}
                      onChange={(e) => setDrafts((d) => ({ ...d, [name]: e.target.value }))}
                      aria-label={`分類「${name}」的名稱`}
                      maxLength={CATEGORY_MAX_LENGTH}
                      autoComplete="off"
                      className="min-w-0 flex-1"
                      disabled={!!busy}
                    />
                    <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{count} 題</span>
                    <Button type="submit" size="sm" variant={changed ? 'default' : 'outline'} disabled={!changed || !!busy}>
                      {busy === name ? '儲存中…' : merging ? '合併' : '改名'}
                    </Button>
                    <Button
                      type="button"
                      size="icon"
                      variant={armed === name ? 'destructive-solid' : 'ghost'}
                      className={armed === name ? 'shrink-0' : 'shrink-0 text-muted-foreground hover:text-destructive'}
                      aria-label={armed === name ? `再按一次確認刪除分類「${name}」` : `刪除分類「${name}」`}
                      title={armed === name ? '再按一次確認刪除' : '刪除分類'}
                      disabled={!!busy}
                      onClick={() => (armed === name ? void apply(name, '') : setArmed(name))}
                    >
                      <Trash2 aria-hidden />
                    </Button>
                  </form>
                  {merging ? (
                    <p className="m-0 text-xs text-muted-foreground">「{target}」已經存在，按「合併」會把這 {count} 題移過去。</p>
                  ) : armed === name ? (
                    <p role="status" className="m-0 text-xs text-destructive">
                      再按一次垃圾桶確認刪除，這 {count} 題會變成未分類。
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">還沒有題目設定分類。在投遞的編輯表單裡，展開題目就可以選擇或輸入分類。</p>
        )}
        <div className="flex justify-end">
          <Button type="button" variant="outline" onClick={onClose} disabled={!!busy}>
            完成
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
