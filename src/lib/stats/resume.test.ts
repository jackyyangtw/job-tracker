import { describe, expect, it } from 'vitest';
import { makeApp } from '../testUtils';
import { compareVersions, leadingVersion, sampleLevel } from './resume';

describe('sampleLevel', () => {
  it('少於 5 筆是極少、少於 10 筆是偏少', () => {
    expect([1, 4, 5, 9, 10].map(sampleLevel)).toEqual(['very-few', 'very-few', 'few', 'few', 'enough']);
  });
});

describe('compareVersions', () => {
  it('統計各版本的回應、面試與 Offer', () => {
    const apps = [
      makeApp({ resume: 'v1', status: 'interview' }),
      makeApp({ resume: 'v1', status: 'rejected' }),
      makeApp({ resume: 'v1' }),
      makeApp({ resume: 'v1', status: 'offer' }),
      makeApp({ resume: '', status: 'rejected', interviewAt: '2026-10-01T10:00' }),
      makeApp({ resume: 'v1', status: 'wishlist' }),
    ];
    expect(compareVersions(apps, (a) => a.resume, '未填版本')).toEqual([
      { name: 'v1', n: 4, replied: 3, pct: 75, interviewed: 2, interviewPct: 50, offer: 1 },
      { name: '未填版本', n: 1, replied: 1, pct: 100, interviewed: 1, interviewPct: 100, offer: 0 },
    ]);
  });
});

describe('leadingVersion', () => {
  const row = (name: string, n: number, interviewed: number) => ({ name, n, replied: interviewed, pct: 0, interviewed, interviewPct: Math.round((interviewed / n) * 100), offer: 0 });

  it('樣本極少與未填版本不參加，選面試邀約率最高的', () => {
    const rows = [row('v2', 5, 3), row('v1', 6, 1), row('v3', 1, 1), row('未填', 8, 8)];
    expect(leadingVersion(rows, '未填')?.name).toBe('v2');
  });

  it('邀約率相同時取投遞數多的', () => {
    expect(leadingVersion([row('a', 5, 1), row('b', 10, 2)], '未填')?.name).toBe('b');
  });

  it('只有一個版本、都沒有面試、或都是樣本極少時不選', () => {
    expect(leadingVersion([row('v1', 10, 5)], '未填')).toBeNull();
    expect(leadingVersion([row('v1', 10, 0), row('v2', 10, 0)], '未填')).toBeNull();
    expect(leadingVersion([row('v1', 3, 2), row('v2', 2, 1)], '未填')).toBeNull();
  });
});
