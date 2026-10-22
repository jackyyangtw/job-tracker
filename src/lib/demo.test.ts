import { describe, expect, it } from 'vitest';
import { demoApps } from './demo';
import { dstr } from './dates';
import { flagsOf } from './flags';
import { STATUS_LIST } from './types';

const today = new Date(2026, 9, 22);
const apps = demoApps(today);

describe('試用模式範例資料', () => {
  it('涵蓋所有投遞狀態', () => {
    const statuses = new Set(apps.map((a) => a.status));
    for (const { key } of STATUS_LIST) expect(statuses).toContain(key);
  });

  it('每筆資料的 id 都不重複', () => {
    expect(new Set(apps.map((a) => a.id)).size).toBe(apps.length);
  });

  it('不標記為範例資料，訪客可以編輯', () => {
    expect(apps.every((a) => !a.sample)).toBe(true);
  });

  it('同時出現「沒消息」與「該跟進」兩種提醒', () => {
    const kinds = new Set(apps.flatMap((a) => flagsOf(a, 14, dstr(today)).map((f) => f.kind)));
    expect(kinds).toEqual(new Set(['stale', 'due']));
  });

  it('日期以傳入的今天為基準計算', () => {
    const due = apps.find((a) => a.id === 'demo-2');
    expect(due?.followUpAt).toBe('2026-10-22');
  });
});
