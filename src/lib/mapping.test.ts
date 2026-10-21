import { describe, expect, it } from 'vitest';
import { detectSource, extractUrl, fromRow, normalizeApp, safeUrl, toRow } from './mapping';
import { makeApp } from './testUtils';

const SHARE_TEXT = '我在104工作快找上發現了一個超適合你的內容，分享給你希望會喜歡~~';
const JOB_URL = 'https://www.104.com.tw/job/8wgp3';

describe('extractUrl', () => {
  it('從 104 分享訊息（有換行）取出連結並移除追蹤參數', () => {
    expect(extractUrl(`${SHARE_TEXT}\n${JOB_URL}?jobsource=ios_share`)).toBe(JOB_URL);
  });

  it('文字與連結之間沒有換行也能取出（iOS 單行欄位會吃掉換行）', () => {
    expect(extractUrl(`${SHARE_TEXT}${JOB_URL}?jobsource=ios_share`)).toBe(JOB_URL);
  });

  it('104 連結的 # 片段也會移除', () => {
    expect(extractUrl(`${JOB_URL}#apply`)).toBe(JOB_URL);
  });

  it('非 104 的連結保留查詢參數', () => {
    expect(extractUrl('看看這個 https://www.cake.me/jobs/abc?ref=x')).toBe('https://www.cake.me/jobs/abc?ref=x');
  });

  it('去掉連結結尾的標點與中文句號', () => {
    expect(extractUrl('https://www.linkedin.com/jobs/view/123/。')).toBe('https://www.linkedin.com/jobs/view/123/');
    expect(extractUrl('(https://example.com/a).')).toBe('https://example.com/a');
  });

  it('沒有連結時原樣回傳，手動輸入到一半也不受影響', () => {
    expect(extractUrl('')).toBe('');
    expect(extractUrl('ht')).toBe('ht');
    expect(extractUrl('www.104.com.tw/job/abc')).toBe('www.104.com.tw/job/abc');
  });

  it('只取第一個連結', () => {
    expect(extractUrl('https://a.example.com/1 https://b.example.com/2')).toBe('https://a.example.com/1');
  });
});

describe('safeUrl', () => {
  it('接受 http 與 https', () => {
    expect(safeUrl('https://example.com/a')).toBe('https://example.com/a');
    expect(safeUrl('http://example.com/')).toBe('http://example.com/');
  });

  it('沒有協定時補上 https://', () => {
    expect(safeUrl('www.104.com.tw/job/abc')).toBe('https://www.104.com.tw/job/abc');
  });

  it('擋掉危險或不支援的協定', () => {
    expect(safeUrl('javascript:alert(1)')).toBe('');
    expect(safeUrl('data:text/html,<b>x</b>')).toBe('');
    expect(safeUrl('ftp://example.com')).toBe('');
  });

  it('空值與非字串回傳空字串', () => {
    expect(safeUrl('')).toBe('');
    expect(safeUrl(undefined)).toBe('');
    expect(safeUrl(null)).toBe('');
  });
});

describe('detectSource', () => {
  it.each([
    [JOB_URL, '104'],
    ['https://m.104.com.tw/job/abc', '104'],
    ['https://www.cake.me/companies/x/jobs/y', 'Cake'],
    ['https://www.cakeresume.com/jobs/y', 'Cake'],
    ['https://www.linkedin.com/jobs/view/1', 'LinkedIn'],
    ['https://example.com', ''],
    ['', ''],
  ])('%s → %s', (url, expected) => {
    expect(detectSource(url)).toBe(expected);
  });
});

describe('normalizeApp', () => {
  it('沒有公司名稱的資料直接丟棄', () => {
    expect(normalizeApp({ company: '   ' })).toBeNull();
    expect(normalizeApp(null)).toBeNull();
    expect(normalizeApp('文字')).toBeNull();
  });

  it('不合法的狀態改成「已投遞」', () => {
    expect(normalizeApp({ company: 'A', status: 'hired' })?.status).toBe('applied');
  });

  it('物件原型上的屬性名稱不能被當成合法狀態', () => {
    expect(normalizeApp({ company: 'A', status: 'toString' })?.status).toBe('applied');
    expect(normalizeApp({ company: 'A', status: 'constructor' })?.status).toBe('applied');
  });

  it('未知來源歸類為「其他」，沒填就是空字串', () => {
    expect(normalizeApp({ company: 'A', source: 'Yourator' })?.source).toBe('其他');
    expect(normalizeApp({ company: 'A' })?.source).toBe('');
    expect(normalizeApp({ company: 'A', source: 'Cake' })?.source).toBe('Cake');
  });

  it('只保留真的存在的日期', () => {
    const app = normalizeApp({ company: 'A', appliedAt: '2026-02-30', followUpAt: '2026-10-20T08:00:00Z', lastContact: 'yesterday' });
    expect(app?.appliedAt).toBe('');
    expect(app?.followUpAt).toBe('2026-10-20');
    expect(app?.lastContact).toBe('');
  });

  it('不合格的 id 會重新產生 uuid，合格的保留', () => {
    const kept = '3708cf74-ee03-4489-bcee-99f070a0885b';
    expect(normalizeApp({ company: 'A', id: kept })?.id).toBe(kept);
    expect(normalizeApp({ company: 'A', id: 's1' })?.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('過濾危險連結並限制欄位長度', () => {
    const app = normalizeApp({ company: 'A'.repeat(200), url: 'javascript:alert(1)', note: 'x'.repeat(3000) });
    expect(app?.company).toHaveLength(120);
    expect(app?.url).toBe('');
    expect(app?.note).toHaveLength(2000);
  });
});

describe('toRow / fromRow', () => {
  it('來回轉換後內容不變', () => {
    const app = makeApp({ title: '前端工程師', source: '104', status: 'interview', appliedAt: '2026-10-20', followUpAt: '2026-10-27' });
    const row = { ...toRow(app), created_at: app.createdAt, updated_at: app.updatedAt };
    expect(fromRow(row)).toEqual(app);
  });

  it('空日期寫入資料庫時是 null', () => {
    const row = toRow(makeApp());
    expect(row.applied_at).toBeNull();
    expect(row.follow_up_at).toBeNull();
    expect(row.last_contact).toBeNull();
  });

  it('不寫入由資料庫負責的欄位', () => {
    const row = toRow(makeApp());
    expect(row).not.toHaveProperty('user_id');
    expect(row).not.toHaveProperty('created_at');
    expect(row).not.toHaveProperty('updated_at');
  });

  it('讀到未知的狀態或來源時回到安全的預設值', () => {
    const row = { ...toRow(makeApp()), status: 'weird', source: 'weird', created_at: '', updated_at: '' };
    const app = fromRow(row);
    expect(app.status).toBe('applied');
    expect(app.source).toBe('');
  });
});
