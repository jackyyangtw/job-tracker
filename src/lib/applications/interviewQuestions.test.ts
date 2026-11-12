import { describe, expect, it } from 'vitest';
import { makeApp } from '../testUtils';
import {
  categoryOptions,
  categoryUsage,
  cleanCategory,
  DEFAULT_CATEGORIES,
  MAX_QUESTIONS,
  normalizeQuestions,
  questionGroups,
  questionsToText,
  renameCategory,
  topicGroups,
  UNCATEGORIZED,
} from './interviewQuestions';

const qa = (question: string, answer = '', category = '') => ({ question, answer, category });

describe('normalizeQuestions', () => {
  it('去掉前後空白，略過問題與回答都空白的項目', () => {
    expect(normalizeQuestions([qa(' 自我介紹 ', ' 簡短說明經歷 '), qa('  ', ' '), qa('', '只有回答')])).toEqual([
      qa('自我介紹', '簡短說明經歷'),
      qa('', '只有回答'),
    ]);
  });

  it('不是陣列或項目格式錯誤時略過', () => {
    expect(normalizeQuestions(null)).toEqual([]);
    expect(normalizeQuestions({ question: 'x' })).toEqual([]);
    expect(normalizeQuestions([null, 1, 'x', { question: 5, answer: ['a'] }, { question: '有效' }])).toEqual([qa('有效')]);
  });

  it('沒有分類欄位的舊資料是未分類；分類會清理空白並限制長度', () => {
    expect(normalizeQuestions([{ question: 'A', answer: '' }])).toEqual([qa('A')]);
    expect(normalizeQuestions([{ question: 'A', category: '  前端   效能 ' }])[0].category).toBe('前端 效能');
    expect(normalizeQuestions([{ question: 'A', category: 'x'.repeat(50) }])[0].category).toHaveLength(20);
    expect(normalizeQuestions([{ question: 'A', category: 123 }])[0].category).toBe('');
  });

  it('舊格式的純文字：一行一題', () => {
    expect(normalizeQuestions('自我介紹\r\n\n期望薪資')).toEqual([qa('自我介紹'), qa('期望薪資')]);
  });

  it('限制題數與字數', () => {
    const many = Array.from({ length: MAX_QUESTIONS + 5 }, (_, i) => qa(`Q${i}`));
    expect(normalizeQuestions(many)).toHaveLength(MAX_QUESTIONS);
    const [long] = normalizeQuestions([qa('x'.repeat(500), 'y'.repeat(3000))]);
    expect(long.question).toHaveLength(300);
    expect(long.answer).toHaveLength(2000);
  });
});

describe('cleanCategory', () => {
  it('非字串回傳空字串', () => {
    expect(cleanCategory(undefined)).toBe('');
    expect(cleanCategory(' 技術 ')).toBe('技術');
  });
});

const a = makeApp({
  id: 'a',
  company: '甲公司',
  title: '前端工程師',
  interviewAt: '2026-11-02T10:00',
  interviewQuestions: [qa('React hooks', '說明 useEffect 的執行時機', '技術'), qa('期望薪資', '', '薪資條件')],
});
const b = makeApp({
  id: 'b',
  company: '乙公司',
  appliedAt: '2026-11-05',
  interviewQuestions: [qa('自我介紹', '', '自我介紹'), qa('虛擬捲動', '', '前端效能'), qa('為什麼離職')],
});
const none = makeApp({ id: 'c', company: '丙公司' });

describe('categoryOptions / categoryUsage', () => {
  it('預設分類在前，自訂分類接在後面', () => {
    expect(categoryOptions([a, b])).toEqual([...DEFAULT_CATEGORIES, '前端效能']);
    expect(categoryOptions([])).toEqual([...DEFAULT_CATEGORIES]);
  });

  it('只列出有題目的分類與題數，未分類在最後', () => {
    expect(categoryUsage([a, b, none])).toEqual([
      { name: '自我介紹', count: 1 },
      { name: '技術', count: 1 },
      { name: '薪資條件', count: 1 },
      { name: '前端效能', count: 1 },
      { name: UNCATEGORIZED, count: 1 },
    ]);
  });
});

describe('renameCategory', () => {
  it('改名：只回傳有用到的投遞，其他題目不變', () => {
    const changed = renameCategory([a, b], '技術', ' 前端技術 ');
    expect(changed.map((x) => x.id)).toEqual(['a']);
    expect(changed[0].interviewQuestions).toEqual([qa('React hooks', '說明 useEffect 的執行時機', '前端技術'), qa('期望薪資', '', '薪資條件')]);
  });

  it('改成既有分類就是合併；改成空字串就是刪除分類', () => {
    expect(renameCategory([a, b], '前端效能', '技術')[0].interviewQuestions[1].category).toBe('技術');
    expect(renameCategory([a, b], '薪資條件', '')[0].interviewQuestions[1].category).toBe('');
  });

  it('名稱沒變或沒有用到時不回傳任何投遞', () => {
    expect(renameCategory([a, b], '技術', '技術')).toEqual([]);
    expect(renameCategory([a, b], '不存在', '新分類')).toEqual([]);
    expect(renameCategory([a, b], '', '新分類')).toEqual([]);
  });
});

describe('questionGroups', () => {
  it('只列出有問題的投遞，依面試時間或投遞日由新到舊', () => {
    expect(questionGroups([a, b, none]).map((g) => g.app.id)).toEqual(['b', 'a']);
  });

  it('搜尋只保留符合的問題，不分大小寫；回答也能搜尋', () => {
    expect(questionGroups([a, b], { query: 'react' })).toEqual([{ app: a, questions: [a.interviewQuestions[0]] }]);
    expect(questionGroups([a, b], { query: 'useeffect' })[0].questions).toEqual([a.interviewQuestions[0]]);
  });

  it('公司或職位符合時保留全部問題', () => {
    expect(questionGroups([a, b], { query: '甲公司' })[0].questions).toHaveLength(2);
    expect(questionGroups([a, b], { query: '前端工程師' })[0].questions).toHaveLength(2);
  });

  it('依分類篩選，未分類也能單獨篩選', () => {
    expect(questionGroups([a, b], { category: '技術' })).toEqual([{ app: a, questions: [a.interviewQuestions[0]] }]);
    expect(questionGroups([a, b], { category: UNCATEGORIZED })).toEqual([{ app: b, questions: [b.interviewQuestions[2]] }]);
  });

  it('沒有符合時回傳空陣列', () => {
    expect(questionGroups([a, b], { query: '不存在' })).toEqual([]);
  });
});

describe('topicGroups', () => {
  it('依分類分組，順序同 categoryUsage，每題帶出處', () => {
    const groups = topicGroups([a, b, none]);
    expect(groups.map((g) => g.category)).toEqual(['自我介紹', '技術', '薪資條件', '前端效能', UNCATEGORIZED]);
    expect(groups[1].items).toEqual([{ question: a.interviewQuestions[0], app: a }]);
  });

  it('套用搜尋與分類篩選', () => {
    expect(topicGroups([a, b], { query: '虛擬' }).map((g) => g.category)).toEqual(['前端效能']);
    expect(topicGroups([a, b], { category: '技術' }).map((g) => g.category)).toEqual(['技術']);
  });
});

describe('questionsToText', () => {
  it('編號列出問題，分類放在前面，有回答時接在下一行', () => {
    expect(questionsToText([qa('自我介紹', '三年前端經驗', '自我介紹'), qa('期望薪資')])).toBe(
      '1. [自我介紹] 自我介紹\n回答：三年前端經驗\n2. 期望薪資',
    );
  });
});
