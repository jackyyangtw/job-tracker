import { describe, expect, it } from 'vitest';
import { makeApp } from '../testUtils';
import { findDuplicate, normalizeJobUrl } from './duplicate';

describe('normalizeJobUrl', () => {
  it('104：去掉追蹤參數、# 片段，不分 www／m 子網域', () => {
    const a = normalizeJobUrl('https://www.104.com.tw/job/8wgp3?jobsource=ios_share');
    expect(a).toBe('104.com.tw/job/8wgp3');
    expect(normalizeJobUrl('https://m.104.com.tw/job/8wgp3#apply')).toBe(a);
    expect(normalizeJobUrl('  https://www.104.com.tw/job/8WGP3/  ')).toBe(a);
  });

  it('Cake：舊網域、結尾斜線與查詢參數都視為同一個職缺', () => {
    const a = normalizeJobUrl('https://www.cake.me/companies/acme/jobs/frontend');
    expect(a).toBe('cake.me/companies/acme/jobs/frontend');
    expect(normalizeJobUrl('https://cakeresume.com/companies/acme/jobs/frontend/?ref=share')).toBe(a);
    expect(normalizeJobUrl('https://www.cake.me/companies/ACME/jobs/Frontend')).toBe(a);
  });

  it('其他網站：去掉追蹤參數，保留其他參數且不受順序影響', () => {
    expect(normalizeJobUrl('https://www.linkedin.com/jobs/view/123/?trackingId=abc&refId=x&utm_source=y')).toBe('linkedin.com/jobs/view/123');
    expect(normalizeJobUrl('https://example.com/jobs?b=2&a=1&utm_medium=x')).toBe(normalizeJobUrl('http://example.com/jobs/?a=1&b=2'));
    expect(normalizeJobUrl('https://example.com/jobs?id=1')).not.toBe(normalizeJobUrl('https://example.com/jobs?id=2'));
  });

  it('不是完整網址時只去空白、小寫與結尾斜線；空白回傳空字串', () => {
    expect(normalizeJobUrl(' Example.com/Job/ ')).toBe('example.com/job');
    expect(normalizeJobUrl('   ')).toBe('');
  });
});

describe('findDuplicate', () => {
  const existing = makeApp({ id: 'old', company: '好公司', title: '前端工程師', url: 'https://www.104.com.tw/job/8wgp3' });

  it('職缺連結整理後相同就算重複', () => {
    const app = makeApp({ id: 'new', company: '別的名字', url: 'https://m.104.com.tw/job/8wgp3?jobsource=ios_share' });
    expect(findDuplicate(app, [existing])).toBe(existing);
  });

  it('兩筆都有連結但不同時，公司職位相同也不算重複', () => {
    const app = makeApp({ id: 'new', company: '好公司', title: '前端工程師', url: 'https://www.104.com.tw/job/other' });
    expect(findDuplicate(app, [existing])).toBeNull();
  });

  it('沒有連結時比對公司加職位（去頭尾空白、不分大小寫）', () => {
    const old = makeApp({ id: 'old', company: 'Acme Inc', title: 'Frontend Engineer' });
    expect(findDuplicate(makeApp({ id: 'new', company: '  acme inc ', title: 'FRONTEND engineer ' }), [old])).toBe(old);
    expect(findDuplicate(makeApp({ id: 'new', company: 'Acme Inc', title: 'Backend Engineer' }), [old])).toBeNull();
    // 只有一邊有連結時也用公司加職位比對
    expect(findDuplicate(makeApp({ id: 'new', company: '好公司', title: '前端工程師' }), [existing])).toBe(existing);
  });

  it('排除範例資料與同一筆投遞', () => {
    const sample = makeApp({ id: 'sample', company: '好公司', title: '前端工程師', sample: true });
    expect(findDuplicate(makeApp({ id: 'new', company: '好公司', title: '前端工程師' }), [sample])).toBeNull();
    expect(findDuplicate({ ...existing }, [existing])).toBeNull();
  });

  it('公司空白時不比對；有多筆符合時回傳第一筆', () => {
    expect(findDuplicate(makeApp({ id: 'new', company: ' ' }), [makeApp({ id: 'old', company: '' })])).toBeNull();
    const first = makeApp({ id: 'a', company: 'X' });
    expect(findDuplicate(makeApp({ id: 'new', company: 'x' }), [first, makeApp({ id: 'b', company: 'X' })])).toBe(first);
  });
});
