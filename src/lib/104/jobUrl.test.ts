import { describe, expect, it } from 'vitest';
import { clean104JobUrl, is104Host } from './jobUrl';

describe('clean104JobUrl', () => {
  it('移除 104 職缺連結的追蹤參數與 # 片段', () => {
    expect(clean104JobUrl('https://www.104.com.tw/job/8wgp3?jobsource=ios_share')).toBe('https://www.104.com.tw/job/8wgp3');
    expect(clean104JobUrl('https://m.104.com.tw/job/8wgp3#apply')).toBe('https://m.104.com.tw/job/8wgp3');
  });

  it('104 的其他頁面與其他網站原樣回傳', () => {
    expect(clean104JobUrl('https://www.104.com.tw/company/abc?x=1')).toBe('https://www.104.com.tw/company/abc?x=1');
    expect(clean104JobUrl('https://www.cake.me/companies/a/jobs/b?ref=x')).toBe('https://www.cake.me/companies/a/jobs/b?ref=x');
    expect(clean104JobUrl('https://evil104.com.tw/job/abc?x=1')).toBe('https://evil104.com.tw/job/abc?x=1');
  });

  it('不是完整網址時原樣回傳', () => {
    expect(clean104JobUrl('www.104.com.tw/job/abc?x=1')).toBe('www.104.com.tw/job/abc?x=1');
  });
});

describe('is104Host', () => {
  it('104.com.tw 與其子網域才算', () => {
    expect(is104Host('www.104.com.tw')).toBe(true);
    expect(is104Host('m.104.com.tw')).toBe(true);
    expect(is104Host('104.com.tw')).toBe(true);
    expect(is104Host('evil104.com.tw')).toBe(false);
    expect(is104Host('www.104.com.tw.evil.example')).toBe(false);
  });
});
