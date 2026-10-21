import { describe, expect, it } from 'vitest';
import { groupTally, overall } from './stats';
import { makeApp } from './testUtils';

describe('overall', () => {
  it('「想投」不算已投遞；面試、Offer、未錄取算有回應，已撤回不算', () => {
    const apps = [
      makeApp({ status: 'wishlist' }),
      makeApp({ status: 'applied' }),
      makeApp({ status: 'interview' }),
      makeApp({ status: 'offer' }),
      makeApp({ status: 'rejected' }),
      makeApp({ status: 'withdrawn' }),
    ];
    expect(overall(apps)).toEqual({ n: 5, replied: 3, pct: 60 });
  });

  it('回應率四捨五入到整數', () => {
    const apps = [makeApp({ status: 'interview' }), makeApp(), makeApp()];
    expect(overall(apps).pct).toBe(33);
  });

  it('還沒有投遞時回應率是 null', () => {
    expect(overall([])).toEqual({ n: 0, replied: 0, pct: null });
    expect(overall([makeApp({ status: 'wishlist' })]).pct).toBeNull();
  });
});

describe('groupTally', () => {
  it('依指定欄位分組，空值用替代標籤，並排除「想投」', () => {
    const apps = [
      makeApp({ source: '104', status: 'interview' }),
      makeApp({ source: '104' }),
      makeApp({ source: 'Cake', status: 'rejected' }),
      makeApp({ source: '' }),
      makeApp({ source: '104', status: 'wishlist' }),
    ];
    // 筆數相同時依繁體中文排序規則：中文排在英文前面。
    expect(groupTally(apps, (a) => a.source, '未填來源')).toEqual([
      { name: '104', n: 2, replied: 1, pct: 50 },
      { name: '未填來源', n: 1, replied: 0, pct: 0 },
      { name: 'Cake', n: 1, replied: 1, pct: 100 },
    ]);
  });

  it('筆數多的排前面，筆數相同依名稱排序', () => {
    const apps = [makeApp({ resume: 'v2' }), makeApp({ resume: 'v1' }), makeApp({ resume: 'v2' })];
    expect(groupTally(apps, (a) => a.resume, '未填').map((r) => r.name)).toEqual(['v2', 'v1']);
    const tie = [makeApp({ resume: 'v2' }), makeApp({ resume: 'v1' })];
    expect(groupTally(tie, (a) => a.resume, '未填').map((r) => r.name)).toEqual(['v1', 'v2']);
  });
});
