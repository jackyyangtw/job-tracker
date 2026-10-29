import { describe, expect, it } from 'vitest';
import { cakeJobPageUrl, parseCakeJobPage, parseCakeJobUrl } from './jobPreview';

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

const ldScript = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data)}</script>`;

describe('parseCakeJobPage', () => {
  it('從 JSON-LD 的 JobPosting 取出公司與職稱', () => {
    const html = `<html><head>${ldScript({ '@type': 'BreadcrumbList' })}${ldScript({
      '@type': 'JobPosting',
      title: ' 前端工程師 ',
      hiringOrganization: { '@type': 'Organization', name: '測試公司' },
    })}</head></html>`;
    expect(parseCakeJobPage(html)).toEqual({ company: '測試公司', title: '前端工程師' });
  });

  it('JobPosting 在陣列或 @graph 裡也找得到', () => {
    const job = { '@type': 'JobPosting', title: 'PM', hiringOrganization: { name: '測試公司' } };
    expect(parseCakeJobPage(ldScript([{ '@type': 'WebPage' }, job]))).toEqual({ company: '測試公司', title: 'PM' });
    expect(parseCakeJobPage(ldScript({ '@graph': [job] }))).toEqual({ company: '測試公司', title: 'PM' });
  });

  it('沒有 JSON-LD 時改用 og:title（職稱 - 公司 | Cake）', () => {
    const html = '<meta property="og:title" content="Frontend &amp; Design - Test Co - TW | Cake" />';
    expect(parseCakeJobPage(html)).toEqual({ company: 'TW', title: 'Frontend & Design - Test Co' });
    expect(parseCakeJobPage('<meta property="og:title" content="前端工程師 - 測試公司 | Cake">')).toEqual({ company: '測試公司', title: '前端工程師' });
  });

  it('格式不對時回傳 null', () => {
    expect(parseCakeJobPage('')).toBeNull();
    expect(parseCakeJobPage('<script type="application/ld+json">{壞掉</script>')).toBeNull();
    expect(parseCakeJobPage(ldScript({ '@type': 'JobPosting', title: 'PM' }))).toBeNull();
    expect(parseCakeJobPage('<meta property="og:title" content="隨便一個標題">')).toBeNull();
  });
});
