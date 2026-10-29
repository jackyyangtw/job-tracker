import { describe, expect, it } from 'vitest';
import { parseClipboardPrefill, parsePrefill } from './prefill';

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

  it('從 104 職缺 JSON 的 header（h104）取出公司與職稱', () => {
    const h104 = JSON.stringify({ jobName: ' 前端工程師 ', custName: '測試公司', appearDate: '2026/10/21' });
    const r = parsePrefill(`?new=1&h104=${encodeURIComponent(h104)}&url=https://www.104.com.tw/job/8wgp3?jobsource=ios_share`);
    expect(r).toEqual({ company: '測試公司', title: '前端工程師', url: 'https://www.104.com.tw/job/8wgp3', source: '104' });
  });

  it('company／title 優先於 h104', () => {
    const h104 = JSON.stringify({ jobName: '104 職稱', custName: '104 公司' });
    const r = parsePrefill(qs({ new: '1', company: '手動公司', h104 }));
    expect(r).toMatchObject({ company: '手動公司', title: '104 職稱' });
  });

  it('h104 格式不對或太長時忽略', () => {
    expect(parsePrefill(qs({ new: '1', h104: '{壞掉' }))).toMatchObject({ company: '', title: '' });
    expect(parsePrefill(qs({ new: '1', h104: 'null' }))).toMatchObject({ company: '', title: '' });
    expect(parsePrefill(qs({ new: '1', h104: JSON.stringify({ custName: 123, jobName: ['x'] }) }))).toMatchObject({ company: '', title: '' });
    const long = JSON.stringify({ custName: '測試公司', pad: 'x'.repeat(20_000) });
    expect(parsePrefill(qs({ new: '1', h104: long }))?.company).toBe('');
  });

  it('連結參數是整段分享訊息時只留下網址', () => {
    const r = parsePrefill(qs({ new: '1', url: '分享給你 https://www.cake.me/companies/x/jobs/y' }));
    expect(r).toMatchObject({ url: 'https://www.cake.me/companies/x/jobs/y', source: 'Cake' });
  });
});

describe('parseClipboardPrefill', () => {
  it('剪貼簿是捷徑拷貝的預填網址時照網址參數解析（不管網域）', () => {
    const h104 = encodeURIComponent(JSON.stringify({ jobName: '前端工程師', custName: '測試公司' }));
    const clip = `https://example.com/applications?new=1&h104=${h104}&url=https://www.104.com.tw/job/8wgp3?jobsource=ios_share\n`;
    expect(parseClipboardPrefill(clip)).toEqual({ company: '測試公司', title: '前端工程師', url: 'https://www.104.com.tw/job/8wgp3', source: '104' });
  });

  it('捷徑網域還是中文佔位字時也照預填網址解析', () => {
    const h104 = encodeURIComponent(JSON.stringify({ jobName: '前端工程師', custName: '測試公司' }));
    const clip = `https://你的網域/applications?new=1&h104=${h104}&url=https://www.104.com.tw/job/8wgp3?jobsource=ios_share`;
    expect(parseClipboardPrefill(clip)).toEqual({ company: '測試公司', title: '前端工程師', url: 'https://www.104.com.tw/job/8wgp3', source: '104' });
  });

  it('捷徑用 googlechromes:// 開頭時也照預填網址解析', () => {
    const h104 = encodeURIComponent(JSON.stringify({ jobName: '前端工程師', custName: '測試公司' }));
    const clip = `googlechromes://example.com/applications?new=1&h104=${h104}&url=https://www.104.com.tw/job/8wgp3`;
    expect(parseClipboardPrefill(clip)).toMatchObject({ company: '測試公司', title: '前端工程師', source: '104' });
  });

  it('剪貼簿是一般職缺連結或分享訊息時只帶入連結', () => {
    expect(parseClipboardPrefill('我在104工作快找上發現了一個超適合你的內容\nhttps://www.104.com.tw/job/8wgp3?jobsource=ios_share')).toEqual({
      company: '',
      title: '',
      url: 'https://www.104.com.tw/job/8wgp3',
      source: '104',
    });
    expect(parseClipboardPrefill('https://www.cake.me/companies/x/jobs/y')).toMatchObject({ url: 'https://www.cake.me/companies/x/jobs/y', source: 'Cake' });
  });

  it('沒有 http(s) 連結時回傳 null', () => {
    expect(parseClipboardPrefill('')).toBeNull();
    expect(parseClipboardPrefill('只有文字')).toBeNull();
    expect(parseClipboardPrefill('www.104.com.tw/job/abc')).toBeNull();
    expect(parseClipboardPrefill('javascript:alert(1)')).toBeNull();
  });
});
