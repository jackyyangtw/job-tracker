import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, dstr, isMonth, monthLabel, parseD, shortDate } from './dates';

describe('dstr', () => {
  it('用本地日期，不受 UTC 影響（台灣早上 7 點在 UTC 還是前一天）', () => {
    expect(dstr(new Date('2026-10-20T23:30:00Z'))).toBe('2026-10-21');
  });

  it('月、日補零', () => {
    expect(dstr(new Date(2026, 0, 5))).toBe('2026-01-05');
  });
});

describe('daysBetween', () => {
  it('計算相隔天數', () => {
    expect(daysBetween('2026-10-21', '2026-10-07')).toBe(14);
    expect(daysBetween('2026-10-21', '2026-10-21')).toBe(0);
  });

  it('跨月、跨年、閏年', () => {
    expect(daysBetween('2026-11-01', '2026-10-31')).toBe(1);
    expect(daysBetween('2027-01-01', '2026-12-31')).toBe(1);
    expect(daysBetween('2028-03-01', '2028-02-28')).toBe(2);
  });

  it('順序相反時是負數', () => {
    expect(daysBetween('2026-10-01', '2026-10-05')).toBe(-4);
  });
});

describe('addDays', () => {
  it('從指定日期加減天數，可跨月跨年', () => {
    expect(addDays(7, parseD('2026-10-28'))).toBe('2026-11-04');
    expect(addDays(1, parseD('2026-12-31'))).toBe('2027-01-01');
    expect(addDays(-1, parseD('2026-03-01'))).toBe('2026-02-28');
  });

  it('不會修改傳入的日期', () => {
    const from = parseD('2026-10-20');
    addDays(5, from);
    expect(dstr(from)).toBe('2026-10-20');
  });
});

describe('shortDate', () => {
  it('轉成 月/日', () => {
    expect(shortDate('2026-10-20')).toBe('10/20');
    expect(shortDate('')).toBe('');
  });
});

describe('isMonth / monthLabel', () => {
  it('只接受 YYYY-MM', () => {
    expect(isMonth('2026-10')).toBe(true);
    expect(isMonth('2026-1')).toBe(false);
    expect(isMonth('2026-10-01')).toBe(false);
    expect(isMonth('')).toBe(false);
  });

  it('顯示成中文月份，不補零', () => {
    expect(monthLabel('2026-10')).toBe('2026 年 10 月');
    expect(monthLabel('2026-03')).toBe('2026 年 3 月');
  });
});
