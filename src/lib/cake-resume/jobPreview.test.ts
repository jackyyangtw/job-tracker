import { describe, expect, it } from 'vitest';
import { parseCakeJobPage } from './jobPreview';

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
