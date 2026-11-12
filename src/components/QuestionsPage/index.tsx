'use client';

import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import { Building2, Eye, EyeOff, ListTree, MessageSquareText, Search, Tags } from 'lucide-react';
import { useShell } from '@/components/AppShell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { categoryUsage, questionGroups, topicGroups } from '@/lib/applications/interviewQuestions';
import type { Application } from '@/lib/types';
import ByCompany from './ByCompany';
import ByTopic from './ByTopic';
import CategoryManager from './CategoryManager';

type View = 'company' | 'topic';

/**
 * 面試題頁：整理每次面試被問到的問題。可以依公司或依題目（分類）檢視、搜尋、篩選分類，
 * 回答預設收合方便自我練習，也可以在這裡管理分類。
 */
export default function QuestionsPage() {
  const { apps, loaded, basePath, upsert } = useShell();
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<View>('company');
  const [showAnswers, setShowAnswers] = useState(false);
  const [managing, setManaging] = useState(false);
  const deferredQuery = useDeferredValue(query);

  const usage = categoryUsage(apps);
  // 篩選中的分類被改名或刪掉之後就不存在了，改回顯示全部
  const activeCategory = usage.some((c) => c.name === category) ? category : '';
  const filter = { query: deferredQuery, category: activeCategory };
  const byCompany = view === 'company' ? questionGroups(apps, filter) : [];
  const byTopic = view === 'topic' ? topicGroups(apps, filter) : [];
  const total = view === 'company' ? byCompany.reduce((n, g) => n + g.questions.length, 0) : byTopic.reduce((n, g) => n + g.items.length, 0);
  const hasAny = usage.length > 0;

  async function saveMany(changed: Application[]) {
    const results = await Promise.all(changed.map((a) => upsert(a)));
    return results.every(Boolean);
  }

  return (
    <main id="main" className="mx-auto flex w-full max-w-[1100px] flex-col gap-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-xl font-bold">面試題</h1>
          <p className="max-w-[60ch] text-sm text-muted-foreground">
            整理每次面試被問到的問題。在投遞的「編輯」表單裡填寫「面試問題」（面試中、等待中、Offer、未錄取時可以填），每題可以選填分類和自己的回答。
          </p>
        </div>
        {hasAny ? (
          <Button type="button" variant="outline" className="shrink-0" onClick={() => setManaging(true)}>
            <Tags aria-hidden />
            <span className="max-sm:sr-only">管理分類</span>
          </Button>
        ) : null}
      </div>

      {!loaded ? (
        <div aria-busy className="flex flex-col gap-3">
          {[0, 1].map((i) => (
            <div key={i} className="h-[120px] animate-pulse rounded-[10px] bg-secondary" />
          ))}
        </div>
      ) : !hasAny ? (
        <Card className="items-center gap-2 rounded-[10px] py-8 text-center">
          <MessageSquareText aria-hidden className="size-8 text-muted-foreground" />
          <p className="text-sm font-medium">還沒有記錄面試問題</p>
          <p className="max-w-sm text-xs text-muted-foreground">
            到
            <Link href={`${basePath}/applications`} className="mx-0.5 font-medium text-primary underline-offset-2 hover:underline">
              投遞
            </Link>
            頁編輯面試過的投遞，在「面試問題」填入被問到的題目。
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-0 flex-[1_1_240px]">
              <Search aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜尋問題、回答、公司或職位"
                aria-label="搜尋面試問題"
                className="pl-8"
              />
            </div>
            <NativeSelect wrapperClassName="flex-[1_1_140px] sm:max-w-[200px]" aria-label="分類" value={activeCategory} onChange={(e) => setCategory(e.target.value)}>
              <option value="">所有分類</option>
              {usage.map((c) => (
                <option key={c.name} value={c.name}>
                  {c.name}（{c.count}）
                </option>
              ))}
            </NativeSelect>
            <ToggleGroup type="single" aria-label="檢視方式" value={view} onValueChange={(v) => v && setView(v as View)}>
              <ToggleGroupItem value="company" className="inline-flex items-center gap-1.5">
                <Building2 aria-hidden className="size-4" />
                依公司
              </ToggleGroupItem>
              <ToggleGroupItem value="topic" className="inline-flex items-center gap-1.5">
                <ListTree aria-hidden className="size-4" />
                依題目
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="-mt-2 flex flex-wrap items-center justify-between gap-2">
            <p role="status" className="m-0 text-xs text-muted-foreground">
              {total
                ? view === 'company'
                  ? `${byCompany.length} 家公司，共 ${total} 題`
                  : `${byTopic.length} 個分類，共 ${total} 題`
                : '沒有符合的問題'}
            </p>
            <Button type="button" variant="ghost" size="sm" aria-pressed={showAnswers} onClick={() => setShowAnswers((v) => !v)}>
              {showAnswers ? <EyeOff aria-hidden /> : <Eye aria-hidden />}
              {showAnswers ? '收合全部回答' : '展開全部回答'}
            </Button>
          </div>

          {view === 'company' ? <ByCompany groups={byCompany} showAnswers={showAnswers} /> : <ByTopic groups={byTopic} showAnswers={showAnswers} />}
        </>
      )}

      {managing ? <CategoryManager apps={apps} saveMany={saveMany} onClose={() => setManaging(false)} /> : null}
    </main>
  );
}
