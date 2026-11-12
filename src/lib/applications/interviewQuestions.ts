import type { Application, InterviewQuestion } from '../types';

export const MAX_QUESTIONS = 50;
export const QUESTION_MAX_LENGTH = 300;
export const ANSWER_MAX_LENGTH = 2000;
export const CATEGORY_MAX_LENGTH = 20;

/** 預設的分類；也可以輸入自訂分類。分類存在每一題裡，不另外建表。 */
export const DEFAULT_CATEGORIES = ['自我介紹', '技術', '專案經驗', '行為情境', '公司與職務', '薪資條件'] as const;

/** 篩選與分組時代表「沒有分類」的名稱。 */
export const UNCATEGORIZED = '未分類';

const text = (v: unknown, n: number) => (typeof v === 'string' ? v.slice(0, n) : '');

/** 分類名稱：去掉前後空白、合併連續空白、限制長度。 */
export const cleanCategory = (v: unknown) => text(v, 200).replace(/\s+/g, ' ').trim().slice(0, CATEGORY_MAX_LENGTH);

/**
 * 驗證並清理面試問題（資料庫、Realtime、離線快取、匯入檔都會經過這裡）。
 * 問題與回答都空白的項目會略過；舊格式的純文字（一行一題）也接受，每行轉成一題。
 */
export function normalizeQuestions(raw: unknown): InterviewQuestion[] {
  const items: unknown[] =
    typeof raw === 'string' ? raw.split(/\r?\n/).map((question) => ({ question })) : Array.isArray(raw) ? raw : [];
  const list: InterviewQuestion[] = [];
  for (const item of items) {
    if (list.length >= MAX_QUESTIONS) break;
    if (!item || typeof item !== 'object') continue;
    const r = item as Record<string, unknown>;
    const question = text(r.question, QUESTION_MAX_LENGTH).trim();
    const answer = text(r.answer, ANSWER_MAX_LENGTH).trim();
    if (question || answer) list.push({ question, answer, category: cleanCategory(r.category) });
  }
  return list;
}

/** 分類選單與輸入建議：預設分類在前（依預設順序），接著是自訂過的分類（依名稱排序）。 */
export function categoryOptions(apps: readonly Application[]): string[] {
  const custom = new Set<string>();
  for (const app of apps) for (const q of app.interviewQuestions) if (q.category) custom.add(q.category);
  for (const c of DEFAULT_CATEGORIES) custom.delete(c);
  return [...DEFAULT_CATEGORIES, ...[...custom].sort((a, b) => a.localeCompare(b, 'zh-Hant'))];
}

/** 每個分類用了幾題（只算有題目的分類，未分類用 UNCATEGORIZED），依 categoryOptions 的順序。 */
export function categoryUsage(apps: readonly Application[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const app of apps) {
    for (const q of app.interviewQuestions) {
      const name = q.category || UNCATEGORIZED;
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  const order = [...categoryOptions(apps), UNCATEGORIZED];
  return order.filter((name) => counts.has(name)).map((name) => ({ name, count: counts.get(name)! }));
}

/**
 * 把分類 `from` 改成 `to`，回傳有變動的投遞（給批次儲存用）。
 * `to` 是既有分類時就是合併；`to` 是 '' 時是刪除分類（題目變成未分類）。
 */
export function renameCategory(apps: readonly Application[], from: string, to: string): Application[] {
  const target = cleanCategory(to);
  if (!from || from === target) return [];
  const changed: Application[] = [];
  for (const app of apps) {
    if (!app.interviewQuestions.some((q) => q.category === from)) continue;
    changed.push({
      ...app,
      interviewQuestions: app.interviewQuestions.map((q) => (q.category === from ? { ...q, category: target } : q)),
    });
  }
  return changed;
}

export interface QuestionFilter {
  /** 不分大小寫，比對問題、回答、公司與職位。 */
  query?: string;
  /** 只看這個分類；UNCATEGORIZED 代表沒有分類；'' 代表全部。 */
  category?: string;
}

function matchesCategory(q: InterviewQuestion, category: string) {
  return !category || (category === UNCATEGORIZED ? !q.category : q.category === category);
}

/** 面試時間（沒有時用投遞日、更新時間），用來由新到舊排序。 */
const recency = (a: Application) => a.interviewAt || a.appliedAt || a.updatedAt;

export interface QuestionGroup {
  app: Application;
  questions: readonly InterviewQuestion[];
}

/**
 * 「依公司」檢視：有記錄面試問題的投遞，由新到舊排序。
 * 公司或職位符合搜尋時保留該投遞（分類篩選後）的所有問題。
 */
export function questionGroups(apps: readonly Application[], { query = '', category = '' }: QuestionFilter = {}): QuestionGroup[] {
  const q = query.trim().toLowerCase();
  const groups: QuestionGroup[] = [];
  for (const app of apps) {
    const inCategory = app.interviewQuestions.filter((x) => matchesCategory(x, category));
    if (!inCategory.length) continue;
    const appMatch = !q || `${app.company} ${app.title}`.toLowerCase().includes(q);
    const questions = appMatch ? inCategory : inCategory.filter((x) => `${x.question}\n${x.answer}`.toLowerCase().includes(q));
    if (questions.length) groups.push({ app, questions });
  }
  return groups.sort((x, y) => recency(y.app).localeCompare(recency(x.app)));
}

export interface TopicItem {
  question: InterviewQuestion;
  app: Application;
}

export interface TopicGroup {
  category: string;
  items: TopicItem[];
}

/**
 * 「依題目」檢視：所有題目依分類分組（順序同 categoryUsage，未分類在最後），
 * 分組內由新到舊。搜尋規則與 questionGroups 相同。
 */
export function topicGroups(apps: readonly Application[], filter: QuestionFilter = {}): TopicGroup[] {
  const byCategory = new Map<string, TopicItem[]>();
  for (const { app, questions } of questionGroups(apps, filter)) {
    for (const question of questions) {
      const name = question.category || UNCATEGORIZED;
      const list = byCategory.get(name) ?? [];
      list.push({ question, app });
      byCategory.set(name, list);
    }
  }
  return categoryUsage(apps)
    .filter(({ name }) => byCategory.has(name))
    .map(({ name }) => ({ category: name, items: byCategory.get(name)! }));
}

/** 匯出 CSV 用：每題一段，有分類時加在前面，有回答時接在問題下一行。 */
export function questionsToText(list: readonly InterviewQuestion[]): string {
  return list
    .map((x, i) => `${i + 1}. ${x.category ? `[${x.category}] ` : ''}${x.question}${x.answer ? `\n回答：${x.answer}` : ''}`)
    .join('\n');
}
