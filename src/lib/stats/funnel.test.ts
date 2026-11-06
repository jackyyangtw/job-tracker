import { describe, expect, it } from 'vitest';
import { makeApp } from '../testUtils';
import { funnel } from './funnel';

describe('funnel', () => {
  it('計算各階段人數與轉換率', () => {
    const apps = [
      makeApp(),
      makeApp(),
      makeApp({ status: 'rejected' }),
      makeApp({ status: 'interview' }),
      makeApp({ status: 'rejected', interviewAt: '2026-10-01T10:00' }),
      makeApp({ status: 'offer' }),
      makeApp({ status: 'wishlist' }),
    ];
    expect(funnel(apps)).toEqual([
      { label: '已投遞', n: 6, ofSent: 100, ofPrev: null },
      { label: '面試', n: 3, ofSent: 50, ofPrev: 50 },
      { label: 'Offer', n: 1, ofSent: 17, ofPrev: 33 },
    ]);
  });

  it('沒有投遞時百分比是 null', () => {
    expect(funnel([]).map((s) => [s.ofSent, s.ofPrev])).toEqual([
      [null, null],
      [null, null],
      [null, null],
    ]);
  });
});
