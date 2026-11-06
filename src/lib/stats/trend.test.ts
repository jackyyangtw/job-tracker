import { describe, expect, it } from 'vitest';
import { makeApp } from '../testUtils';
import { trend } from './trend';

describe('trend', () => {
  // 2026-11-06 是週五，該週週一是 11/02。
  const today = '2026-11-06';

  it('週：列出最近 N 週（週一開始），沒有投遞的週也是 0', () => {
    const apps = [
      makeApp({ appliedAt: '2026-11-02' }),
      makeApp({ appliedAt: '2026-11-06' }),
      makeApp({ appliedAt: '2026-11-01' }), // 週日，屬於上一週
      makeApp({ appliedAt: '2026-10-01' }), // 超出範圍
    ];
    expect(trend(apps, 'week', today, 3).buckets).toEqual([
      { key: '2026-10-19', label: '10/19', n: 0 },
      { key: '2026-10-26', label: '10/26', n: 1 },
      { key: '2026-11-02', label: '11/02', n: 2 },
    ]);
  });

  it('月：跨年也正確', () => {
    const apps = [makeApp({ appliedAt: '2025-12-31' }), makeApp({ appliedAt: '2026-01-15' }), makeApp({ appliedAt: '2026-01-02' })];
    expect(trend(apps, 'month', '2026-01-20', 3).buckets).toEqual([
      { key: '2025-11', label: '11 月', n: 0 },
      { key: '2025-12', label: '12 月', n: 1 },
      { key: '2026-01', label: '1 月', n: 2 },
    ]);
  });

  it('「想投」不算；沒填投遞日的另外計數', () => {
    const apps = [makeApp({ status: 'wishlist', appliedAt: today }), makeApp({ appliedAt: '' }), makeApp({ status: 'offer', appliedAt: '' })];
    const r = trend(apps, 'week', today, 1);
    expect(r.buckets[0].n).toBe(0);
    expect(r.undated).toBe(2);
  });
});
