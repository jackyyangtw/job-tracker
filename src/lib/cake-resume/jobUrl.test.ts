import { describe, expect, it } from 'vitest';
import { cakeJobPageUrl, isCakeHost, parseCakeJobUrl } from './jobUrl';

const JOB_URL = 'https://www.cake.me/companies/example-co/jobs/123456-frontend-engineer-abc123';

describe('parseCakeJobUrl', () => {
  it('取出公司與職缺代碼', () => {
    expect(parseCakeJobUrl(JOB_URL)).toEqual({ company: 'example-co', job: '123456-frontend-engineer-abc123' });
  });

  it('接受沒有 www、舊網域 cakeresume.com，以及查詢參數與結尾斜線', () => {
    expect(parseCakeJobUrl('https://cake.me/companies/a/jobs/b')).toEqual({ company: 'a', job: 'b' });
    expect(parseCakeJobUrl('https://www.cakeresume.com/companies/a/jobs/b/?ref=x#top')).toEqual({ company: 'a', job: 'b' });
  });

  it('其他網站、其他路徑或可疑的路徑片段回傳 null', () => {
    expect(parseCakeJobUrl('https://www.104.com.tw/job/8wgp3')).toBeNull();
    expect(parseCakeJobUrl('https://www.cake.me/companies/a')).toBeNull();
    expect(parseCakeJobUrl('https://www.cake.me/companies/a/jobs/b/extra')).toBeNull();
    expect(parseCakeJobUrl('https://evil.example/?u=https://www.cake.me/companies/a/jobs/b')).toBeNull();
    expect(parseCakeJobUrl('https://www.cake.me.evil.example/companies/a/jobs/b')).toBeNull();
    expect(parseCakeJobUrl('https://www.cake.me/companies/.x/jobs/b')).toBeNull();
    expect(parseCakeJobUrl('ftp://www.cake.me/companies/a/jobs/b')).toBeNull();
    expect(parseCakeJobUrl('不是網址')).toBeNull();
  });

  it('查詢網址一律組成 https://www.cake.me', () => {
    expect(cakeJobPageUrl({ company: 'a', job: 'b' })).toBe('https://www.cake.me/companies/a/jobs/b');
  });
});

describe('isCakeHost', () => {
  it('cake.me、cakeresume.com 與其子網域才算', () => {
    expect(isCakeHost('www.cake.me')).toBe(true);
    expect(isCakeHost('cake.me')).toBe(true);
    expect(isCakeHost('www.cakeresume.com')).toBe(true);
    expect(isCakeHost('evilcake.me')).toBe(false);
    expect(isCakeHost('www.cake.me.evil.example')).toBe(false);
  });
});
