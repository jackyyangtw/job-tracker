import { describe, expect, it } from 'vitest';
import { flagsOf, silenceDays } from './flags';
import { makeApp } from './testUtils';

const TODAY = '2026-10-21';
const kinds = (app: ReturnType<typeof makeApp>, staleDays = 14) => flagsOf(app, staleDays, TODAY).map((f) => f.kind);

describe('flagsOf：N 天沒消息', () => {
  it('剛好第 N 天就提醒，第 N-1 天還不提醒', () => {
    expect(kinds(makeApp({ appliedAt: '2026-10-07' }))).toEqual(['stale']); // 14 天
    expect(kinds(makeApp({ appliedAt: '2026-10-08' }))).toEqual([]); // 13 天
  });

  it('提示文字包含天數', () => {
    expect(flagsOf(makeApp({ appliedAt: '2026-10-04' }), 14, TODAY)[0].text).toBe('17 天沒消息');
  });

  it('有最後跟進日時，從最後跟進日起算', () => {
    expect(kinds(makeApp({ appliedAt: '2026-09-01', lastContact: '2026-10-15' }))).toEqual([]);
  });

  it('依設定的天數判斷', () => {
    const app = makeApp({ appliedAt: '2026-10-14' }); // 7 天
    expect(kinds(app, 7)).toEqual(['stale']);
    expect(kinds(app, 10)).toEqual([]);
  });

  it('只有「已投遞」會提醒沒消息', () => {
    for (const status of ['wishlist', 'interview', 'offer', 'rejected', 'withdrawn'] as const) {
      expect(kinds(makeApp({ status, appliedAt: '2026-01-01' }))).not.toContain('stale');
    }
  });

  it('沒有任何日期就不提醒', () => {
    expect(kinds(makeApp())).toEqual([]);
  });
});

describe('flagsOf：跟進日', () => {
  it('跟進日是今天', () => {
    const flags = flagsOf(makeApp({ followUpAt: TODAY }), 14, TODAY);
    expect(flags).toEqual([{ kind: 'due', text: '今天要跟進' }]);
  });

  it('跟進日已過', () => {
    expect(flagsOf(makeApp({ followUpAt: '2026-10-20' }), 14, TODAY)[0].text).toBe('跟進已逾期');
  });

  it('跟進日還沒到就不提醒', () => {
    expect(kinds(makeApp({ followUpAt: '2026-10-22' }))).toEqual([]);
  });

  it('面試中也會提醒跟進，已結束的狀態不會', () => {
    expect(kinds(makeApp({ status: 'interview', followUpAt: TODAY }))).toEqual(['due']);
    for (const status of ['wishlist', 'offer', 'rejected', 'withdrawn'] as const) {
      expect(kinds(makeApp({ status, followUpAt: TODAY }))).toEqual([]);
    }
  });

  it('沒消息與跟進可以同時出現', () => {
    expect(kinds(makeApp({ appliedAt: '2026-09-01', followUpAt: '2026-10-01' }))).toEqual(['stale', 'due']);
  });
});

describe('silenceDays', () => {
  it('優先用最後跟進日，否則用投遞日，都沒有就是 0', () => {
    expect(silenceDays(makeApp({ appliedAt: '2026-10-01', lastContact: '2026-10-11' }), TODAY)).toBe(10);
    expect(silenceDays(makeApp({ appliedAt: '2026-10-01' }), TODAY)).toBe(20);
    expect(silenceDays(makeApp(), TODAY)).toBe(0);
  });
});
