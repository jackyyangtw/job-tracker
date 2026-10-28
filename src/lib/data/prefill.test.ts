import { describe, expect, it } from 'vitest';
import { parsePrefill } from './prefill';

const qs = (params: Record<string, string>) => `?${new URLSearchParams(params)}`;

describe('parsePrefill', () => {
  it('沒有 new 參數時不開表單', () => {
    expect(parsePrefill('')).toBeNull();
    expect(parsePrefill(qs({ company: '測試公司', url: 'https://www.104.com.tw/job/8wgp3' }))).toBeNull();
  });

  it('只有 new 時開空白表單', () => {
    expect(parsePrefill('?new=1')).toEqual({ company: '', title: '', url: '', source: '' });
  });

  it('帶入公司、職稱與連結，並由連結判斷來源', () => {
    const r = parsePrefill(qs({ new: '1', company: '測試公司', title: '前端工程師', url: 'https://www.104.com.tw/job/8wgp3?jobsource=ios_share' }));
    expect(r).toEqual({ company: '測試公司', title: '前端工程師', url: 'https://www.104.com.tw/job/8wgp3', source: '104' });
  });

  it('去除前後空白並把換行合併成一個空格', () => {
    const r = parsePrefill(qs({ new: '1', company: '  測試\n公司  ', title: '\t前端  工程師 ' }));
    expect(r?.company).toBe('測試 公司');
    expect(r?.title).toBe('前端 工程師');
  });

  it('超過表單長度上限時截斷', () => {
    const r = parsePrefill(qs({ new: '1', company: 'a'.repeat(200), title: 'b'.repeat(200) }));
    expect(r?.company).toHaveLength(120);
    expect(r?.title).toHaveLength(160);
  });

  it('非 http(s) 連結一律丟掉', () => {
    expect(parsePrefill(qs({ new: '1', url: 'javascript:alert(1)' }))?.url).toBe('');
    expect(parsePrefill(qs({ new: '1', url: 'data:text/html,hi' }))?.url).toBe('');
  });

  it('連結參數是整段分享訊息時只留下網址', () => {
    const r = parsePrefill(qs({ new: '1', url: '分享給你 https://www.cake.me/companies/x/jobs/y' }));
    expect(r).toMatchObject({ url: 'https://www.cake.me/companies/x/jobs/y', source: 'Cake' });
  });
});
