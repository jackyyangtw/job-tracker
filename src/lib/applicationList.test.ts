import { describe, expect, it } from 'vitest';
import { mergeApplication, monthOf, monthsOf } from './applicationList';
import { makeApp } from './testUtils';

describe('monthOf', () => {
  it('有投遞日就用投遞日的月份', () => {
    expect(monthOf(makeApp({ appliedAt: '2026-08-31', createdAt: '2026-10-01T00:00:00Z' }))).toBe('2026-08');
  });

  it('沒有投遞日時改用建立日', () => {
    expect(monthOf(makeApp({ appliedAt: '', createdAt: '2026-10-05T04:00:00Z' }))).toBe('2026-10');
  });

  it('台灣時間月初凌晨建立的資料，不能被算到上個月', () => {
    // UTC 9/30 17:30 = 台灣 10/1 01:30
    expect(monthOf(makeApp({ appliedAt: '', createdAt: '2026-09-30T17:30:00Z' }))).toBe('2026-10');
  });

  it('兩個日期都沒有時回傳空字串', () => {
    expect(monthOf(makeApp({ appliedAt: '', createdAt: '' }))).toBe('');
  });
});

describe('monthsOf', () => {
  it('列出不重複的月份，新的在前，忽略沒有月份的資料', () => {
    const apps = [
      makeApp({ appliedAt: '2026-08-10' }),
      makeApp({ appliedAt: '2026-10-01' }),
      makeApp({ appliedAt: '2026-10-20' }),
      makeApp({ appliedAt: '2025-12-31' }),
      makeApp({ appliedAt: '', createdAt: '' }),
    ];
    expect(monthsOf(apps)).toEqual(['2026-10', '2026-08', '2025-12']);
  });

  it('沒有資料時是空陣列', () => {
    expect(monthsOf([])).toEqual([]);
  });
});

describe('mergeApplication', () => {
  const a = makeApp({ id: 'a', updatedAt: '2026-10-01T00:00:00Z' });
  const b = makeApp({ id: 'b', updatedAt: '2026-10-03T00:00:00Z' });

  it('新增的資料依更新時間排序', () => {
    const c = makeApp({ id: 'c', updatedAt: '2026-10-02T00:00:00Z' });
    expect(mergeApplication([b, a], c).map((x) => x.id)).toEqual(['b', 'c', 'a']);
  });

  it('同一個 id 會被取代而不是重複', () => {
    const updated = { ...a, company: '新名稱', updatedAt: '2026-10-05T00:00:00Z' };
    const list = mergeApplication([b, a], updated);
    expect(list.map((x) => x.id)).toEqual(['a', 'b']);
    expect(list[0].company).toBe('新名稱');
  });

  it('列表還沒載入時也能運作，且不修改原本的陣列', () => {
    expect(mergeApplication(undefined, a)).toEqual([a]);
    const original = [b];
    mergeApplication(original, a);
    expect(original).toEqual([b]);
  });
});
